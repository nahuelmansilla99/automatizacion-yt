# Frontend - Automatización de Resúmenes de YouTube

Aplicación web desarrollada en **Angular v21** con **Standalone Components**, **Signals Store**, **Tailwind CSS v4** y una paleta inspirada en **Obsidian Gruvbox**.

---

## 🎨 Características Principales

* **Dashboard Unificado:**
  * **Card de Envío de URL:** Validación de URLs de YouTube, selector de prompt opcional (o uso del predeterminado) y envío al backend para procesamiento asíncrono.
  * **Card de Métricas de Supadata:** Consulta de créditos consumidos, créditos restantes y porcentaje de cuota utilizada con soporte de refresco manual.
  * **Tabla de Historial:** Listado de resúmenes con paginación, filtros por estado (`PENDING`, `SUCCESS`, `ERROR`), badge del prompt utilizado y búsqueda por título.
* **Gestor de Prompts (`/prompts`):**
  * Vista dedicada para listar, crear, editar y previsualizar plantillas de prompts.
  * Configuración rápida del prompt predeterminado del sistema (`isDefault`).
  * Clasificación por etiquetas (tags) y monitoreo de métricas de uso acumulado (`usageCount`).
* **Reactividad en Tiempo Real:**
  * Conexión WebSockets con Socket.IO para actualizar el estado del resumen en pantalla inmediatamente al cambiar (`summaryCreated`, `summaryUpdated`, `summaryError`, `summaryDeleted`).
* **Visor de Resúmenes (Markdown / Obsidian):**
  * Modal interactivo que renderiza el Markdown generado por Gemini con estilos adaptados a Obsidian.
  * Botón para copiar al portapapeles y botón para disparar la sincronización manual hacia Google Drive vía n8n.
* **Manejo de Errores y Reintentos:**
  * Visualización clara del mensaje de error exacto (ej. sin subtítulos, cuota excedida).
  * Botón de **Reintentar** que reejecuta el resumen en el backend sin volver a consumir créditos de Supadata si la transcripción ya fue obtenida.

---

## 📁 Estructura del Proyecto

```text
frontend/src/app/
├── core/
│   ├── models/
│   │   ├── summary.model.ts           # Interfaces VideoSummary y métricas Supadata
│   │   └── prompt.model.ts            # Interfaces Prompt, Create/Update DTOs y respuestas
│   └── services/
│       ├── summary-api.service.ts     # Cliente HTTP hacia la API de resúmenes
│       ├── prompt-api.service.ts      # Cliente HTTP hacia la API de prompts
│       ├── websocket.service.ts       # Conexión Socket.IO con el backend
│       └── toast.service.ts           # Notificaciones visuales de usuario
│
├── features/
│   ├── dashboard/                     # Módulo del panel principal
│   │   ├── components/
│   │   │   ├── url-input-card/        # Formulario de entrada con selector de prompt
│   │   │   ├── supadata-metrics-card/ # Visualización de créditos y consumo
│   │   │   ├── summary-table/         # Tabla de historial y estados
│   │   │   ├── summary-modal/         # Previsualización del Markdown generado
│   │   │   └── error-modal/           # Detalle del fallo
│   │   ├── store/summaries.store.ts   # Signal Store reactivo para resúmenes y métricas
│   │   └── dashboard.ts               # Componente contenedor del Dashboard
│   │
│   └── prompts/                       # Módulo de administración de plantillas
│       ├── components/
│       │   ├── prompt-list/           # Listado de prompts con acciones y badges
│       │   ├── prompt-form-modal/     # Modal de creación y edición de prompts
│       │   └── prompt-detail-modal/   # Previsualización completa de instrucciones
│       └── prompts.ts                 # Componente principal de la sección de Prompts
│
└── shared/
    └── components/                    # Navbar, StatusBadge, ToastContainer
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo local (http://localhost:4200)
npm start

# Ejecutar pruebas unitarias
npm test

# Compilación de producción
npm run build
```
