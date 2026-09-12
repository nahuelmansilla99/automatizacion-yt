import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container';
import { ToastService } from '../../../core/services/toast.service';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [ToastService],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastContainerComponent);
    toastService = TestBed.inject(ToastService);
  });

  it('debería mostrar un toast cuando se añade uno al servicio', async () => {
    // Act
    toastService.success('Resumen completado', 'Éxito');

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Resumen completado');
    expect(el.textContent).toContain('Éxito');
  });

  it('debería eliminar el toast cuando se hace click en el botón de cerrar', async () => {
    // Act
    toastService.info('Mensaje de prueba');
    await fixture.whenStable();

    const closeBtn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).not.toContain('Mensaje de prueba');
  });
});
