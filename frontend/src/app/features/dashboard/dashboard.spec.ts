import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { DashboardComponent } from './dashboard';
import { SummariesStore } from './store/summaries.store';
import { ToastService } from '../../core/services/toast.service';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let initSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    initSpy = vi.fn();

    const mockStore = {
      init: initSpy,
      videos: signal([]).asReadonly(),
      filteredVideos: signal([]).asReadonly(),
      loading: signal(false).asReadonly(),
      submitting: signal(false).asReadonly(),
      metrics: signal(null).asReadonly(),
      metricsLoading: signal(false).asReadonly(),
      selectedSummary: signal(null).asReadonly(),
      isModalOpen: signal(false).asReadonly(),
      errorModalSummary: signal(null).asReadonly(),
      filterStatus: signal('ALL').asReadonly(),
      searchQuery: signal('').asReadonly(),
      totalVideos: signal(0).asReadonly(),
      completados: signal(0).asReadonly(),
      pendientes: signal(0).asReadonly(),
      conError: signal(0).asReadonly(),
      loadMetrics: vi.fn(),
      requestSummary: vi.fn(),
      setFilterStatus: vi.fn(),
      setSearchQuery: vi.fn(),
      closeModal: vi.fn(),
      closeErrorModal: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
  });

  it('debería inicializar el store al montarse', async () => {
    // Wait
    await fixture.whenStable();

    // Assert
    expect(initSpy).toHaveBeenCalled();
  });

  it('debería renderizar la estructura con los componentes del dashboard', async () => {
    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('app-url-input-card')).toBeTruthy();
    expect(el.querySelector('app-supadata-metrics-card')).toBeTruthy();
    expect(el.querySelector('app-summary-table')).toBeTruthy();
    expect(el.querySelector('app-summary-modal')).toBeTruthy();
    expect(el.querySelector('app-error-modal')).toBeTruthy();
  });
});
