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

### Archivos relacionados

```
product-list.ts        → Componente
product-list.html      → Template
product-list.css       → Estilos
product-list.spec.ts   → Tests
```

## Estructura de Carpetas Recomendada

```
src/app/
├── core/                    → Servicios singleton, lógica global
│   ├── auth-store.ts            → Manejo de autenticación
│   ├── auth-interceptor.ts      → Interceptor JWT
│   ├── error-interceptor.ts     → Interceptor de errores
│   ├── websocket.ts             → Service de WebSocket
│   └── models/
│       └── user.model.ts        → Interfaces globales
│
├── shared/                  → Componentes, pipes, directivas reutilizables
│   ├── status-badge.ts          → Componente reutilizable
│   ├── truncate.pipe.ts         → Pipe reutilizable
│   ├── loading-spinner.ts       → Componente de carga
│   └── confirm-dialog.ts        → Diálogo de confirmación
│
├── features/                → Módulos de negocio
│   ├── dashboard/
│   │   ├── dashboard.ts             → Componente principal
│   │   ├── dashboard.html
│   │   ├── dashboard.spec.ts
│   │   ├── url-input.ts             → Componente hijo
│   │   ├── metrics-panel.ts         → Componente hijo
│   │   └── dashboard-store.ts       → Store local del feature
│   │
│   ├── historial/
│   │   ├── historial.ts
│   │   ├── historial-tabla.ts
│   │   ├── historial-filtros.ts
│   │   └── summary-api.ts          → API client del feature
│   │
│   └── detalle/
│       ├── detalle-resumen.ts
│       └── markdown-viewer.ts
│
├── app.routes.ts            → Rutas principales
├── app.config.ts            → Configuración de la app
└── app.ts                   → Componente raíz
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
