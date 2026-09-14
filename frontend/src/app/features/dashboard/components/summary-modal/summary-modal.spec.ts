import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SummaryModalComponent } from './summary-modal';
import { SummariesStore } from '../../store/summaries.store';
import { ToastService } from '../../../../core/services/toast.service';
import { VideoSummary } from '../../../../core/models/summary.model';

describe('SummaryModalComponent', () => {
  let component: SummaryModalComponent;
  let fixture: ComponentFixture<SummaryModalComponent>;
  let isModalOpenSignal: ReturnType<typeof signal<boolean>>;
  let selectedSummarySignal: ReturnType<typeof signal<VideoSummary | null>>;
  let closeModalSpy: ReturnType<typeof vi.fn>;

  const mockSummary: VideoSummary = {
    id: 'summary-123',
    youtubeUrl: 'https://youtube.com/watch?v=abc',
    videoTitle: 'Video de Prueba',
    channelName: 'Canal Tech',
    markdownContent: '# Resumen\n\nEste es un **resumen** de prueba.',
    status: 'SUCCESS',
    errorMessage: null,
    promptId: null,
    promptSnapshot: null,
    createdAt: '2026-09-10T20:00:00.000Z',
    updatedAt: '2026-09-10T20:05:00.000Z',
  };

  beforeEach(async () => {
    isModalOpenSignal = signal(false);
    selectedSummarySignal = signal<VideoSummary | null>(null);
    closeModalSpy = vi.fn();

    const mockStore = {
      isModalOpen: isModalOpenSignal.asReadonly(),
      selectedSummary: selectedSummarySignal.asReadonly(),
      closeModal: closeModalSpy,
    };

    await TestBed.configureTestingModule({
      imports: [SummaryModalComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryModalComponent);
    component = fixture.componentInstance;
  });

  it('no debería renderizar el modal cuando isModalOpen es false', async () => {
    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fixed')).toBeNull();
  });

  it('debería mostrar el modal y renderizar markdown cuando isModalOpen es true', async () => {
    // Act
    selectedSummarySignal.set(mockSummary);
    isModalOpenSignal.set(true);

    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.fixed')).toBeTruthy();
    expect(el.textContent).toContain('Video de Prueba');
    expect(component.renderedMarkdown()).toContain('<h1>Resumen</h1>');
  });

  it('debería cerrar el modal al invocar onBackdropClick', async () => {
    // Act
    selectedSummarySignal.set(mockSummary);
    isModalOpenSignal.set(true);
    await fixture.whenStable();

    component.onBackdropClick(new MouseEvent('click'));

    // Wait
    await fixture.whenStable();

    // Assert
    expect(closeModalSpy).toHaveBeenCalled();
  });
});
