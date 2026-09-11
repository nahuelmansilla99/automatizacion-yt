# Guía de Configuración de n8n: Micro-Worker de Google Drive (v3)

En la nueva arquitectura, **NestJS realiza todo el procesamiento crítico de forma nativa** (obtención de metadata vía YouTube oEmbed, extracción de transcripción vía Supadata y generación de resumen inteligente vía Google Gemini).

n8n se utiliza **exclusivamente como un micro-conector opcional para subir el archivo `.md` a Google Drive (Obsidian)** en modo *Fire & Forget*, aprovechando la autenticación visual OAuth de Google sin bloquear a la aplicación web.

---

## 1. El Flujo en n8n: Solo 2 Nodos

El flujo ya no necesita llamar a Supadata, Gemini ni devolver webhooks de éxito o error a NestJS. Consta únicamente de dos nodos:

```
[ Webhook Trigger ]  ──>  [ Google Drive: Upload File ]
```

---

## 2. Configuración Paso a Paso

### Paso 1: Nodo "Webhook" (Trigger)
1. Crea un nuevo Workflow en n8n llamado `Google Drive - Obsidian Sync`.
2. Agrega el nodo **Webhook**:
   * **HTTP Method:** `POST`
   * **Path:** `drive-sync`
   * **Authentication:** None (la seguridad se valida por cabecera).
   * **Respond:** `Immediately` con código `200 OK`.
3. **URL del Webhook:**
   * En Dokploy (red interna): `http://n8n:5678/webhook/drive-sync`
   * O dominio público: `https://n8n.ncodem.com/webhook/drive-sync`
   * Configura esa URL en el `.env` de NestJS en:
     ```env
     N8N_DRIVE_WEBHOOK_URL=http://n8n:5678/webhook/drive-sync
     ```
4. **Datos que recibe el Webhook desde NestJS:**
   ```json
   {
     "id": "uuid-del-resumen",
     "videoTitle": "Título del video",
     "channelName": "Nombre del canal",
     "markdownContent": "# Contenido del resumen en Markdown...",
     "youtubeUrl": "https://www.youtube.com/watch?v=..."
   }
   ```

---

### Paso 2: Nodo "Google Drive" (Subir archivo)
1. Conecta la salida del nodo Webhook a un nodo **Google Drive**:
   * **Resource:** `File`
   * **Operation:** `Upload`
   * **Credential:** Tu cuenta de Google Drive conectada.
   * **File Name:** `{{ $json.body.videoTitle.replace(/[/\\?%*:|"<>]/g, '-') }}.md`
   * **Binary Data:** Desactivado (o subir contenido como texto directo).
   * **File Content:** `{{ $json.body.markdownContent }}`
   * **Folder:** Selecciona tu carpeta de Obsidian en Google Drive.

---

## 3. Ventajas de este Enfoque

1. **Cero Dependencia:** Si n8n está apagado o Google Drive demora, el usuario en la aplicación web ya tiene su resumen guardado en la base de datos y visible en pantalla.
2. **Cero Ping-Pong de Webhooks:** n8n ya no necesita avisarle nada a NestJS.
3. **Sin flujos de error complejos:** Ya no se requiere configurar Error Trigger Workflows en n8n, ya que todo el manejo de errores del procesamiento reside de forma segura en NestJS.

