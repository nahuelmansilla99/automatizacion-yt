# Frontend - SHYT (Summary Hub YouTube)

Aplicación web desarrollada en **Angular v21** con **Standalone Components**, **Signals Store**, **Tailwind CSS v4** y un sistema de diseño retro-futurista **Retro CRT Terminal** en fósforo ámbar (inspirado en [Basement AI](https://basement.studio/ai/home)).

---

## 📺 Sistema de Diseño Retro CRT Terminal

La interfaz emula un monitor de tubo de rayos catódicos (CRT) de fósforo ámbar monocromático de alta fidelidad, trasladando toda la interacción a una experiencia inmersiva de terminal informática retro:

### 1. Paleta de Fósforo Ámbar
Definida mediante variables CSS dinámicas en `frontend/src/styles.css`:
* `--terminal-base: #ff4d00;` — Naranja/ámbar de fósforo primario para texto, bordes y foco interactivo.
* `--terminal-glow: #ff4d0059;` — Resplandor difuso de fósforo activo.
* `--terminal-dim: rgba(255, 77, 0, 0.45);` — Nivel secundario/tenue para marcas de agua, prefijos de consola y metadatos.
* `--terminal-border: rgba(255, 77, 0, 0.25);` — Bordes discretos de cuadrícula y separadores ASCII.
* `--terminal-bg: #09090b;` — Negro profundo antirreflejo del tubo de imagen.

### 2. Tipografía y Resplandor (Geist Mono SemiBold)
* **Familia:** `'Geist Mono', 'Geist Mono Regular', monospace`.
* **Peso tipográfico:** `600` (SemiBold) predeterminado para otorgar cuerpo y legibilidad uniforme idéntica a terminales VT100 / consolas retro.
* **Text Shadow CRT:** `.machine-screen` incorpora un resplandor óptico de fósforo:
  ```css
  text-shadow: 0 0 6px rgba(255, 77, 0, 0.35);
  ```
* **Renderizado:** Optimizado con `text-rendering: optimizeLegibility` y suavizado antialias.

### 3. Capa de Efectos de Monitor CRT (`crt-overlay`)
Componente compartido (`app-crt-overlay`) que envuelve la aplicación y proyecta:
* **Scanlines:** Gradiente lineal repetitivo calibrado (`repeating-linear-gradient(rgba(0,0,0,0.25) 0 1px, rgba(0,0,0,0) 1px 3px)`).
* **Parpadeo sutil (CRT Flicker):** Simulación sutil del barrido vertical a 60Hz.
* **Viñeta y Curvatura:** Sombreado radial perimetral simulando el abombamiento del cristal del monitor.
* **Modo Zen:** Posibilidad de desactivar o atenuar efectos si el usuario lo requiere.

### 4. Clases Utilitarias Estandarizadas
Para mantener un código limpio y eliminar estilos repetidos en los templates HTML, se crearon clases centralizadas en `src/styles.css`:
* `.terminal-panel`: Contenedor principal con fondo oscuro, borde de fósforo y esquina técnica.
* `.terminal-header`: Franja de cabecera con borde inferior punteado o continuo.
* `.terminal-title`: Tipografía mayúscula espaciada (`tracking-wider`, `font-bold`).
* `.terminal-text`: Texto de lectura estándar de terminal (`font-weight: 600`, color ámbar fósforo).
* `.terminal-text-dim`: Texto secundario / tenue para metadatos, prefijos o fechas.
* `.terminal-text-bright`: Texto con máxima saturación y brillo de fósforo.
* `.terminal-label`: Etiquetas de formulario y campos de datos en mayúsculas técnicas.
* `.terminal-subheading`: Subtítulos de sección y agrupadores.
* `.terminal-input`: Campo de texto monoespaciado con borde reactivo al `:focus`.
* `.terminal-btn` / `.terminal-btn-primary` / `.terminal-btn-danger`: Botones de acción con inversión de color al hover / active.
* `.terminal-divider`: Líneas de separación ASCII/terminal unificadas.
* `.terminal-table`: Estilos de tabla monoespaciada para el historial de ejecuciones.

---

## 🎨 Características Principales

* **Dashboard Unificado (`/`):**
  * **Card de Envío de URL (`url-input-card`):** Formulario tipo prompt de consola (`> URL:`, `> PROMPT:`) con validación de URLs de YouTube, selector de plantillas y botón de procesamiento asíncrono.
  * **Card de Métricas de Supadata (`supadata-metrics-card`):** Telemetría de créditos consumidos, créditos restantes y barra de cuota estilo display numérico, con refresco manual.
  * **Tabla de Historial (`summary-table`):** Listado de resúmenes con paginación, filtros por estado (`[PENDING]`, `[SUCCESS]`, `[ERROR]`), tags de prompt y búsqueda en tiempo real por título.
* **Gestor de Prompts (`/prompts`):**
  * Vista dedicada para auditar, crear, editar y previsualizar directivas del sistema para Gemini.
  * Selector del prompt predeterminado del sistema (`isDefault`).
  * Clasificación por etiquetas (tags) y monitoreo de métricas de uso acumulado (`usageCount`).
* **Reactividad en Tiempo Real:**
  * Conexión WebSockets con Socket.IO para actualizar el estado del resumen en pantalla inmediatamente al cambiar (`summaryCreated`, `summaryUpdated`, `summaryError`, `summaryDeleted`).
* **Visor de Resúmenes (`summary-modal`):**
  * Ventana modal CRT con cabecera `[MARKDOWN_VIEWER]` que renderiza el Markdown generado por Gemini con estilos de terminal.
  * Botón para copiar al portapapeles y botón para disparar la sincronización manual hacia Google Drive vía n8n.
* **Manejo de Errores y Reintentos (`error-modal`):**
  * Modal de diagnóstico `[TERMINAL_ERROR]` que expone la causa exacta del fallo.
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
│       └── toast.service.ts           # Notificaciones visuales de sistema
│
├── features/
│   ├── dashboard/                     # Panel principal de control
│   │   ├── components/
│   │   │   ├── url-input-card/        # Entrada de URL estilo prompt de consola
│   │   │   ├── supadata-metrics-card/ # Telemetría de cuota y créditos de Supadata
│   │   │   ├── summary-table/         # Tabla de historial con badges y acciones
│   │   │   ├── summary-modal/         # Modal CRT de lectura del resumen Markdown
│   │   │   └── error-modal/           # Modal CRT de diagnóstico y reintento
│   │   ├── store/summaries.store.ts   # Signal Store reactivo para resúmenes y métricas
│   │   └── dashboard.ts               # Componente contenedor del Dashboard
│   │
│   └── prompts/                       # Módulo de administración de directivas
│       ├── components/
│       │   ├── prompt-list/           # Listado de prompts con acciones y badges
│       │   ├── prompt-form-modal/     # Modal de creación y edición de prompts
│       │   └── prompt-detail-modal/   # Previsualización completa de instrucciones
│       └── prompts.ts                 # Componente principal de la sección de Prompts
│
└── shared/
    └── components/
        ├── crt-overlay/               # Capa global de efectos CRT (scanlines, flicker)
        ├── navbar/                    # Barra de navegación con branding SHYT y píldoras retro
        ├── status-badge/              # Badges de estado enmarcados [PENDING] [SUCCESS] [ERROR]
        └── toast-container/           # Contenedor de notificaciones tipo terminal
```

---

## 🚀 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo local (http://localhost:4200)
npm start

# Ejecutar pruebas unitarias
npm test -- --watch=false

# Compilación de producción
npm run build
```
