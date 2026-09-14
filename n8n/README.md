# Guía de Configuración de n8n: Micro-Worker de Google Drive (v3)

En la arquitectura actual, **NestJS realiza todo el procesamiento crítico de forma nativa** (obtención de metadata vía YouTube oEmbed, extracción de subtítulos vía Supadata y generación de resumen estructurado vía Google Gemini).

n8n se utiliza **exclusivamente como un micro-worker opcional para sincronizar el archivo `.md` en Google Drive (Obsidian)** en modo *Fire & Forget*, aprovechando la autenticación OAuth2 visual de Google sin bloquear a la aplicación web ni al usuario.

---

## 1. El Flujo en n8n: 3 Nodos Optimizados

En n8n, el nodo de Google Drive para subir archivos requiere **datos binarios** (`Binary Data`). Por tanto, el flujo consta de 4 nodos encadenados que operan de forma 100% segura sin exponer ningún endpoint en NestJS:

```
[ Webhook Trigger ] ──► [ Preparar Archivo (Code) ] ──► [ Google Drive: Upload ] ──► [ Respond to Webhook ]
```

1. **Webhook Trigger (POST `/drive-sync`):** Configurado con `Respond: Using 'Respond to Webhook' Node`. Espera a que el archivo se suba a Google Drive antes de responder a NestJS.
2. **Preparar Archivo Markdown (Code Node):** Sanitiza el título del video (eliminando caracteres prohibidos como `/`, `\`, `:`, `*`, `?`, `"`, `<`, `>`, `|`), genera el nombre `${videoTitle}.md` y convierte el texto Markdown en un buffer binario UTF-8 (`data`).
3. **Google Drive: Subir Archivo (Upload):** Recibe la propiedad binaria `data` y la sube a la carpeta de Obsidian seleccionada. Al finalizar, emite los metadatos del archivo en Drive (`id`, `name`, `webViewLink`).
4. **Respond to Webhook (Respuesta Segura):** Responde a la misma conexión HTTP saliente de NestJS con los datos del archivo en Google Drive. NestJS recibe la confirmación directamente y emite el evento WebSocket hacia Angular. **No se expone ningún webhook de entrada ni puerto en NestJS hacia internet.**

---

## 2. Instalación Rápida (Importar Workflow JSON)

Ya dispones del archivo exportado listo para usar en:
📁 `n8n/workflow-google-drive-sync.json`

### Pasos para importar en n8n:
1. Abre tu panel de n8n (ej. `https://n8n.ncodem.com`).
2. En la barra superior o menú de workflows, haz clic en **Add Workflow** o **Import from File...**.
3. Selecciona o copia y pega el contenido de `n8n/workflow-google-drive-sync.json`.
4. Haz clic en el nodo **Google Drive: Subir Archivo**:
   * En **Credential for Google Drive API**, selecciona tu cuenta de Google conectada (o crea una nueva mediante OAuth2).
   * En **Parents / Folder**, puedes seleccionar la carpeta específica donde guardas tus notas de Obsidian (o dejar la raíz).
5. **Guarda el workflow (Ctrl+S / Cmd+S)**.

---

## 3. URLs del Webhook (Test vs Producción)

n8n maneja dos URLs para cada Webhook:

| Modo | URL | Cuándo usarla |
| :--- | :--- | :--- |
| **Pruebas (Test)** | `https://n8n.tu-dominio.com/webhook-test/drive-sync` | Cuando haces clic en **"Listen for test event"** en n8n. |
| **Producción (Active)** | `https://n8n.tu-dominio.com/webhook/drive-sync` | Cuando activas el workflow (toggle **Active: ON** arriba a la derecha). |
| **Red interna Dokploy** | `http://n8n:5678/webhook/drive-sync` | Comunicación interna entre contenedores dentro de la misma red Docker. |

---

## 4. Configuración en NestJS (`.env`)

En tu archivo `.env` (y en `backend/.env`):

```env
# URL de producción de n8n
N8N_DRIVE_WEBHOOK_URL=https://n8n.tu-dominio.com/webhook/drive-sync

# Clave secreta enviada en la cabecera X-Webhook-Secret
WEBHOOK_SECRET=tu_secreto_seguro_aqui
```

---

## 5. Validación y Pruebas

### Opción A: Probar con el Script de Prueba (Sin consumir cuota de APIs)
Puedes ejecutar el script incluido:
```bash
# Probar contra el webhook de test de n8n:
./scripts/test-drive-sync.sh https://n8n.tu-dominio.com/webhook-test/drive-sync

# Probar contra el webhook activo de producción:
./scripts/test-drive-sync.sh https://n8n.tu-dominio.com/webhook/drive-sync tu_secreto_aqui
```

### Opción B: Desde la Aplicación Web (Frontend / API)
* Desde el frontend de Angular, abre el modal de cualquier resumen completado y pulsa el botón **"☁ Subir a Drive"**.
* O envía una petición manual al endpoint del backend:
  ```bash
  curl -X POST http://localhost:3000/api/summaries/<UUID-DEL-RESUMEN>/sync-drive
  ```

---

## 6. Ventajas del Enfoque v3

1. **Cero Dependencia:** Si n8n está apagado o Google Drive demora, el usuario ya tiene su resumen guardado en PostgreSQL y visible en la web.
2. **Cero Ping-Pong:** n8n no necesita enviar webhooks de confirmación ni de error hacia NestJS.
3. **Control Manual:** Puedes re-sincronizar notas existentes a Drive en cualquier momento con un solo clic.
