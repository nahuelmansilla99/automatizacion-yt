# Convenciones de Nombrado y Estructura del Proyecto

Esta guía define las reglas de nombrado y la estructura de carpetas recomendada para proyectos Angular modernos.

## Principios Core

1. **Priorizar convenciones existentes**: Antes de generar o refactorear archivos, verificar los archivos existentes del proyecto, la configuración de `angular.json` y reglas de ESLint
2. **Eliminar sufijos de rol (Proyectos Modernos v20+)**: En proyectos configurados para "Intent over Role", los archivos no incluyen extensiones funcionales como `.component.ts`, `.service.ts` o `.directive.ts`
3. **Nombrar por intención/propósito**: Nombrar archivos y clases según su dominio o responsabilidad de negocio (ej: `-data`, `-store`, `-api`, `-formatter`)
4. **Carpeta como contexto**: Usar la jerarquía de carpetas (`core/`, `features/`, `shared/`) para identificar el rol técnico
5. **Excepción para Interfaces/Modelos**: Los modelos retienen el sufijo `.model.ts`

## Reglas de Nombrado de Archivos

### Kebab-case para archivos

```
✅ product-list.ts
✅ summary-store.ts
✅ auth-guard.ts

❌ productList.ts
❌ ProductList.ts
❌ product_list.ts
```

### Coincidencia archivo ↔ clase

| Archivo | Clase |
|---------|-------|
| `product-list.ts` | `ProductList` |
| `summary-store.ts` | `SummaryStore` |
| `auth-interceptor.ts` | `authInterceptor` (función) |
| `video-summary.model.ts` | `VideoSummary` (interface) |

### Archivos relacionados por Componente

Cada componente o feature **debe tener su propia carpeta** que contenga obligatoriamente sus cuatro archivos separados (no usar templates ni estilos inline en el `.ts`):

```
mi-componente/
├── mi-componente.ts        → Clase TypeScript con templateUrl y styleUrl
├── mi-componente.html      → Template HTML externo
├── mi-componente.css       → Estilos CSS del componente
└── mi-componente.spec.ts   → Tests unitarios (OBLIGATORIO: cada componente/feature debe tener su test)
```

## Estructura de Carpetas Recomendada

```
src/app/
├── core/                    → Servicios singleton, lógica global
│   ├── services/
│   │   ├── websocket.service.ts     → Service de WebSocket
│   │   └── toast.service.ts         → Service de notificaciones
│   └── models/
│       └── summary.model.ts         → Interfaces y tipos globales
│
├── shared/                  → Componentes, pipes, directivas reutilizables
│   └── components/
│       ├── status-badge/
│       │   ├── status-badge.ts
│       │   ├── status-badge.html
│       │   ├── status-badge.css
│       │   └── status-badge.spec.ts
│       ├── navbar/
│       │   ├── navbar.ts
│       │   ├── navbar.html
│       │   ├── navbar.css
│       │   └── navbar.spec.ts
│       └── toast-container/
│           ├── toast-container.ts
│           ├── toast-container.html
│           ├── toast-container.css
│           └── toast-container.spec.ts
│
├── features/                → Módulos de negocio
│   └── dashboard/
│       ├── dashboard.ts             → Componente principal del feature
│       ├── dashboard.html           → Template del dashboard
│       ├── dashboard.css            → Estilos del dashboard
│       ├── dashboard.spec.ts        → Test unitario del feature
│       ├── components/              → Componentes específicos del feature
│       │   ├── url-input-card/
│       │   │   ├── url-input-card.ts
│       │   │   ├── url-input-card.html
│       │   │   ├── url-input-card.css
│       │   │   └── url-input-card.spec.ts
│       │   ├── supadata-metrics-card/
│       │   │   ├── supadata-metrics-card.ts
│       │   │   ├── supadata-metrics-card.html
│       │   │   ├── supadata-metrics-card.css
│       │   │   └── supadata-metrics-card.spec.ts
│       │   ├── summary-table/
│       │   │   ├── summary-table.ts
│       │   │   ├── summary-table.html
│       │   │   ├── summary-table.css
│       │   │   └── summary-table.spec.ts
│       │   ├── summary-modal/
│       │   │   ├── summary-modal.ts
│       │   │   ├── summary-modal.html
│       │   │   ├── summary-modal.css
│       │   │   └── summary-modal.spec.ts
│       │   └── error-modal/
│       │       ├── error-modal.ts
│       │       ├── error-modal.html
│       │       ├── error-modal.css
│       │       └── error-modal.spec.ts
│       └── store/
│           └── summaries.store.ts   → Store local del feature
│
├── app.routes.ts            → Rutas principales
├── app.config.ts            → Configuración de la app
├── app.ts                   → Componente raíz
├── app.html                 → Template raíz
└── app.css                  → Estilos raíz
```

## Reglas por Directorio

### `core/` (Fundación de la App)

- Servicios singleton que se usan en toda la aplicación
- Interceptores HTTP, guards, y providers globales
- **NO poner componentes aquí**
- Importado solo por el `app.config.ts` o `app.ts`

### `shared/` (Código Reutilizable)

- Componentes, pipes y directivas usados por múltiples features
- **No debe tener dependencias con features específicos**
- Cada elemento debe ser independiente y autocontenido

### `features/` (Módulos de Negocio)

- Cada feature es una carpeta con sus propios componentes, services y routes
- Un feature puede tener su propio store local
- Los features se cargan via lazy loading

## Buenas Prácticas

1. **Un archivo = una clase/función exportada**
2. **Máximo 400 líneas por archivo** — si se excede, dividir
3. **Index files (`index.ts`)** para re-exportar el API público de un directorio
4. **Agrupar por feature**, no por tipo técnico
5. **`core/` para singletons, `shared/` para reutilizables, `features/` para negocio**
6. **Separación y testing obligatorios**: Todo componente o feature debe residir en su propia carpeta con sus cuatro archivos obligatorios: `.ts`, `.html`, `.css` y `.spec.ts` (evitando HTML y CSS inline)
