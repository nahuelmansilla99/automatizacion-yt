import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SupadataMetricsCardComponent } from './supadata-metrics-card';
import { SummariesStore } from '../../store/summaries.store';
import { AppMetricsResponse } from '../../../../core/models/summary.model';

describe('SupadataMetricsCardComponent', () => {
  let component: SupadataMetricsCardComponent;
  let fixture: ComponentFixture<SupadataMetricsCardComponent>;
  let metricsSignal: ReturnType<typeof signal<AppMetricsResponse | null>>;
  let metricsLoadingSignal: ReturnType<typeof signal<boolean>>;
  let loadMetricsSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    metricsSignal = signal<AppMetricsResponse | null>(null);
    metricsLoadingSignal = signal(false);
    loadMetricsSpy = vi.fn();

    const mockStore = {
      metrics: metricsSignal.asReadonly(),
      metricsLoading: metricsLoadingSignal.asReadonly(),
      loadMetrics: loadMetricsSpy,
    };

    await TestBed.configureTestingModule({
      imports: [SupadataMetricsCardComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupadataMetricsCardComponent);
    component = fixture.componentInstance;
  });

  it('debería calcular el porcentaje de uso correctamente', async () => {
    // Act
    metricsSignal.set({
      supadata: {
        plan: 'Free',
        usedCredits: 25,
        remainingCredits: 75,
        maxCredits: 100,
        resetDate: '2026-10-01',
      },
    });

    // Wait
    await fixture.whenStable();

    // Assert
    expect(component.usagePercent()).toBe(25);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('25%');
    expect(el.textContent).toContain('75 créditos');
  });

  it('debería mostrar mensaje informativo si no hay métricas configuradas', async () => {
    // Act
    metricsSignal.set(null);

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('SUPADATA_API_KEY');
  });

  it('debería invocar loadMetrics al hacer click en refrescar', async () => {
    // Act
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    // Wait
    await fixture.whenStable();

    // Assert
    expect(loadMetricsSpy).toHaveBeenCalledWith(true);
  });
});
