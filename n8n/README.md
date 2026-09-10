# Guía de Adaptación del Flujo Existente de n8n en Dokploy

Esta guía explica paso a paso los únicos cambios necesarios para conectar tu flujo existente de n8n en Dokploy con la nueva plataforma de resúmenes.

---

## 1. Nodo Inicial: Webhook Trigger

En tu flujo de n8n, reemplaza cualquier trigger manual o de prueba por un nodo **Webhook**:

1. **Crear o editar nodo "Webhook"**:
   * **HTTP Method:** `POST`
   * **Path:** `youtube-summary`
   * **Authentication:** None (la seguridad la manejamos con el header `X-Webhook-Secret`)
   * **Respond:** `Immediately` con código `200 OK`
2. **Obtener la URL**:
   * En Dokploy, si n8n comparte la red `dokploy-network` con el backend, NestJS lo llamará directamente como:
     `http://n8n:5678/webhook/youtube-summary`
   * Si prefieres usar la URL con dominio de n8n, usa:
     `https://tu-n8n.ncodem.com/webhook/youtube-summary`
   * Coloca esa URL en el archivo `.env` del backend en la variable:
     `N8N_WEBHOOK_URL`

3. **Datos de entrada recibidos en n8n:**
   Al dispararse el flujo, el nodo Webhook tendrá disponible:
   * `{{ $json.body.id }}`: UUID del registro en PostgreSQL.
   * `{{ $json.body.youtubeUrl }}`: URL del video enviada desde Angular.

---

## 2. Ajuste de los Nodos Intermedios

* **Supadata Metadata / Transcript:**
  * En el parámetro de URL o ID del video, pasa `{{ $('Webhook').first().json.body.youtubeUrl }}`.
* **LLM Chain (Gemini):**
  * Sigue procesando el texto del transcript como lo tienes configurado.
* **Google Drive Upload:**
  * Sigue subiendo el `.md` a tu carpeta de Obsidian en Drive.

---

## 3. Nodo Final de Éxito: HTTP Request

Al final de tu flujo principal (después de subir el archivo a Google Drive):

1. Agrega un nodo **HTTP Request**:
   * **Method:** `POST`
   * **URL:**
     * Si están en la misma red de Dokploy: `http://backend:3000/api/webhooks/n8n-success`
     * O por dominio público: `https://resumen.ncodem.com/api/webhooks/n8n-success`
   * **Send Headers:** Activado
     * Header 1: `Content-Type` = `application/json`
     * Header 2: `X-Webhook-Secret` = `{{ $env.WEBHOOK_SECRET || 'mi_super_secreto_webhook_12345' }}` (el mismo secreto configurado en el `.env` de NestJS)
   * **Send Body:** Activado (JSON)
     ```json
     {
       "id": "{{ $('Webhook').first().json.body.id }}",
       "videoTitle": "{{ $('Supadata Metadata').first().json.title }}",
       "channelName": "{{ $('Supadata Metadata').first().json.channel }}",
       "markdownContent": "{{ $('Gemini').first().json.text }}"
     }
     ```
   *(Adapta los nombres entre corchetes `$('')` a los nombres exactos de tus nodos en n8n)*.

---

## 4. Flujo Secundario de Error: Error Trigger

Para auditar y mostrar en Angular exactamente qué falló si ocurre un error en cualquier nodo:

1. Crea un workflow nuevo en n8n llamado `YouTube Summary - Error Handler`.
2. Agrega el nodo **Error Trigger**:
   * Este nodo se activa automáticamente cuando cualquier workflow asociado lanza un error no capturado.
3. Conéctalo a un nodo **HTTP Request**:
   * **Method:** `POST`
   * **URL:** `http://backend:3000/api/webhooks/n8n-error` (o `https://resumen.ncodem.com/api/webhooks/n8n-error`)
   * **Headers:**
     * `Content-Type`: `application/json`
     * `X-Webhook-Secret`: `<tu_secreto_configurado>`
   * **Body (JSON):**
     ```json
     {
       "id": "{{ $json.execution.error.id || $('Webhook').first().json.body.id }}",
       "errorMessage": "{{ $json.execution.error.message }}",
       "failedNode": "{{ $json.execution.lastNodeExecuted }}"
     }
     ```
4. En el workflow principal, ve a **Settings** (ícono de engranaje) y en **Error Workflow** selecciona `YouTube Summary - Error Handler`.

---

## 5. ¡Listo!
Con estos nodos configurados:
1. Angular enviará la URL.
2. NestJS la guardará y despertará a n8n.
3. n8n completará el resumen, lo subirá a Google Drive y avisará a NestJS.
4. NestJS actualizará la base de datos y notificará en vivo al frontend mediante WebSockets.
