# Routing (Navegación y Protección de Rutas)

El sistema de routing de Angular controla qué componente se muestra según la URL. Es fundamental para la arquitectura de cualquier SPA.

## Definir Rutas

Las rutas se definen como un array de objetos `Route` en un archivo dedicado:

```ts
import {Routes} from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', loadComponent: () => import('./features/dashboard') },
  { path: 'historial', loadComponent: () => import('./features/historial') },
  { path: 'detalle/:id', loadComponent: () => import('./features/detalle') },
  { path: '**', redirectTo: 'dashboard' },
];
```

## Lazy Loading (Carga Diferida)

**Regla obligatoria**: Siempre usar `loadComponent` o `loadChildren` para cargar rutas de forma diferida. Esto reduce el bundle inicial drásticamente.

```ts
// ✅ Correcto: lazy loading
{ path: 'admin', loadChildren: () => import('./features/admin/routes') }

// ❌ Evitar: carga inmediata
{ path: 'admin', component: AdminComponent }
```

### Estrategias de Precarga

```ts
import {provideRouter, withPreloading, PreloadAllModules} from '@angular/router';

export const appConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
};
```

## Route Guards (Protección de Rutas)

Los guards controlan el acceso a las rutas. Usar **guards funcionales** (sin clases).

```ts
import {inject} from '@angular/core';
import {Router, CanActivateFn} from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  const router = inject(Router);

  if (auth.isLoggedIn()) {
    return true;
  }
  return router.createUrlTree(['/login']);
};
```

Uso en rutas:

```ts
{
  path: 'dashboard',
  loadComponent: () => import('./features/dashboard'),
  canActivate: [authGuard],
}
```

### Tipos de Guards

| Guard | Cuándo se ejecuta |
|-------|-------------------|
| `canActivate` | Antes de entrar a una ruta |
| `canDeactivate` | Antes de salir de una ruta (ej: formulario sin guardar) |
| `canMatch` | Antes de evaluar si la ruta coincide |

## Navegación Programática

```ts
// En un componente o service
private readonly router = inject(Router);

navegar() {
  this.router.navigate(['/detalle', this.id()]);
}
```

En templates:

```html
<a routerLink="/dashboard">Dashboard</a>
<a [routerLink]="['/detalle', item.id]">Ver detalle</a>
```

## Router Outlet

```html
<!-- Layout principal -->
<nav>...</nav>
<main>
  <router-outlet />
</main>
```

## Component Input Binding

Recibir parámetros de ruta como inputs del componente:

```ts
// En la configuración
provideRouter(routes, withComponentInputBinding())

// En el componente
@Component({...})
export class DetalleResumen {
  id = input.required<string>();  // Se llena automáticamente desde :id
}
```

## Data Resolvers

Pre-cargar datos antes de mostrar una ruta:

```ts
export const summaryResolver: ResolveFn<VideoSummary> = (route) => {
  const api = inject(SummaryApi);
  return api.getById(route.paramMap.get('id')!);
};

// En la ruta
{
  path: 'detalle/:id',
  loadComponent: () => import('./features/detalle'),
  resolve: { summary: summaryResolver },
}
```
