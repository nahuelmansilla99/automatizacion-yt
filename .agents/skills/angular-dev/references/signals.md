# Signals (Reactividad en Angular)

Signals es el sistema de reactividad nativo de Angular. Un signal es un wrapper alrededor de un valor que notifica automáticamente a los consumidores cuando ese valor cambia.

## Writable Signals (`signal`)

Usar `signal()` para crear estado que se puede actualizar directamente.

```ts
import {signal} from '@angular/core';

const contador = signal(0);

// Leer el valor (siempre requiere llamar al getter)
console.log(contador()); // 0

// Actualizar directamente
contador.set(3);

// Actualizar basándose en el valor anterior
contador.update((valor) => valor + 1);
```

### Exponer como Readonly

Al exponer estado desde un service, es buena práctica exponer una versión readonly para prevenir mutaciones externas.

```ts
private readonly _contador = signal(0);
// Los consumidores pueden leer, pero no pueden llamar a .set() o .update()
readonly contador = this._contador.asReadonly();
```

## Computed Signals (`computed`)

Usar `computed()` para crear signals de solo lectura que derivan su valor de otros signals.

- **Evaluación Lazy**: La función de derivación no se ejecuta hasta que se lee el computed signal.
- **Memoizado**: El resultado se cachea. Solo recalcula cuando cambia un signal del que depende.

```ts
import {signal, computed} from '@angular/core';

const items = signal<CartItem[]>([]);
const total = computed(() => items().reduce((sum, item) => sum + item.price, 0));
const vacio = computed(() => items().length === 0);
```

## linkedSignal

Un signal que se recalcula cuando cambia una dependencia, pero que **también se puede escribir** manualmente. Ideal para filtros, selecciones, paginación.

```ts
import {signal, linkedSignal} from '@angular/core';

const items = signal(['Angular', 'React', 'Vue']);

// Se resetea al primer item cuando cambia la lista
const seleccionado = linkedSignal(() => items()[0]);

// Pero se puede cambiar manualmente
seleccionado.set('React');
```

### Forma avanzada con `source` y `computation`

```ts
const paginaActual = linkedSignal({
  source: filtroActivo,  // Signal que dispara el reset
  computation: () => 1,   // Siempre volver a página 1 al cambiar filtro
});
```

## Effects

`effect()` ejecuta side-effects cuando cambian los signals que lee internamente.

```ts
import {effect, signal} from '@angular/core';

const usuario = signal<User | null>(null);

// Se ejecuta cada vez que 'usuario' cambia
effect(() => {
  const u = usuario();
  if (u) {
    console.log(`Usuario logueado: ${u.nombre}`);
    localStorage.setItem('lastUser', u.id);
  }
});
```

### Reglas de Effects

1. **No usar para actualizar otros signals** — usar `computed()` en su lugar
2. **Usar para side-effects reales**: logging, localStorage, analytics, llamadas a APIs externas
3. **Se ejecutan al menos una vez** al crearse
4. **Se destruyen automáticamente** cuando el componente/service que los creó se destruye

## Resource (Data Fetching Reactivo)

`resource()` integra data fetching asíncrono con signals. Trackea automáticamente loading/error/success.

```ts
import {resource, signal} from '@angular/core';

const userId = signal('123');

const userResource = resource({
  params: () => ({ id: userId() }),
  loader: async ({ params, abortSignal }) => {
    const res = await fetch(`/api/users/${params.id}`, { signal: abortSignal });
    if (!res.ok) throw new Error('Error de red');
    return res.json();
  },
});

// Propiedades reactivas
userResource.value();      // El dato cargado
userResource.status();     // 'idle' | 'loading' | 'resolved' | 'error'
userResource.error();      // El error si falló
userResource.isLoading();  // boolean
userResource.hasValue();   // boolean
```

## httpResource (Data Fetching con HttpClient)

Version de `resource` que usa `HttpClient` internamente (soporte para interceptores, auth, etc.).

```ts
import {httpResource} from '@angular/common/http';

const resumenes = httpResource<VideoSummary[]>({
  url: '/api/summaries',
  defaultValue: [],
});

// Con parámetros reactivos
const resumen = httpResource<VideoSummary>({
  url: () => `/api/summaries/${this.id()}`,
});
```

## Patrón Recomendado: Store con Signals

```ts
import {Service, signal, computed} from '@angular/core';

@Service()
export class VideoStore {
  // Estado privado mutable
  private readonly _videos = signal<VideoSummary[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Estado público de solo lectura
  readonly videos = this._videos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  // Derivados computados
  readonly pendientes = computed(() =>
    this._videos().filter(v => v.status === 'PENDING').length
  );
  readonly completados = computed(() =>
    this._videos().filter(v => v.status === 'SUCCESS').length
  );
  readonly conError = computed(() =>
    this._videos().filter(v => v.status === 'ERROR').length
  );

  agregarVideo(video: VideoSummary) {
    this._videos.update(list => [...list, video]);
  }

  actualizarEstado(id: string, status: Status) {
    this._videos.update(list =>
      list.map(v => v.id === id ? { ...v, status } : v)
    );
  }
}
```
