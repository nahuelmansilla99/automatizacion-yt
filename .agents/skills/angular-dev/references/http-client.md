# HTTP Client (Comunicación con APIs)

El módulo HTTP de Angular para comunicarse con APIs REST. Incluye interceptores para auth, manejo de errores, y la API `httpResource` basada en signals.

## Setup

En Angular v21+, `HttpClient` está disponible para inyección por defecto. Agregar `provideHttpClient(...)` solo cuando se necesiten features como interceptores:

```ts
import {provideHttpClient, withInterceptors} from '@angular/common/http';

export const appConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

## HttpClient Básico

**Regla:** Encapsular llamadas HTTP en services inyectables, nunca directamente en componentes.

```ts
import {HttpClient} from '@angular/common/http';
import {Service, inject} from '@angular/core';

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

  delete(id: string) {
    return this.http.delete(`/api/summaries/${id}`);
  }
}
```

## Reglas Importantes

- Los requests de `HttpClient` son **Observables fríos**: no se envía ningún request hasta que se suscribe al Observable
- Siempre suscribirse a requests de mutación (`post`, `put`, `patch`, `delete`) para que se ejecuten
- El tipo genérico es solo una aserción de tipo. Validar datos del backend en runtime cuando la forma no es confiable
- `HttpHeaders` y `HttpParams` son **inmutables**: cada método devuelve una nueva instancia

## Interceptores Funcionales

Los interceptores permiten transformar requests/responses de forma centralizada.

### Interceptor de Autenticación JWT

```ts
import {HttpInterceptorFn} from '@angular/common/http';
import {inject} from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const token = auth.token();

  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  return next(req);
};
```

### Interceptor de Manejo de Errores

```ts
import {HttpInterceptorFn} from '@angular/common/http';
import {catchError, throwError} from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        // Redirigir a login
        inject(Router).navigate(['/login']);
      }
      console.error('Error HTTP:', error.message);
      return throwError(() => error);
    }),
  );
};
```

### Registrar Interceptores

```ts
provideHttpClient(
  withInterceptors([authInterceptor, errorInterceptor]),
)
```

## httpResource (Data Fetching Reactivo)

`httpResource` combina `HttpClient` con signals para data fetching reactivo:

```ts
import {httpResource} from '@angular/common/http';

// Fetch simple
readonly resumenes = httpResource<VideoSummary[]>({
  url: '/api/summaries',
  defaultValue: [],
});

// Con parámetros reactivos (se re-fetcha cuando cambia el signal)
readonly resumen = httpResource<VideoSummary>({
  url: () => `/api/summaries/${this.summaryId()}`,
});
```

### Propiedades del Resource

```ts
this.resumenes.value();      // VideoSummary[] — el dato
this.resumenes.isLoading();  // boolean
this.resumenes.error();      // HttpErrorResponse | undefined
this.resumenes.status();     // 'idle' | 'loading' | 'resolved' | 'error'
this.resumenes.hasValue();   // boolean
```

## Buenas Prácticas

1. **Llamadas HTTP siempre en services**, nunca en componentes
2. **Interceptores para cross-cutting concerns** (auth, logging, errors)
3. **`httpResource` para data fetching** que se muestra en el template
4. **`HttpClient` con subscribe para mutaciones** (POST, PUT, DELETE)
5. **Usar `environment.apiUrl`** como base URL, no hardcodear
