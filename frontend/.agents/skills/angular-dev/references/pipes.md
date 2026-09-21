# Pipes (Transformaciones Reutilizables)

Las pipes son funciones de transformación que se usan en templates para formatear datos sin modificar el valor original.

## Pipes Built-in de Angular

| Pipe | Qué hace | Ejemplo |
|------|----------|---------|
| `DatePipe` | Formatea fechas | `{{ fecha \| date:'dd/MM/yyyy' }}` |
| `CurrencyPipe` | Formatea moneda | `{{ precio \| currency:'ARS' }}` |
| `DecimalPipe` | Formatea números | `{{ valor \| number:'1.2-2' }}` |
| `UpperCasePipe` | Mayúsculas | `{{ texto \| uppercase }}` |
| `LowerCasePipe` | Minúsculas | `{{ texto \| lowercase }}` |
| `TitleCasePipe` | Capitalizar | `{{ texto \| titlecase }}` |
| `JsonPipe` | Serializar JSON | `{{ objeto \| json }}` (debug) |
| `SlicePipe` | Cortar arrays/strings | `{{ lista \| slice:0:5 }}` |
| `AsyncPipe` | Resolver Observables | `{{ observable$ \| async }}` |

## Crear Custom Pipes

Generar con CLI:

```bash
ng generate pipe shared/truncate
```

### Pipe de Truncado de Texto

```ts
import {Pipe, PipeTransform} from '@angular/core';

@Pipe({ name: 'truncate' })
export class TruncatePipe implements PipeTransform {
  transform(value: string, maxLength = 50, ellipsis = '...'): string {
    if (!value) return '';
    return value.length > maxLength
      ? value.substring(0, maxLength) + ellipsis
      : value;
  }
}
```

Uso: `{{ video.title | truncate:40 }}`

### Pipe de Tiempo Relativo

```ts
@Pipe({ name: 'tiempoRelativo' })
export class TiempoRelativoPipe implements PipeTransform {
  transform(value: Date | string): string {
    const fecha = new Date(value);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fecha.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Hace un momento';
    if (diffMin < 60) return `Hace ${diffMin} min`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `Hace ${diffHrs}h`;
    const diffDays = Math.floor(diffHrs / 24);
    return `Hace ${diffDays}d`;
  }
}
```

### Pipe de Estado Terminal (ASCII / Glifos)

```ts
@Pipe({ name: 'statusBadge' })
export class StatusBadgePipe implements PipeTransform {
  transform(status: 'PENDING' | 'SUCCESS' | 'ERROR'): string {
    const badges: Record<string, string> = {
      PENDING: '[ ◌ PROCESANDO ]',
      SUCCESS: '[ ● COMPLETADO ]',
      ERROR: '[ ✕ ERROR ]',
    };
    return badges[status] ?? `[ ${status} ]`;
  }
}
```

## Pipes Puras vs Impuras

- **Pure (default)**: Solo se re-ejecuta cuando cambia la **referencia** del input. Mejor performance.
- **Impure** (`pure: false`): Se re-ejecuta en cada ciclo de detección de cambios. Evitar a menos que sea necesario.

```ts
// Pipe impura (usar solo cuando sea estrictamente necesario)
@Pipe({ name: 'filtrar', pure: false })
export class FiltrarPipe implements PipeTransform { ... }
```

## Buenas Prácticas

1. **Siempre crear pipes para lógica de presentación repetida** en vez de métodos en componentes
2. **Ubicar pipes reutilizables en `shared/`**
3. **Mantener pipes puras** siempre que sea posible
4. **Encadenar pipes** en vez de crear una pipe monolítica: `{{ fecha | date:'short' | uppercase }}`
5. **Importar pipes** en el array `imports` de cada componente que las use
