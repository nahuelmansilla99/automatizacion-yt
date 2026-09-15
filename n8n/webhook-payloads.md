# Contratos de Comunicación JSON: n8n ↔ NestJS

Este documento detalla los formatos exactos de los datos transmitidos entre NestJS y n8n.

---

## 1. Disparo Inicial: NestJS ➔ n8n (Webhook Trigger)

Cuando el usuario ingresa una URL en el frontend de Angular, NestJS crea el registro en la base de datos con estado `PENDING` y envía una petición HTTP POST al Webhook Trigger de n8n.

* **Método:** `POST`
* **URL:** Configurada en la variable `N8N_WEBHOOK_URL` (ej. `http://n8n:5678/webhook/youtube-summary` o tu URL pública)
* **Headers:**
  ```http
  Content-Type: application/json
  X-Webhook-Secret: <valor_de_WEBHOOK_SECRET>
  ```
* **Payload JSON:**
  ```json
  {
    "id": "c3a9f2a4-5678-4a1b-9f0e-123456789abc",
    "youtubeUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  }
  ```

---

## 2. Vía de Éxito: n8n ➔ NestJS (`/api/webhooks/n8n-success`)

Cuando el flujo de n8n finaliza con éxito (obtiene metadatos, transcript, resumen con Gemini y sube el archivo `.md` a Google Drive), ejecuta un nodo **HTTP Request** apuntando a NestJS.

* **Método:** `POST`
* **URL:**
  * En red interna de Dokploy: `http://backend:3000/api/webhooks/n8n-success`
  * O vía dominio público: `https://resumen.tu-dominio.com/api/webhooks/n8n-success`
* **Headers:**
  ```http
  Content-Type: application/json
  X-Webhook-Secret: <valor_de_WEBHOOK_SECRET>
  ```
* **Payload JSON:**
  ```json
  {
    "id": "c3a9f2a4-5678-4a1b-9f0e-123456789abc",
    "videoTitle": "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    "channelName": "Rick Astley",
    "markdownContent": "# Resumen del Video\n\n## Ideas Clave\n- Punto 1...\n- Punto 2...\n\n#resumen #youtube"
  }
  ```

> [!NOTE]
> **Compatibilidad Flexible en NestJS:**
> El backend acepta indistintamente:
> * `videoTitle` o `title`
> * `channelName` o `channel`
> * `markdownContent`, `markdown` o `text`

---

## 3. Vía de Error: n8n ➔ NestJS (`/api/webhooks/n8n-error`)

Si algún nodo en n8n falla (ej. timeout en Supadata, error en la IA de Gemini, token de Google Drive vencido), el nodo global **Error Trigger** captura la excepción y ejecuta un nodo **HTTP Request** hacia NestJS.

* **Método:** `POST`
* **URL:**
  * En red interna de Dokploy: `http://backend:3000/api/webhooks/n8n-error`
  * O vía dominio público: `https://resumen.tu-dominio.com/api/webhooks/n8n-error`
* **Headers:**
  ```http
  Content-Type: application/json
  X-Webhook-Secret: <valor_de_WEBHOOK_SECRET>
  ```
* **Payload JSON:**
  ```json
  {
    "id": "c3a9f2a4-5678-4a1b-9f0e-123456789abc",
    "errorMessage": "Supadata API rate limit exceeded (429)",
    "failedNode": "Supadata Transcript"
  }
  ```

> [!NOTE]
> **Compatibilidad Flexible en NestJS:**
> El backend acepta indistintamente:
> * `errorMessage` o `message`
> * `failedNode` (opcional, para identificar en qué paso ocurrió el fallo)

---

## 4. Confirmación de Subida a Drive: n8n ➔ NestJS (Vía Respuesta Síncrona Segura)

Para maximizar la seguridad y no exponer **ningún** endpoint de entrada adicional en NestJS ni lidiar con túneles o Cloudflare Zero Trust OTP, n8n utiliza el nodo **Respond to Webhook** al final del flujo.

NestJS inicia la conexión saliente hacia n8n (`POST /drive-sync`) y n8n responde en esa misma conexión HTTP una vez que Google Drive completó la subida.

* **Nodo en n8n:** `Respond to Webhook` (`n8n-nodes-base.respondToWebhook`)
* **Código de respuesta:** `200 OK`
* **JSON devuelto a NestJS:**
  ```json
  {
    "success": true,
    "id": "c3a9f2a4-5678-4a1b-9f0e-123456789abc",
    "driveFileId": "1AbCdEfGhIjKlMnOpQrStUvWxYz",
    "driveFileName": "Rick Astley - Never Gonna Give You Up.md",
    "driveUrl": "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOpQrStUvWxYz/view"
  }
  ```

Al recibir esta respuesta, NestJS:
1. Registra el éxito en sus logs.
2. Emite el evento WebSocket `summary:driveSynced` hacia el frontend Angular para notificar en pantalla al usuario en tiempo real.
3. **Mantiene cerradas todas las puertas de entrada externas.**

