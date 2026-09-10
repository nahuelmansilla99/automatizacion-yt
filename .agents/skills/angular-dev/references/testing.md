# Testing (Pruebas Automatizadas)

Esta guía cubre el ecosistema completo de testing en Angular: unit tests, integration tests con Component Harnesses, y E2E tests.

## Filosofía: Zoneless y Async-First

Este proyecto sigue un enfoque de testing moderno y zoneless. Los cambios de estado se programan asincrónicamente, y los tests deben contemplar esto.

**NO** usar `fixture.detectChanges()` para disparar actualizaciones manualmente.
**SIEMPRE** usar el patrón **Act → Wait → Assert**:

1. **Act**: Actualizar estado o realizar una acción (ej: setear un input, hacer click)
2. **Wait**: Usar `await fixture.whenStable()` para esperar que el framework procese la actualización
3. **Assert**: Verificar el resultado

## Estructura Básica de un Test

```ts
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {StatusBadge} from './status-badge';

describe('StatusBadge', () => {
  let component: StatusBadge;
  let fixture: ComponentFixture<StatusBadge>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    fixture = TestBed.createComponent(StatusBadge);
    component = fixture.componentInstance;
  });

  it('debería mostrar icono de éxito para status SUCCESS', async () => {
    // Act
    fixture.componentRef.setInput('status', 'SUCCESS');

    // Wait
    await fixture.whenStable();

    // Assert
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toContain('✅');
  });

  it('debería mostrar icono de error para status ERROR', async () => {
    fixture.componentRef.setInput('status', 'ERROR');
    await fixture.whenStable();
    const badge = fixture.nativeElement.querySelector('.badge');
    expect(badge.textContent).toContain('❌');
  });
});
```

## Testear Services

```ts
import {TestBed} from '@angular/core/testing';
import {SummaryApi} from './summary-api';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';

describe('SummaryApi', () => {
  let service: SummaryApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SummaryApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('debería obtener todos los resúmenes', () => {
    const mockData: VideoSummary[] = [
      { id: '1', videoTitle: 'Test', status: 'SUCCESS' } as VideoSummary,
    ];

    service.getAll().subscribe(data => {
      expect(data).toEqual(mockData);
    });

    const req = httpMock.expectOne('/api/summaries');
    expect(req.request.method).toBe('GET');
    req.flush(mockData);
  });
});
```

## Component Harnesses

Los Component Harnesses proporcionan una API de alto nivel para interactuar con componentes en tests sin depender del DOM interno.

### Ventajas

- **Robustez**: Los tests no se rompen al refactorear el HTML o CSS interno
- **Legibilidad**: Los tests describen interacciones desde la perspectiva del usuario
- **Reutilización**: El mismo harness se puede usar en unit tests y E2E tests

### Ejemplo con MatButtonHarness

```ts
import {TestbedHarnessEnvironment} from '@angular/cdk/testing/testbed';
import {MatButtonHarness} from '@angular/material/button/testing';

describe('MiComponente', () => {
  it('debería deshabilitar el botón si no hay URL', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    const loader = TestbedHarnessEnvironment.loader(fixture);

    const boton = await loader.getHarness(MatButtonHarness.with({ text: 'Procesar' }));
    expect(await boton.isDisabled()).toBe(true);
  });
});
```

## E2E Testing con Playwright

### Setup

```bash
ng add playwright-ng-schematics
```

### Ejemplo de Test E2E

```ts
import {test, expect} from '@playwright/test';

test('debería procesar una URL de YouTube', async ({ page }) => {
  await page.goto('/dashboard');

  // Ingresar URL
  await page.fill('input[placeholder="URL de YouTube"]', 'https://youtube.com/watch?v=test');

  // Hacer click en Procesar
  await page.click('button:has-text("Procesar")');

  // Esperar que aparezca en la tabla con estado PENDING
  await expect(page.locator('text=⏳ Procesando')).toBeVisible();
});
```

## Qué Testear en tu Proyecto

| Qué | Tipo de Test | Prioridad |
|-----|-------------|----------|
| Services (API clients) | Unit test con HttpTestingController | 🔴 Alta |
| Stores (estado con signals) | Unit test | 🔴 Alta |
| Componentes con lógica | Unit test con Component Harnesses | 🟡 Media |
| Guards de autenticación | Unit test con Router Testing | 🟡 Media |
| Flujo completo (URL → resumen) | E2E con Playwright | 🟡 Media |
| Pipes personalizadas | Unit test simple | 🟢 Baja |

## Buenas Prácticas

1. **Siempre `await fixture.whenStable()`** — nunca `fixture.detectChanges()`
2. **Mockear dependencias externas** — no depender de APIs reales en unit tests
3. **Un test = una aserción principal** — tests enfocados y descriptivos
4. **Usar `describe` para agrupar** tests por funcionalidad
5. **Nombrar tests en español con `debería...`** para legibilidad
6. **`afterEach(() => httpMock.verify())`** para detectar requests no esperados
