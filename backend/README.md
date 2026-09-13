# Backend - Automatización de Resúmenes de YouTube

API modular construida con **NestJS 11**, **TypeORM**, **PostgreSQL** y **WebSockets (Socket.IO)** encargada de orquestar el ciclo de vida completo de extracción, transcripción, síntesis con IA y sincronización de videos de YouTube.

---

## 🏗️ Arquitectura y Responsabilidades

El backend actúa como el **cerebro y orquestador principal** del sistema:
1. **Extracción de Metadatos:** Consulta la API pública de YouTube oEmbed para obtener título y canal sin consumir cuota de Supadata ni Google Cloud.
2. **Transcripción Inteligente con Supadata:** Obtiene subtítulos de YouTube vía Supadata Transcript API.
3. **Persistencia Temprana y Caché de Transcripciones:**
   - La transcripción (`transcript`) se persiste en la base de datos **inmediatamente al recibirla**, antes de procesar el resumen.
   - En caso de reintentar (`POST /api/summaries/:id/retry`) tras un fallo en Gemini, el backend detecta el `transcript` ya guardado y **omite la llamada a Supadata**, consumiendo **0 créditos**.
   - Si se solicita un video cuya URL ya fue transcripta y resumida con éxito previamente, se reutiliza la transcripción existente.
4. **Síntesis con IA (Google Gemini):** Transforma la transcripción en una nota analítica estructurada para Obsidian (formato Markdown con frontmatter, resumen ejecutivo, ideas clave, joyas ocultas y accionables) utilizando `@google/genai`.
5. **Notificaciones en Tiempo Real:** Emite eventos vía WebSockets (`summaryCreated`, `summaryUpdated`, `summaryError`, `summaryDeleted`) para actualizar el frontend reactivo de forma instantánea.
6. **Sincronización Opcional con Google Drive:** Dispara en segundo plano (*Fire & Forget*) un webhook a n8n para subir la nota en formato `.md` a Google Drive.
7. **Monitoreo de Cuota Supadata:** Endpoint con caché en memoria (TTL 5 min) para auditar créditos consumidos y disponibles de Supadata (`GET /v1/me`).

---

## 📁 Estructura del Código

```text
backend/src/
├── app.module.ts                       # Módulo raíz
├── main.ts                             # Bootstrap de la aplicación y configuración de CORS
│
├── core/                               # Configuración transversal
│   ├── config/env.validation.ts        # Validación de variables de entorno con Joi
│   ├── database/
│   │   ├── data-source.ts              # Data Source para CLI de TypeORM
│   │   ├── database.module.ts          # Conexión asíncrona a PostgreSQL con migrationsRun: true
│   │   └── migrations/
│   │       ├── 1789051606168-InitialSchema.ts
│   │       ├── 1789051700000-AddTranscriptColumn.ts
│   │       └── index.ts                # Registro centralizado de migraciones
│   ├── filters/all-exceptions.filter.ts
│   └── guards/webhook-secret.guard.ts
│
├── features/
│   ├── summaries/                      # Módulo principal de resúmenes
│   │   ├── dto/                        # DTOs de creación y filtrado/paginado
│   │   ├── entities/video-summary.entity.ts # Entidad TypeORM VideoSummary
│   │   ├── services/
│   │   │   ├── transcription.service.ts # Integración con oEmbed y Supadata
│   │   │   ├── gemini.service.ts        # Síntesis con SDK oficial de Google Gemini
│   │   │   └── drive-sync.service.ts    # Despacho hacia n8n para Google Drive
│   │   ├── summaries.controller.ts     # Endpoints REST
│   │   └── summaries.service.ts        # Orquestador del pipeline asíncrono y reintentos
│   │
│   ├── metrics/                        # Métricas globales y cuota de Supadata
│   │   ├── metrics.controller.ts
│   │   └── metrics.service.ts
│   │
│   ├── notifications/                  # WebSockets
│   │   └── summaries.gateway.ts        # Gateway de Socket.IO
│   │
│   └── webhooks/                       # Receptores de webhooks complementarios
│       ├── webhooks.controller.ts
│       └── webhooks.service.ts
```

---

## 🗄️ Esquema de Base de Datos (`video_summaries`)

| Campo | Tipo | Descripción |
| :--- | :--- | :--- |
| `id` | `uuid` (PK) | Identificador único generado con `uuid_generate_v4()`. |
| `youtubeUrl` | `varchar(500)` | URL del video de YouTube (indexado). |
| `videoTitle` | `varchar(255)` | Título del video (obtenido vía oEmbed o Supadata). |
| `channelName` | `varchar(255)` | Nombre del canal o autor. |
| `transcript` | `text` (nullable) | Transcripción completa almacenada para evitar re-consultas a Supadata. |
| `markdownContent`| `text` (nullable) | Contenido del resumen en formato Markdown para Obsidian. |
| `status` | `enum` | Estado del procesamiento: `PENDING`, `SUCCESS`, `ERROR`. |
| `errorMessage` | `text` (nullable) | Mensaje detallado del error en caso de fallo. |
| `createdAt` | `timestamptz` | Fecha de creación del registro. |
| `updatedAt` | `timestamptz` | Fecha de última actualización. |

---

## 🔄 Migraciones de Base de Datos

Las migraciones se ejecutan automáticamente al iniciar el servidor (`migrationsRun: true` en [database.module.ts](file:///Users/nahuelmansilla/Documents/1.%20Proyectos/Desarrollo%20web/automatizacion-resumen-yt/backend/src/core/database/database.module.ts)).

Historial de migraciones:
1. `1789051606168-InitialSchema`: Crea la extensión `uuid-ossp`, el tipo ENUM de estados, la tabla `video_summaries` y sus índices.
2. `1789051700000-AddTranscriptColumn`: Agrega la columna `transcript` a la tabla `video_summaries`.

---

## 🌐 Endpoints REST Principales

### Resúmenes (`/api/summaries`)
* **`POST /api/summaries`**
  - **Body:** `{ "youtubeUrl": "https://www.youtube.com/watch?v=..." }`
  - **Respuesta (202 Accepted):** Retorna el registro inicial en estado `PENDING` y arranca el procesamiento en segundo plano.
* **`GET /api/summaries`**
  - **Query params:** `page` (default: 1), `limit` (default: 10), `status`, `search`.
  - Retorna lista paginada y conteo total.
* **`GET /api/summaries/:id`**
  - Retorna el detalle completo de un resumen por UUID.
* **`POST /api/summaries/:id/retry`**
  - Reinicia el pipeline en estado `PENDING`. Si ya existe `transcript`, omite Supadata y llama directamente a Gemini.
* **`POST /api/summaries/:id/sync-drive`**
  - Fuerza la sincronización manual del archivo `.md` con Google Drive vía n8n.
* **`DELETE /api/summaries/:id`**
  - Elimina el resumen de la base de datos y emite notificación WebSocket.

### Métricas (`/api/metrics`)
* **`GET /api/metrics`**
  - Retorna el conteo de resúmenes por estado y los créditos de Supadata (`maxCredits`, `usedCredits`, `remainingCredits`, `cachedAt`).
  - Admite `?refresh=true` para forzar la actualización ignorando la caché.

---

## ⚙️ Variables de Entorno (`.env`)

```env
NODE_ENV=development
PORT=3000

# Base de datos PostgreSQL
DATABASE_HOST=localhost
DATABASE_PORT=5434
DATABASE_USER=resumen_user
DATABASE_PASSWORD=resumen_password
DATABASE_NAME=resumen_db
DATABASE_SYNCHRONIZE=false

# Supadata API
SUPADATA_API_KEY=tu_clave_supadata

# Google Gemini API
GEMINI_API_KEY=tu_clave_gemini
GEMINI_MODEL=gemini-2.5-flash

# Integración n8n (Google Drive micro-worker)
N8N_DRIVE_WEBHOOK_URL=https://n8n.ncodem.com/webhook/drive-sync
WEBHOOK_SECRET=tu_secreto_compartido
```

---

## 🧪 Pruebas Automatizadas

El backend utiliza **Vitest** como test runner de alta velocidad:

```bash
# Ejecutar todas las pruebas unitarias
npm test

# Ejecutar pruebas en modo observador (watch)
npm run test:watch
```
