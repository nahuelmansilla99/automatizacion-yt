# Frontend - SHYT (Summary Hub YouTube)

Aplicación web desarrollada en **Angular v21** con **Standalone Components**, **Signals Store**, **Tailwind CSS v4** y un sistema de diseño retro-futurista **Retro CRT Terminal** en fósforo ámbar (inspirado en [Basement AI](https://basement.studio/ai/home)).

---

## 📺 Sistema de Diseño Retro CRT Terminal (Basement Style)

La interfaz emula un monitor de tubo de rayos catódicos (CRT) de fósforo ámbar monocromático de alta fidelidad, trasladando toda la interacción a una experiencia inmersiva de terminal informática y consola hacker:

### 1. Paleta de Fósforo Ámbar
Definida mediante variables CSS dinámicas en `frontend/src/styles.css`:
* `--terminal-bg: #000000;` — Negro absoluto antirreflejo del monitor.
* `--terminal-bg-alt: #080808;` — Fondo de paneles, tarjetas, cabeceras y bloques de código.
* `--terminal-bright: #ff4d00;` — Fósforo naranja activo de alta saturación (foco, botones primarios, títulos).
* `--terminal-base: #993000;` — Ámbar base de lectura continua.
* `--terminal-dim: #7a2200;` — Ámbar atenuado para metadatos, prefijos de consola, separadores y fechas.
* `--terminal-border: #2a0e00;` — Bordes discretos de cuadrícula de terminal.
* **Estados Semánticos:**
  * Éxito: `--terminal-success: #44bb00;` (Glifo `●`)
  * Advertencia/Procesando: `--terminal-warn: #ffaa00;` (Glifo `◌` con rotación continua)
  * Error: `--terminal-error: #ff3300;` (Glifo `✕`)
  * Info: `--terminal-info: #0088cc;`

### 2. Filosofía "Zero Emojis" & Notación de Consola
Se eliminó cualquier uso de emojis en las vistas y templates, reemplazándolos por:
* Corchetes técnicos para acciones: `[ TODOS ]`, `[ VER_RESUMEN ]`, `[ COPIAR_URL ]`, `[ ELIMINAR ]`, `[ REINTENTAR ]`.
* Prefijos de comando tipo shell: `>`, `::`, `-`, `›`.
* Badges de estado con glifos monoespaciados: `[ ● COMPLETADO ]`, `[ ◌ PROCESANDO ]`, `[ ✕ ERROR ]`.

### 3. Tipografía & Text Glow CRT (Geist Mono SemiBold)
* **Familia:** `'Geist Mono', 'Geist Mono Regular', ui-monospace, monospace`.
* **Peso tipográfico:** `600` (SemiBold) predeterminado para otorgar cuerpo y legibilidad idéntica a terminales VT100.
* **Text Shadow CRT:** La clase `.machine-screen` incorpora un resplandor óptico de fósforo:
  ```css
  text-shadow: 0 0 6px rgba(255, 77, 0, 0.35);
  ```
* **Renderizado:** Optimizado con `text-rendering: optimizeLegibility` y suavizado antialias.

### 4. Capa de Efectos de Monitor CRT (`crt-overlay`)
Componente compartido (`app-crt-overlay`) que envuelve la aplicación y proyecta:
* **Scanlines:** Gradiente lineal repetitivo calibrado (`repeating-linear-gradient(...)`).
* **Parpadeo sutil (CRT Flicker):** Simulación sutil del barrido vertical a 60Hz.
* **Viñeta y Curvatura:** Sombreado radial perimetral simulando el abombamiento del cristal.
* **Modo Zen:** Posibilidad de desactivar o atenuar efectos según la preferencia del usuario.

### 5. Clases Utilitarias Estandarizadas
Centralizadas en `src/styles.css` para evitar repetición de estilos:
* `.terminal-heading`: Tipografía titular mayúscula en fósforo brillante (`text-transform: uppercase`, `tracking-wider`).
* `.terminal-subheading`: Subtítulos y etiquetas secundarias atenuadas.
* `.terminal-text` / `.terminal-text-dim` / `.terminal-text-bright`: Niveles de luminancia de texto.
* `.terminal-label`: Prefijos de campos técnicos (`>`).
* `.terminal-btn` / `.terminal-btn-primary` / `.terminal-btn-error`: Botones con inversión de color en hover.
* `.terminal-action-link` / `.terminal-action-link-bright` / `.terminal-action-link-error`: Enlaces entre corchetes técnicos.
* `.terminal-filter-btn`: Píldoras de filtrado con estado activo invertido.
* `.terminal-input` / `.terminal-select`: Campos de formulario con borde reactivo al `:focus`.
* `.terminal-modal-backdrop` / `.terminal-modal-window` / `.terminal-modal-header` / `.terminal-modal-footer`: Estructura de ventanas modales tipo consola.

---

## ⚡ Motor de Renderizado Markdown Terminal (`MarkdownRendererService`)

El visor de resúmenes (`summary-modal`) integra un servicio especializado de renderizado Markdown basado en **Marked** y **PrismJS**:

1. **Bloques de Código Estilo Consola (`.terminal-code-block`):**
   * Cabecera ASCII con nombre del lenguaje en mayúsculas, contador de líneas y botón `[ COPIAR ]` integrado.
   * Numeración de líneas nativa (`.line-numbers-rows`) con diseño monoespaciado alineado a la derecha.
   * Resaltado de sintaxis con tokens adaptados a la rampa de brillo de fósforo ámbar (keywords en ámbar saturado, strings en ámbar claro, números/booleanos en amarillo terminal, comentarios en ámbar atenuado).
2. **Callouts de Obsidian (`.terminal-callout`):**
   * Soporte automático para sintaxis Obsidian (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!DANGER]`, etc.).
   * Renderizado en marcos de consola con borde izquierdo de color semántico y cabecera técnica en mayúsculas.
3. **Panel de Frontmatter PKM (`.terminal-frontmatter-panel`):**
   * Extracción y renderizado del frontmatter YAML de la nota generada por Gemini.
   * Cuadrícula técnica (grid) con metadatos clave (título, autor, fecha) y etiquetas tipo badge (`.terminal-tag-badge`).

---

## 📱 Responsividad Mobile-First

El sistema de diseño incorpora adaptaciones específicas para pantallas móviles estrechas:

* **Indicador de Estado Inline:** En dispositivos móviles (< `sm`), el estado se compacta ubicando el glifo correspondiente (`●`, `◌`, `✕`) inmediatamente a la izquierda del título del video, sustituyendo el guión tradicional `-` y omitiendo la etiqueta de texto para maximizar el espacio útil de lectura.
* **Badge Completo en Desktop:** En pantallas mayores (`sm+`), el título mantiene el guión clásico y muestra a la derecha el badge completo con etiqueta (`[ ● COMPLETADO ]`).
* **Metadatos y Enlaces Adaptativos:**
  * Ocultamiento selectivo de separadores `::` en móvil para que el autor, fecha y URL fluyan naturalmente sin saltos forzados.
  * Truncado dinámico de la URL de YouTube (`max-w-[200px]` en mobile vs `max-w-xs` en desktop).
* **Acciones en Flex-Wrap:** Botones entre corchetes con tamaño de fuente compacto (`text-[10px]` en mobile vs `text-xs` en desktop) y envoltura flexible para evitar cualquier desbordamiento horizontal.

---

## 🎨 Características Principales

* **Dashboard Unificado (`/`):**
  * **Card de Envío de URL (`url-input-card`):** Formulario con prompt de consola (`> INICIAR_RESUMEN`), validación de URLs de YouTube, selector de plantillas y botón de procesamiento asíncrono.
  * **Card de Métricas de Supadata (`supadata-metrics-card`):** Telemetría de créditos consumidos, créditos restantes y barra de cuota estilo display numérico, con refresco manual.
  * **Tabla de Historial (`summary-table`):** Listado interactivo con búsqueda en tiempo real, filtros por estado (`[ TODOS ]`, `[ COMPLETADOS ]`, `[ PROCESANDO ]`, `[ ERROR ]`) y soporte responsive mobile-first.
* **Gestor de Prompts (`/prompts`):**
  * Vista dedicada para auditar, crear, editar y previsualizar directivas del sistema para Gemini.
  * Selector del prompt predeterminado del sistema (`isDefault`).
  * Clasificación por etiquetas (tags) y monitoreo de métricas de uso acumulado (`usageCount`).
* **Reactividad en Tiempo Real:**
  * Conexión WebSockets con Socket.IO para sincronizar el estado del resumen en pantalla al instante (`summaryCreated`, `summaryUpdated`, `summaryError`, `summaryDeleted`).
* **Visor de Resúmenes (`summary-modal`):**
  * Modal CRT con cabecera `[MARKDOWN_VIEWER]` que renderiza la nota de Obsidian con PrismJS, frontmatter panel y callouts.
  * Botón para copiar al portapapeles y botón para disparar la sincronización manual hacia Google Drive vía n8n.
* **Manejo de Errores y Reintentos (`error-modal`):**
  * Modal de diagnóstico `[TERMINAL_ERROR]` que expone la traza técnica exacta del fallo.
  * Botón de **Reintentar** que reejecuta el resumen en el backend reutilizando la transcripción persistida (0 créditos de Supadata).

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
│       ├── markdown-renderer.service.ts # Servicio de renderizado Marked + PrismJS terminal
│       ├── websocket.service.ts       # Conexión Socket.IO con el backend
│       └── toast.service.ts           # Notificaciones visuales de sistema
│
├── features/
│   ├── dashboard/                     # Panel principal de control
│   │   ├── components/
│   │   │   ├── url-input-card/        # Entrada de URL estilo prompt de comando
│   │   │   ├── supadata-metrics-card/ # Telemetría de cuota y créditos de Supadata
│   │   │   ├── summary-table/         # Tabla de historial responsive (mobile-first)
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
        ├── navbar/                    # Barra de navegación con branding y enlaces técnicos
        ├── status-badge/              # Badges de estado enmarcados [ ● ] [ ◌ ] [ ✕ ]
        └── toast-container/           # Notificaciones tipo terminal
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
