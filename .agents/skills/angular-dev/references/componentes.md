# Componentes Angular

Los componentes son los bloques fundamentales de construcción de una aplicación Angular. Cada componente consiste en una clase TypeScript con comportamiento, un template HTML y un selector CSS.

## Definición de un Componente

Usar el decorator `@Component` para definir la metadata del componente.

```ts
@Component({
  selector: 'app-perfil',
  template: `
    <img src="perfil.jpg" alt="Foto de perfil" />
    <button (click)="guardar()">Guardar</button>
  `,
  styles: `
    img { border-radius: 50%; }
  `,
})
export class Perfil {
  guardar() { /* ... */ }
}
```

## Opciones de Metadata

- `selector`: El selector CSS que identifica este componente en templates.
- `template`: Template HTML inline (preferido para templates pequeños).
- `templateUrl`: Path a un archivo HTML externo.
- `styles`: Estilos CSS inline.
- `styleUrl` / `styleUrls`: Path(s) a archivo(s) CSS externo(s).
- `imports`: Lista los componentes, directivas o pipes usados en el template de este componente.

## Usar Componentes

Para usar un componente, agregarlo al array `imports` del componente consumidor y usar su selector en el template.

```ts
@Component({
  selector: 'app-root',
  imports: [Perfil],
  template: `<app-perfil />`,
})
export class App {}
```

### Self-Closing Tags (Etiquetas Auto-Cerradas)

**Regla:** Siempre usar etiquetas auto-cerradas cuando un componente no tiene contenido proyectado:

```html
<!-- ✅ Preferido: conciso y moderno -->
<app-perfil />
<app-tarjeta-usuario [user]="usuarioActual()" />
<router-outlet />

<!-- ❌ Evitar: tags de cierre redundantes -->
<app-perfil></app-perfil>
```

## Control Flow en Templates

Angular usa bloques built-in para renderizado condicional e iteración:

### @if / @else

```html
@if (usuario()) {
  <p>Hola, {{ usuario().nombre }}</p>
} @else {
  <p>No autenticado</p>
}
```

### @for

```html
@for (item of items(); track item.id) {
  <app-tarjeta [data]="item" />
} @empty {
  <p>No hay elementos</p>
}
```

**Regla:** Siempre usar `track` con una propiedad única para performance.

### @switch

```html
@switch (estado()) {
  @case ('PENDING') { <span>⏳ Procesando</span> }
  @case ('SUCCESS') { <span>✅ Completado</span> }
  @case ('ERROR')   { <span>❌ Error</span> }
}
```

## Signal Inputs (Entradas basadas en Signals)

Usar `input()` e `input.required()` en vez del decorator `@Input()`.

```ts
import {input} from '@angular/core';

@Component({ ... })
export class TarjetaVideo {
  // Input obligatorio
  titulo = input.required<string>();

  // Input opcional con valor por defecto
  mostrarAcciones = input(true);

  // Input con transformación
  estado = input('PENDING', {
    transform: (v: string) => v.toUpperCase() as Status,
  });
}
```

Uso en template padre:

```html
<app-tarjeta-video
  [titulo]="video.title"
  [mostrarAcciones]="false"
  [estado]="video.status" />
```

### Model Inputs (Two-Way Binding)

```ts
import {model} from '@angular/core';

@Component({ ... })
export class BuscadorUrl {
  url = model('');  // Two-way binding con signal
}
```

```html
<app-buscador-url [(url)]="urlActual" />
```

## Signal Outputs (Salidas basadas en Signals)

Usar `output()` en vez de `@Output() EventEmitter`.

```ts
import {output} from '@angular/core';

@Component({ ... })
export class BotonProcesar {
  procesarClick = output<string>();

  onClick() {
    this.procesarClick.emit(this.url());
  }
}
```

Escuchar en el padre:

```html
<app-boton-procesar (procesarClick)="iniciarProceso($event)" />
```

## Host Elements

Controlar el elemento host desde el decorator:

```ts
@Component({
  selector: 'app-alerta',
  host: {
    'role': 'alert',
    '[class.activa]': 'activa()',
    '(click)': 'onClick()',
  },
  template: `<ng-content />`,
})
export class Alerta {
  activa = input(false);
  onClick() { /* ... */ }
}
```

## Styling de Componentes

Angular encapsula los estilos de cada componente por defecto (ViewEncapsulation.Emulated):

- Los estilos de un componente **no afectan** a otros componentes
- Usar `::ng-deep` solo como último recurso (deprecated)
- Preferir CSS custom properties para theming
- Para estilos globales, usar `styles.css` en la raíz del proyecto

## Buenas Prácticas

1. **Un componente = una responsabilidad** (Single Responsibility)
2. **Componentes pequeños**: si un template supera ~50 líneas, dividirlo
3. **Signal Inputs/Outputs** en vez de decorators `@Input()`/`@Output()`
4. **Self-closing tags** siempre que no haya contenido proyectado
5. **`track`** obligatorio en `@for` para performance
6. **Importar** explícitamente las dependencias en `imports`
