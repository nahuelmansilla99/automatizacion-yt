---
name: angular-dev
description: >-
  Skill principal de desarrollo Angular. Activar cuando se trabaje con componentes,
  services, signals, HTTP, formularios, routing, testing, pipes, DI, naming conventions,
  estética Retro CRT Terminal, o configuración de ambientes. Proporciona guías de buenas
  prácticas, patrones modernos (Angular v20+), y reglas para código escalable, reutilizable
  y alineado al sistema de diseño de terminal.
---

# Guía de Desarrollo Angular

## Reglas Generales

1. Siempre analizar la versión de Angular del proyecto antes de aplicar estas guías. Las features disponibles varían entre versiones.
2. Seguir la guía de estilos y buenas prácticas de Angular para mantenibilidad y performance.
3. Usar el Angular CLI para scaffolding de componentes, services, directivas, pipes y rutas.
4. **Después de generar código, ejecutar `ng build`** para verificar que no hay errores de compilación. No saltear este paso.
5. **Separación de archivos obligatoria**: Cada componente o feature debe tener sus propios archivos `.ts`, `.html`, `.css` y `.spec.ts` en su respectiva carpeta (usando `templateUrl` y `styleUrl`). No usar templates ni estilos inline dentro de los archivos `.ts`.
6. **Testing obligatorio por componente/feature**: Cada nuevo componente o feature DEBE crearse junto con su archivo de test unitario `[nombre].spec.ts` en su propia carpeta, aplicando la filosofía zoneless y async-first (`await fixture.whenStable()`).
7. **Regla Estricta: Cero Emojis en la UI**: Prohibido el uso de emojis en templates, botones, modales y componentes. Usar exclusivamente la estética de consola tipo basement/hacker: corchetes técnicos `[ ACCION ]`, prefijos de comando (`>`, `::`, `-`, `›`) y glifos monocromáticos (`●`, `◌`, `✕`).

---

## 📺 Sistema de Diseño Retro CRT Terminal (Basement AI / Terminal Style)

Toda la interfaz del frontend responde a una estética de terminal retro en fósforo ámbar monocromático inspirada en [Basement AI](https://basement.studio/ai/home).

### 1. Paleta de Fósforo Ámbar
Tokens CSS centralizados en `frontend/src/styles.css` y accesibles en toda la app:
* `--terminal-bg: #000000;` — Negro absoluto del monitor de terminal.
* `--terminal-bg-alt: #080808;` — Superficies de tarjetas, cabeceras y bloques de código.
* `--terminal-bright: #ff4d00;` — Naranja de fósforo de alta intensidad (foco, títulos, acciones primarias).
* `--terminal-base: #993000;` — Ámbar base de lectura continua.
* `--terminal-dim: #7a2200;` — Ámbar atenuado para metadatos, prompts pasivos, reglas y timestamps.
* `--terminal-border: #2a0e00;` — Bordes discretos y cuadrícula de terminal.
* Estados: Éxito (`#44bb00` / `●`), Advertencia (`#ffaa00` / `◌`), Error (`#ff3300` / `✕`), Info (`#0088cc`).

### 2. Tipografía & Text Glow
* **Familia:** `'Geist Mono', 'Geist Mono Regular', ui-monospace, monospace`.
* **Peso:** `font-weight: 600` (SemiBold) uniforme en toda la interfaz.
* **Efecto Monitor Glow:** Clase `.machine-screen` con `text-shadow: 0 0 6px rgba(255, 77, 0, 0.35)`.
* **Capa CRT:** Componente global `app-crt-overlay` que proyecta scanlines calibradas y parpadeo sutil a 60Hz.

### 3. Clases Utilitarias Estandarizadas
Usar siempre las clases utilitarias de `styles.css` en vez de inventar estilos ad-hoc:

| Categoría | Clases Utilitarias | Propósito |
| :--- | :--- | :--- |
| **Tipografía** | `.terminal-heading`, `.terminal-subheading`, `.terminal-text`, `.terminal-text-dim`, `.terminal-text-bright`, `.terminal-label`, `.terminal-divider` | Jerarquía tipográfica monoespaciada en mayúsculas técnicas. |
| **Botones** | `.terminal-btn`, `.terminal-btn-primary`, `.terminal-btn-error`, `.terminal-filter-btn` | Botones de consola con inversión de color en hover y bordes nítidos. |
| **Acciones** | `.terminal-action-link`, `.terminal-action-link-bright`, `.terminal-action-link-error` | Enlaces tipo consola: `[ VER_RESUMEN ]`, `[ COPIAR_URL ]`, `[ ELIMINAR ]`. |
| **Formularios** | `.terminal-input`, `.terminal-select` | Campos de texto con borde reactivo al `:focus` y placeholder atenuado. |
| **Modales** | `.terminal-modal-backdrop`, `.terminal-modal-window`, `.terminal-modal-header`, `.terminal-modal-footer` | Ventanas flotantes estilo monitor CRT. |

### 4. Responsividad Mobile-First en Componentes de Lista
Al diseñar vistas de lista o tablas (ej. `summary-table`):
* **Mobile (< `sm`):**
  * Colocar el indicador de estado circular inline a la izquierda del título (`●`, `◌`, `✕`), reemplazando el guión `-` y omitiendo el texto redundante del badge para ahorrar espacio vertical.
  * Ocultar separadores de dos puntos dobles `::` entre metadatos (`hidden sm:inline`) para permitir saltos de línea naturales.
  * Usar tipografía compacta (`text-[10px] sm:text-xs`) y botones de acción en `flex-wrap`.
* **Desktop (`sm+`):**
  * Mostrar el guión clásico `-` en el título y el badge completo con etiqueta de texto a la derecha (`<app-status-badge [status]="video.status" />`).

### 5. Renderizado de Markdown (`MarkdownRendererService`)
El visor de resúmenes integra **Marked + PrismJS** adaptado al sistema de diseño terminal:
* Bloques de código `.terminal-code-block` con cabecera ASCII, indicador de lenguaje, contador de líneas y botón para copiar al portapapeles.
* Resaltado de sintaxis adaptado a la rampa de luminancia del fósforo (sin colores estándar de IDE).
* Soporte nativo para Callouts de Obsidian (`.terminal-callout`, `[!NOTE]`, `[!TIP]`, `[!WARNING]`, etc.).
* Panel de Frontmatter PKM (`.terminal-frontmatter-panel`) con cuadrícula de metadatos y etiquetas (`terminal-tag-badge`).

---

## Cuándo Consultar Cada Referencia

Consultá la referencia correspondiente según la tarea que estés realizando:

### 🧱 Componentes
Cuando se trabaje con componentes, inputs, outputs, control flow (`@if`, `@for`, `@switch`), host elements o styling de componentes terminal:
→ Leer [componentes.md](references/componentes.md)

### ⚡ Signals y Reactividad
Cuando se maneje estado reactivo, `signal()`, `computed()`, `linkedSignal()`, `effect()`, `resource()`, `httpResource()`, o patrones de store:
→ Leer [signals.md](references/signals.md)

### 🏗️ Dependency Injection y Services
Cuando se creen services, se use `inject()`, se configuren providers, tokens de inyección, o se diseñe la arquitectura de servicios:
→ Leer [di-services.md](references/di-services.md)

### 🔌 HTTP Client
Cuando se comunique con APIs REST, se configuren interceptores (JWT, errores), se use `HttpClient` o `httpResource`:
→ Leer [http-client.md](references/http-client.md)

### 📝 Formularios
Cuando se implementen formularios, validaciones, Signal Forms, Reactive Forms o Template-Driven Forms:
→ Leer [forms.md](references/forms.md)

### 🧭 Routing
Cuando se definan rutas, lazy loading, guards de autenticación, resolvers, navegación programática, o `router-outlet`:
→ Leer [routing.md](references/routing.md)

### 🔧 Pipes
Cuando se necesiten transformaciones reutilizables para templates (formateo, truncado, badges de estado ASCII):
→ Leer [pipes.md](references/pipes.md)

### 📁 Naming Conventions y Estructura
Cuando se creen archivos nuevos, se organice el proyecto, o se defina la estructura de carpetas (`core/`, `shared/`, `features/`):
→ Leer [naming-estructura.md](references/naming-estructura.md)

### ✅ Testing
Cuando se escriban unit tests, integration tests con Component Harnesses, E2E tests con Playwright, o se testeen services con HttpTestingController:
→ Leer [testing.md](references/testing.md)

### ⚙️ Configuración por Ambiente
Cuando se configuren environments, variables de entorno, Angular CLI, o configuración runtime:
→ Leer [environment-config.md](references/environment-config.md)

---

## Estructura del Proyecto Recomendada

```
src/app/
├── core/           → Servicios singleton, auth, markdown renderer, websocket, toast
├── shared/         → Componentes reutilizables (crt-overlay, navbar, status-badge, toast)
├── features/       → Módulos de negocio (lazy loaded)
│   ├── dashboard/  → Panel principal (url-input-card, supadata-metrics-card, summary-table, modales)
│   └── prompts/    → Gestor de directivas (prompt-list, prompt-form-modal, prompt-detail-modal)
├── app.routes.ts   → Rutas principales
├── app.config.ts   → Configuración de la app
└── app.ts          → Componente raíz con CRT overlay
```

## Patrones Modernos Obligatorios (Angular v20+)

| Patrón Legacy | Patrón Moderno |
|--------------|----------------|
| `@Input()` decorator | `input()` / `input.required()` |
| `@Output() EventEmitter` | `output()` |
| `@Injectable({providedIn: 'root'})` | `@Injectable({providedIn: 'root'})` con `inject()` |
| Constructor injection | `inject()` function |
| `*ngIf`, `*ngFor` | `@if`, `@for`, `@switch` |
| `BehaviorSubject` para estado | `signal()` + `computed()` |
| `subscribe()` para data fetching | `httpResource()` / Signals Store |
| `<component></component>` | `<component />` (self-closing) |
| `.component.ts` / `Component` suffix | Naming por intención (sin sufijo de rol) |

## Verificación Final

Después de cualquier cambio de código:

1. Ejecutar `ng build` para verificar compilación
2. Ejecutar `ng test -- --watch=false` para correr los unit tests
3. Verificar que no hay warnings de linting con `ng lint`
