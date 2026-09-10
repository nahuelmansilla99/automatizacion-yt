---
name: angular-dev
description: >-
  Skill principal de desarrollo Angular. Activar cuando se trabaje con componentes,
  services, signals, HTTP, formularios, routing, testing, pipes, DI, naming conventions,
  o configuración de ambientes. Proporciona guías de buenas prácticas, patrones modernos
  (Angular v20+), y reglas para código escalable, reutilizable y sin deuda técnica.
---

# Guía de Desarrollo Angular

## Reglas Generales

1. Siempre analizar la versión de Angular del proyecto antes de aplicar estas guías. Las features disponibles varían entre versiones.
2. Seguir la guía de estilos y buenas prácticas de Angular para mantenibilidad y performance.
3. Usar el Angular CLI para scaffolding de componentes, services, directivas, pipes y rutas.
4. **Después de generar código, ejecutar `ng build`** para verificar que no hay errores de compilación. No saltear este paso.

---

## Cuándo Consultar Cada Referencia

Consultá la referencia correspondiente según la tarea que estés realizando:

### 🧱 Componentes

Cuando se trabaje con componentes, inputs, outputs, control flow (`@if`, `@for`, `@switch`), host elements o styling de componentes:

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

Cuando se necesiten transformaciones reutilizables para templates (formateo, truncado, badges de estado):

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
├── core/           → Servicios singleton, auth, interceptores, guards
├── shared/         → Componentes, pipes y directivas reutilizables
├── features/       → Módulos de negocio (lazy loaded)
│   ├── dashboard/
│   ├── historial/
│   └── detalle/
├── app.routes.ts   → Rutas principales
├── app.config.ts   → Configuración de la app
└── app.ts          → Componente raíz
```

## Patrones Modernos Obligatorios (Angular v20+)

| Patrón Legacy | Patrón Moderno |
|--------------|----------------|
| `@Input()` decorator | `input()` / `input.required()` |
| `@Output() EventEmitter` | `output()` |
| `@Injectable({providedIn: 'root'})` | `@Service()` |
| Constructor injection | `inject()` function |
| `*ngIf`, `*ngFor` | `@if`, `@for`, `@switch` |
| `BehaviorSubject` para estado | `signal()` + `computed()` |
| `subscribe()` para data fetching | `httpResource()` |
| `ngOnInit` para fetch inicial | `resource()` / `httpResource()` |
| `<component></component>` | `<component />` (self-closing) |
| `.component.ts` / `Component` suffix | Naming por intención (sin sufijo) |

## Verificación Final

Después de cualquier cambio de código:

1. Ejecutar `ng build` para verificar compilación
2. Ejecutar `ng test` para correr los unit tests
3. Verificar que no hay warnings de linting con `ng lint`
