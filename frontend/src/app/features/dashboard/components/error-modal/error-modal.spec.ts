import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ErrorModalComponent } from './error-modal';
import { SummariesStore } from '../../store/summaries.store';
import { VideoSummary } from '../../../../core/models/summary.model';

describe('ErrorModalComponent', () => {
  let component: ErrorModalComponent;
  let fixture: ComponentFixture<ErrorModalComponent>;
  let errorModalSummarySignal: ReturnType<typeof signal<VideoSummary | null>>;
  let closeErrorModalSpy: ReturnType<typeof vi.fn>;
  let retrySpy: ReturnType<typeof vi.fn>;

  const mockErrorSummary: VideoSummary = {
    id: 'error-789',
    youtubeUrl: 'https://youtube.com/watch?v=err',
    videoTitle: 'Video Fallido',
    channelName: null,
    markdownContent: null,
    promptId: null,
    promptSnapshot: null,
    errorMessage: 'Error en nodo de n8n: Supadata timeout',
    status: 'ERROR',
    createdAt: '2026-09-10T19:00:00.000Z',
    updatedAt: '2026-09-10T19:02:00.000Z',
  };

  beforeEach(async () => {
    errorModalSummarySignal = signal<VideoSummary | null>(null);
    closeErrorModalSpy = vi.fn();
    retrySpy = vi.fn();

    const mockStore = {
      errorModalSummary: errorModalSummarySignal.asReadonly(),
      closeErrorModal: closeErrorModalSpy,
      retry: retrySpy,
    };

    await TestBed.configureTestingModule({
      imports: [ErrorModalComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorModalComponent);
    component = fixture.componentInstance;
  });

  it('no debería renderizarse cuando no hay un errorModalSummary seleccionado', async () => {
    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fixed')).toBeNull();
  });

  it('debería mostrar el mensaje de error capturado cuando se selecciona un summary con fallo', async () => {
    // Act
    errorModalSummarySignal.set(mockErrorSummary);

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fixed')).toBeTruthy();
    expect(el.textContent).toContain('ERROR_N8N');
    expect(el.textContent).toContain('Error en nodo de n8n: Supadata timeout');
  });

  it('debería invocar retry y cerrar modal al ejecutar onRetry', async () => {
    // Act
    errorModalSummarySignal.set(mockErrorSummary);
    await fixture.whenStable();

    component.onRetry('error-789');

    // Wait
    await fixture.whenStable();

    // Assert
    expect(closeErrorModalSpy).toHaveBeenCalled();
    expect(retrySpy).toHaveBeenCalledWith('error-789');
  });
});
