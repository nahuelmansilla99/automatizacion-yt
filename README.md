# Automatización de Resúmenes de YouTube (v3)

Plataforma integral para automatizar la extracción, transcripción y resumen de videos de YouTube con Inteligencia Artificial, almacenamiento en **Google Drive (Obsidian)** y visualización interactiva web con el tema **Obsidian Gruvbox**.

---

## 🏛️ Arquitectura del Sistema

* **Frontend:** Angular v21 (Standalone components, Signals, Reactive State Store, Tailwind CSS v4 con paleta Obsidian Gruvbox, selector y administrador de prompts).
* **Backend:** NestJS 11 (TypeORM con PostgreSQL, WebSockets con Socket.IO para notificaciones en vivo, validación estricta con class-validator).
  * **Pipeline Nativo:** Extracción vía YouTube oEmbed, transcripción vía Supadata Transcript API y síntesis con Google Gemini (`@google/genai`).
  * **Gestor de Prompts Dinámico:** Selección de plantillas personalizadas, tags, fallback a prompt predeterminado y congelamiento de snapshots inmutables por cada resumen.
  * **Persistencia Temprana y Caché de Transcripciones:** El texto de la transcripción se guarda de inmediato en PostgreSQL. En caso de reintentar tras un fallo de la IA o al ingresar una URL previamente analizada, se reutiliza el texto existente sin gastar tokens extra de Supadata.
* **Base de Datos:** PostgreSQL 16 con entidades `VideoSummary` y `Prompt`, claves foráneas no destructivas, volumen persistente dedicado y migraciones versionadas automáticas.
* **Automatización Secundaria:** Micro-worker en n8n para la sincronización de archivos Markdown en Google Drive (Obsidian) en modo *Fire & Forget*.
* **Infraestructura y Red:** VPS con Dokploy, Cloudflare Tunnels y capa de seguridad Zero Trust (Cloudflare Access con One-Time PIN) en `resumen.ncodem.com`.

---

## 📁 Estructura del Monorepo

```text
automatizacion-yt/
├── backend/                       # API NestJS, TypeORM, WebSockets Gateway
│   ├── .agents/skills/nestjs-dev/ # Skill de desarrollo backend
│   ├── src/                       # Código fuente modular
│   ├── Dockerfile                 # Imagen Docker multi-stage
│   └── package.json
│
├── frontend/                      # Aplicación Angular v21
│   ├── .agents/skills/angular-dev/# Skill de desarrollo frontend
│   ├── src/                       # Componentes Standalone, Signals Store
│   ├── Dockerfile                 # Multi-stage Angular + Nginx
│   └── package.json
│
├── n8n/                           # Documentación y adaptación del flujo en Dokploy
│   ├── README.md                  # Guía paso a paso para configurar los nodos
│   └── webhook-payloads.md        # Contratos JSON exactos
│
├── docker/                        # Configuraciones de contenedores
│   ├── docker-compose.dev.yml     # PostgreSQL local en puerto 5434
│   └── docker-compose.dokploy.yml # Stack completo para Dokploy
│
├── contexto-arquitectura-resumen-yt.md # Documento de contexto general
└── README.md
```

---

## 🚀 Inicio Rápido en Desarrollo Local

### Opción A: Levantar Todo con un Solo Comando (Recomendado) 🐳

En la raíz del proyecto, ejecuta:

```bash
docker compose up --build
```

Esto compilará y levantará automáticamente:
1. **PostgreSQL** (en el puerto aislado `5434` con volumen propio).
2. **Backend NestJS** (en el puerto `3000`).
3. **Frontend Angular + Nginx** (en el puerto `8080`).

👉 Abre tu navegador en: **`http://localhost:8080`**

---

### Opción B: Desarrollo Nativo con Recarga en Caliente (HMR)

Si estás modificando código y quieres recarga automática instantánea:

#### 1. Levantar solo la Base de Datos PostgreSQL
```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

#### 2. Iniciar el Backend (NestJS)
```bash
cd backend
npm run start:dev
```
Backend disponible en `http://localhost:3000/api`.

#### 3. Iniciar el Frontend (Angular)
```bash
cd frontend
npm start
```
Frontend disponible en `http://localhost:4200`.

---

## 🧪 Pruebas Automatizadas

```bash
# Pruebas del Backend (Vitest)
cd backend
npm test

# Pruebas del Frontend (Angular Unit Tests)
cd frontend
npm test -- --watch=false
```

---

## 🚢 Despliegue en Dokploy

1. En tu panel de Dokploy, crea una nueva aplicación basada en Docker Compose o despliega los servicios usando `docker/docker-compose.dokploy.yml`.
2. Asigna las variables de entorno en Dokploy:
   * `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`
   * `WEBHOOK_SECRET` (secreto compartido con n8n)
   * `N8N_WEBHOOK_URL` (ej. `http://n8n:5678/webhook/youtube-summary`)
   * `SUPADATA_API_KEY` (tu clave de Supadata)
3. Conecta el subdominio `resumen.ncodem.com` apuntando al servicio `frontend` (puerto 80).
4. El contenedor de Nginx del frontend redirigirá automáticamente el tráfico de `/api/` y `/socket.io/` hacia el contenedor del `backend` en la red interna `dokploy-network`.
