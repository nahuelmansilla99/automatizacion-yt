# Arquitectura del Proyecto: Automatización de Resúmenes de YouTube (v3 - Pipeline Nativo Híbrido)

**Autor:** Nahuel Mansilla  
**Fecha de Documentación:** Septiembre 2026  

---

## 1. Descripción General del Proyecto

El proyecto consiste en una plataforma web integral diseñada para automatizar la extracción, transcripción y resumen inteligente de videos de YouTube con Inteligencia Artificial. El resultado final se almacena en PostgreSQL para previsualización inmediata en el frontend (Angular) y, simultáneamente, se sincroniza como un archivo `.md` en Google Drive (para Obsidian) a través de un micro-worker opcional en n8n.

El sistema permite ingresar enlaces de YouTube, hacer un seguimiento asíncrono en tiempo real mediante WebSockets, visualizar el historial, auditar errores con trazabilidad exacta y consultar la cuota mensual de la API externa de transcripción (Supadata).

## 2. Infraestructura y Seguridad (Red)

*   **Hosting:** Servidor Virtual Privado (VPS) administrado mediante **Dokploy**. Contenedores Docker para Angular, NestJS, PostgreSQL y n8n (worker).
*   **Gestión de Dominio y DNS:** Dominio `ncodem.com` gestionado a través de **Cloudflare**.
*   **Acceso y Exposición:** **Cloudflare Tunnels** enruta el tráfico de forma segura hacia Dokploy.
*   **Capa de Seguridad Zero Trust:** **Cloudflare Access** protege el dominio (`resumenes.ncodem.com`) mediante One-Time PIN enviado al correo del administrador.

## 3. Stack Tecnológico

### Frontend: Angular
*   **Dashboard:** Input de URL, botón de ejecución y panel de métricas de Supadata.
*   **Tabla de Historial:** Muestra el título, canal, fecha, estado (`PENDING`, `SUCCESS`, `ERROR`) y modal/botón para "Ver Resumen" (renderizando el Markdown directamente de la BD).
*   **Notificaciones en Tiempo Real:** WebSocket/SSE recibiendo cambios de estado (`summaryCreated`, `summaryUpdated`, `summaryError`, `summaryDeleted`).

### Backend: NestJS (Cerebro y Orquestador del Pipeline)
*   **API REST & WebSockets:** Controladores para crear y consultar resúmenes; Gateway para emisión en tiempo real a clientes conectados.
*   **TranscriptionService:** 
    *   Extrae título y canal mediante **YouTube oEmbed** (público, rápido, 0 créditos).
    *   Extrae los subtítulos del video mediante **Supadata Transcript API**.
*   **GeminiService:**
    *   Integración oficial con `@google/genai` (modelo `gemini-1.5-flash`).
    *   Prompt de sistema optimizado para notas de Obsidian (frontmatter, resumen ejecutivo, conceptos clave, ideas principales y conclusiones).
*   **DriveSyncService:**
    *   Despacha en modo *Fire & Forget* hacia n8n para la subida a Google Drive.
    *   No bloquea el estado del resumen ni afecta la experiencia del usuario.

### Base de Datos: PostgreSQL
Esquema (`VideoSummary`):
*   `id`: UUID (Primary Key).
*   `youtubeUrl`: String.
*   `videoTitle`: String.
*   `channelName`: String.
*   `markdownContent`: Text (Almacena el resumen generado por Gemini).
*   `status`: Enum (`PENDING`, `SUCCESS`, `ERROR`).
*   `errorMessage`: Text (Almacena la causa exacta en caso de fallo).
*   `createdAt`: Timestamp.
*   `updatedAt`: Timestamp.

### Automatización Secundaria: n8n (Micro-Worker de Drive)
*   **Flujo Simplificado (2 Nodos):**
    1.  **Webhook Trigger:** Recibe `{ id, videoTitle, channelName, markdownContent, youtubeUrl }` desde NestJS con cabecera `X-Webhook-Secret`.
    2.  **Google Drive Node:** Sube o actualiza el archivo `.md` en la carpeta configurada de Obsidian.
    *   *Nota:* Ya no requiere Error Triggers complejos ni webhooks de retorno a NestJS.

## 4. Flujo de Ejecución Asíncrona

```
[ Angular ] ──(1. POST /api/summaries)──> [ NestJS ] ──(2. Responde 201 Created)──> [ Angular ]
                                              │
                                              ▼ (3. Background Pipeline)
                                  ┌─────────────────────────────┐
                                  │ a. YouTube oEmbed (metadata)│
                                  │ b. Supadata (subtítulos)    │
                                  │ c. Google Gemini (resumen)  │
                                  │ d. Guarda en PostgreSQL     │
                                  └─────────────────────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    ▼ (Éxito)                                           ▼ (Fallo)
         [ Status: SUCCESS ]                                   [ Status: ERROR ]
         [ WebSocket: summaryUpdated ]                         [ WebSocket: summaryError ]
                    │
                    ▼ (Fire & Forget en background)
         [ n8n: Subir a Google Drive ]
```

1.  Angular envía la URL a NestJS.
2.  NestJS crea el registro en PostgreSQL (`PENDING`), emite evento WebSocket `summaryCreated` y responde inmediatamente al frontend.
3.  NestJS ejecuta el pipeline en segundo plano:
    *   **Vía Éxito:** Se consulta oEmbed y Supadata, Gemini genera el Markdown, NestJS actualiza el registro en base de datos a `SUCCESS` y notifica por WebSocket. En paralelo, dispara la sincronización secundaria con Drive hacia n8n.
    *   **Vía Error:** El bloque `try/catch` nativo en NestJS captura el fallo exacto (ej. video sin subtítulos, error de cuota o URL inválida), actualiza a `ERROR`, almacena el mensaje descriptivo en `errorMessage` y emite `summaryError` vía WebSocket inmediatamente.