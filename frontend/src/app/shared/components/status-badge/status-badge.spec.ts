import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('debería mostrar badge COMPLETADO para status SUCCESS', async () => {
    // Act
    fixture.componentRef.setInput('status', 'SUCCESS');

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('COMPLETADO');
  });

  it('debería mostrar badge PROCESANDO para status PENDING', async () => {
    // Act
    fixture.componentRef.setInput('status', 'PENDING');

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('PROCESANDO');
  });

  it('debería mostrar badge ERROR para status ERROR', async () => {
    // Act
    fixture.componentRef.setInput('status', 'ERROR');

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('ERROR');
  });
});
