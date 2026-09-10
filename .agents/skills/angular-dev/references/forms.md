# Formularios en Angular

Angular ofrece tres enfoques para formularios. Para proyectos nuevos (v22+), **Signal Forms** es el recomendado.

## Signal Forms (Recomendado para Angular v22+)

Formularios 100% basados en signals. Integración nativa con el sistema de reactividad de Angular.

```ts
import {SignalFormBuilder} from '@angular/forms/signal';

@Component({
  template: `
    <form (ngSubmit)="enviar()">
      <input [formField]="urlField" placeholder="URL de YouTube" />
      @if (urlField.errors()?.required) {
        <span class="error">La URL es obligatoria</span>
      }
      <button type="submit" [disabled]="!form.valid()">Procesar</button>
    </form>
  `,
})
export class DashboardForm {
  private readonly fb = inject(SignalFormBuilder);

  readonly form = this.fb.group({
    url: this.fb.field('', { validators: [Validators.required, Validators.pattern(/youtube\.com/)] }),
  });

  readonly urlField = this.form.get('url');

  enviar() {
    if (this.form.valid()) {
      const datos = this.form.value();
      // datos.url contiene la URL
    }
  }
}
```

## Reactive Forms (Para proyectos existentes o Angular < v22)

Enfoque imperativo con `FormGroup`, `FormControl` y `Validators`.

```ts
import {FormBuilder, Validators} from '@angular/forms';

@Component({
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="enviar()">
      <input formControlName="url" placeholder="URL de YouTube" />
      @if (form.get('url')?.hasError('required') && form.get('url')?.touched) {
        <span class="error">La URL es obligatoria</span>
      }
      <button type="submit" [disabled]="form.invalid">Procesar</button>
    </form>
  `,
})
export class DashboardForm {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    url: ['', [Validators.required, Validators.pattern(/youtube\.com/)]],
  });

  enviar() {
    if (this.form.valid) {
      const datos = this.form.getRawValue();
    }
  }
}
```

### Validadores Personalizados Reutilizables

```ts
import {AbstractControl, ValidationErrors} from '@angular/forms';

export function youtubeUrlValidator(control: AbstractControl): ValidationErrors | null {
  const url = control.value;
  if (!url) return null;
  const esValida = /^https?:\/\/(www\.)?youtube\.com\/watch/.test(url);
  return esValida ? null : { youtubeUrl: 'La URL no es un video válido de YouTube' };
}
```

## Template-Driven Forms (Para formularios simples)

Enfoque declarativo con `ngModel`. Solo para formularios muy simples.

```html
<form #f="ngForm" (ngSubmit)="enviar(f.value)">
  <input name="url" ngModel required placeholder="URL de YouTube" />
  <button type="submit" [disabled]="f.invalid">Enviar</button>
</form>
```

## Cuándo Usar Cada Enfoque

| Enfoque | Cuándo usarlo |
|---------|---------------|
| **Signal Forms** | Proyectos nuevos con Angular v22+. Mejor integración con signals |
| **Reactive Forms** | Proyectos existentes, formularios muy complejos y dinámicos |
| **Template-Driven** | Formularios muy simples (1-3 campos, sin lógica compleja) |
