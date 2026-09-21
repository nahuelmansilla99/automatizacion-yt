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
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Resumen');
    expect(el.innerHTML).toContain('terminal-heading-1');
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

  it('debería renderizar bloques de código con syntax highlighting y soportar onMarkdownClick para copiar', async () => {
    const summaryWithCode: VideoSummary = {
      ...mockSummary,
      markdownContent: '```bash\nnpm install\n```',
    };
    selectedSummarySignal.set(summaryWithCode);
    isModalOpenSignal.set(true);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.innerHTML).toContain('terminal-code-block');
    expect(el.innerHTML).toContain('[ BASH ]');
    expect(el.innerHTML).toContain('code-copy-btn');

    // Test clipboard copy via onMarkdownClick
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextSpy },
    });

    const fakeButton = document.createElement('button');
    fakeButton.className = 'code-copy-btn';
    fakeButton.setAttribute('data-code', encodeURIComponent('npm install'));
    const fakeEvent = {
      target: fakeButton,
    } as unknown as MouseEvent;

    component.onMarkdownClick(fakeEvent);
    expect(writeTextSpy).toHaveBeenCalledWith('npm install');
  });

  it('debería renderizar el panel de metadatos de Obsidian en el template cuando el markdown tiene frontmatter', async () => {
    const summaryWithFrontmatter: VideoSummary = {
      ...mockSummary,
      markdownContent: `---
Fecha: 2026-09-20
Canal: Canal Tech
tags:
  - "#ia"
  - "#angular"
---

# Titulo Principal
Contenido del resumen.`,
    };
    selectedSummarySignal.set(summaryWithFrontmatter);
    isModalOpenSignal.set(true);
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.terminal-frontmatter-panel')).toBeTruthy();
    expect(el.textContent).toContain('METADATOS OBSIDIAN');
    expect(el.textContent).toContain('2026-09-20');
    expect(el.textContent).toContain('#ia');
    expect(el.textContent).toContain('#angular');
  });
});
