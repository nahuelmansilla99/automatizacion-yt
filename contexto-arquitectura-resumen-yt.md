# Arquitectura del Proyecto: Automatización de Resúmenes de YouTube (v2)

**Autor:** Nahuel Mansilla
**Fecha de Documentación:** Septiembre 2026

---

## 1. Descripción General del Proyecto

El proyecto consiste en una plataforma web integral diseñada para automatizar la extracción, transcripción y resumen de videos de YouTube. El resultado final se guarda como un archivo `.md` en Google Drive (para Obsidian) y simultáneamente se almacena el contenido en texto plano en la base de datos para una futura previsualización web.

El sistema permite ingresar enlaces de YouTube, hacer un seguimiento asíncrono en tiempo real, visualizar el historial, auditar errores de ejecución y gestionar la cuota mensual de la API externa de transcripción (Supadata).

## 2. Infraestructura y Seguridad (Red)

*   **Hosting:** Servidor Virtual Privado (VPS) administrado mediante **Dokploy**. Contenedores Docker para n8n, Angular, NestJS y PostgreSQL.
*   **Gestión de Dominio y DNS:** Dominio `ncodem.com` gestionado a través de **Cloudflare**.
*   **Acceso y Exposición:** **Cloudflare Tunnels** enruta el tráfico de forma segura hacia Dokploy.
*   **Capa de Seguridad Zero Trust:** **Cloudflare Access** protege el dominio (`resumenes.ncodem.com`) mediante One-Time PIN enviado al correo del administrador.

## 3. Stack Tecnológico

### Frontend: Angular
*   **Dashboard:** Input de URL, botón de ejecución y panel de métricas de Supadata.
*   **Tabla de Historial:** Muestra el título, canal, fecha, estado (`PENDING`, `SUCCESS`, `ERROR`) y un botón futuro para "Ver Resumen" (leyendo el Markdown de la BD).
*   **Notificaciones:** Alertas de errores capturados desde n8n mostrando el motivo exacto del fallo.

### Backend: NestJS
*   **Orquestador:** API REST (protegida con JWT) y WebSockets/SSE para comunicación en tiempo real con Angular.
*   **Webhooks Receptores:** 
    *   `/api/webhooks/n8n-success`: Recibe la confirmación y el contenido del resumen generado.
    *   `/api/webhooks/n8n-error`: Recibe los logs detallados si el flujo falla.

### Base de Datos: PostgreSQL
Esquema actualizado (`VideoSummary`) para soportar contenido y depuración:
*   `id`: UUID (Primary Key).
*   `youtubeUrl`: String.
*   `videoTitle`: String.
*   `channelName`: String.
*   `markdownContent`: Text (Almacena el resumen para el previsualizador en Angular).
*   `status`: Enum/String (`PENDING`, `SUCCESS`, `ERROR`).
*   `errorMessage`: Text (Almacena el log de n8n en caso de fallo, ej. "Supadata API Timeout").
*   `createdAt`: Timestamp.
*   `updatedAt`: Timestamp.

### Automatización: n8n (Dockerizado)
*   **Flujo Principal:**
    1.  **Webhook Trigger:** Recibe URL y el `id` de registro desde NestJS.
    2.  **Supadata /metadata & /transcript:** Descarga de datos.
    3.  **LLM Chain (Gemini Chat Model):** Genera el resumen en formato Markdown (Retry on fail: 5 tries).
    4.  **Convert & Upload:** Sube el `.md` a Google Drive.
    5.  **Webhook Success:** Envía un POST a NestJS (`/api/webhooks/n8n-success`) con el texto del Markdown y el `id`.
*   **Flujo de Errores (Error Trigger):**
    *   Flujo secundario configurado globalmente para el principal.
    *   Si cualquier nodo falla (ej. cuota excedida en Supadata o caída de la IA), el nodo **Error Trigger** captura el `error.message` y el nombre del nodo problemático.
    *   Ejecuta un HTTP Request apuntando a `/api/webhooks/n8n-error` enviando el log a NestJS para actualizar la BD y notificar al frontend.

## 4. Flujo de Ejecución Asíncrona
1.  Angular envía la URL a NestJS.
2.  NestJS crea el registro (`PENDING`), dispara n8n y responde `202 Accepted` a Angular.
3.  n8n procesa la solicitud.
4.  **Vía Éxito:** n8n guarda en Drive y hace POST a NestJS con el Markdown. NestJS actualiza a `SUCCESS`, guarda el texto y notifica por WebSocket.
5.  **Vía Error:** El Error Workflow captura el fallo y hace POST a NestJS. NestJS actualiza a `ERROR`, guarda el log en `errorMessage` y notifica al usuario por WebSocket para que vea qué falló.