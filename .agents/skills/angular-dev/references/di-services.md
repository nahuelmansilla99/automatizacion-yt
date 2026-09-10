# Dependency Injection y Services

Dependency Injection (DI) es el mecanismo central de Angular para organizar y compartir código. Permite "inyectar" servicios en componentes, directivas y otros servicios sin crearlos manualmente.

## Cómo Funciona DI en Angular

Hay dos interacciones principales:

1. **Providing (Proveer)**: Hacer valores disponibles para el sistema de DI
2. **Injecting (Inyectar)**: Pedir esos valores al sistema de DI

## Services (Servicios)

Un servicio es una clase TypeScript decorada con `@Service()` que encapsula lógica de negocio reutilizable.

### Crear un Service

Usar el decorator `@Service()` para hacer el servicio un singleton disponible en toda la aplicación:

```ts
import {Service} from '@angular/core';

@Service()
export class AnalyticsLogger {
  trackEvent(category: string, value: string) {
    console.log('Evento registrado:', { category, value });
  }
}
```

> **Nota**: `@Service()` es el reemplazo moderno de `@Injectable({ providedIn: 'root' })`. Ambos crean un singleton a nivel de aplicación.

### Usos Comunes de Services

| Uso | Ejemplo |
|-----|--------|
| **API Clients** | Encapsular llamadas HTTP al backend |
| **State Management** | Stores con signals para estado compartido |
| **Auth** | Manejo de JWT tokens, login/logout |
| **Logging** | Registro centralizado de errores |
| **Utilidades** | Formateo, validación, helpers compartidos |

## Inyectar Dependencias con `inject()`

Usar la función `inject()` para pedir dependencias. **Preferir `inject()` sobre inyección por constructor.**

```ts
import {Service, inject} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Service()
export class SummaryApi {
  private readonly http = inject(HttpClient);

  getAll() {
    return this.http.get<VideoSummary[]>('/api/summaries');
  }

  create(youtubeUrl: string) {
    return this.http.post<VideoSummary>('/api/summaries', { youtubeUrl });
  }

  getById(id: string) {
    return this.http.get<VideoSummary>(`/api/summaries/${id}`);
  }
}
```

### Dónde se puede usar `inject()`

- ✅ En inicializadores de campos de clase (field initializers)
- ✅ En constructores
- ✅ En factory functions pasadas a `useFactory`
- ❌ NO en métodos de clase regulares (fuera del contexto de inyección)

## Providers (Proveedores)

Maneras de registrar dependencias:

### Provider por defecto (Singleton)

```ts
@Service()  // Disponible en toda la app como singleton
export class VideoStore { ... }
```

### Provider a nivel de componente

```ts
@Component({
  providers: [VideoStore],  // Nueva instancia para este componente y sus hijos
})
export class FeatureComponent { ... }
```

### Provider con token personalizado

```ts
import {InjectionToken, provide} from '@angular/core';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');

// En la configuración de la app
providers: [
  provide(API_BASE_URL, { useValue: 'https://api.ejemplo.com' }),
]

// Inyectar
const apiUrl = inject(API_BASE_URL);
```

### Provider con Factory

```ts
provide(VideoStore, {
  useFactory: () => {
    const http = inject(HttpClient);
    const config = inject(AppConfig);
    return new VideoStore(http, config);
  },
})
```

## Inyectores Jerárquicos

Angular tiene un árbol de inyectores:

1. **Root Injector**: Servicios con `@Service()` — singleton para toda la app
2. **Component Injector**: Servicios en `providers` de un componente — nueva instancia por componente
3. **Element Injector**: Cada componente tiene su propio injector que puede sobrescribir providers del padre

Esto permite tener **instancias separadas** de un servicio por feature o por componente.

## Buenas Prácticas

1. **`inject()` sobre constructor injection** — más conciso y no requiere `constructor`
2. **`@Service()` para singletons** — un solo servicio compartido
3. **Separar API clients de stores** — `SummaryApi` (HTTP) vs `SummaryStore` (estado)
4. **Un service = una responsabilidad** — no crear "god services" con demasiada lógica
5. **Exponer estado como `readonly`** — `signal().asReadonly()` para prevenir mutaciones externas
6. **Nunca usar `new` para crear services** — siempre inyectar con `inject()`
