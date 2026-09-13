import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SummaryTableComponent } from './summary-table';
import { SummariesStore } from '../../store/summaries.store';
import { ToastService } from '../../../../core/services/toast.service';
import { VideoSummary } from '../../../../core/models/summary.model';

describe('SummaryTableComponent', () => {
  let component: SummaryTableComponent;
  let fixture: ComponentFixture<SummaryTableComponent>;

  let filteredVideosSignal: ReturnType<typeof signal<VideoSummary[]>>;
  let filterStatusSignal: ReturnType<typeof signal<string>>;
  let searchQuerySignal: ReturnType<typeof signal<string>>;
  let loadingSignal: ReturnType<typeof signal<boolean>>;

  let setFilterStatusSpy: ReturnType<typeof vi.fn>;
  let setSearchQuerySpy: ReturnType<typeof vi.fn>;
  let openModalSpy: ReturnType<typeof vi.fn>;
  let deleteSpy: ReturnType<typeof vi.fn>;

  const mockVideos: VideoSummary[] = [
    {
      id: 'vid-1',
      youtubeUrl: 'https://youtube.com/watch?v=1',
      videoTitle: 'Introducción a Angular Signals',
      channelName: 'Angular Team',
      status: 'SUCCESS',
      createdAt: '2026-09-10T12:00:00.000Z',
      updatedAt: '2026-09-10T12:05:00.000Z',
    },
  ];

  beforeEach(async () => {
    filteredVideosSignal = signal(mockVideos);
    filterStatusSignal = signal('ALL');
    searchQuerySignal = signal('');
    loadingSignal = signal(false);

    setFilterStatusSpy = vi.fn();
    setSearchQuerySpy = vi.fn();
    openModalSpy = vi.fn();
    deleteSpy = vi.fn();

    const mockStore = {
      filteredVideos: filteredVideosSignal.asReadonly(),
      filterStatus: filterStatusSignal.asReadonly(),
      searchQuery: searchQuerySignal.asReadonly(),
      loading: loadingSignal.asReadonly(),
      totalVideos: signal(1).asReadonly(),
      completados: signal(1).asReadonly(),
      pendientes: signal(0).asReadonly(),
      conError: signal(0).asReadonly(),
      setFilterStatus: setFilterStatusSpy,
      setSearchQuery: setSearchQuerySpy,
      openModal: openModalSpy,
      delete: deleteSpy,
    };

    await TestBed.configureTestingModule({
      imports: [SummaryTableComponent],
      providers: [
        { provide: SummariesStore, useValue: mockStore },
        ToastService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SummaryTableComponent);
    component = fixture.componentInstance;
  });

  it('debería renderizar la lista de videos en la tabla', async () => {
    // Wait
    await fixture.whenStable();

    // Assert
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Introducción a Angular Signals');
    expect(el.textContent).toContain('Angular Team');
  });

  it('debería invocar store.setFilterStatus al pulsar un filtro', async () => {
    // Act
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const successFilterBtn = Array.from(buttons).find((b: any) =>
      b.textContent.includes('Completados'),
    ) as HTMLButtonElement;

    expect(successFilterBtn).toBeTruthy();
    successFilterBtn.click();

    // Wait
    await fixture.whenStable();

    // Assert
    expect(setFilterStatusSpy).toHaveBeenCalledWith('SUCCESS');
  });

  it('debería invocar store.openModal al hacer click en Ver Resumen', async () => {
    // Act
    const viewBtn = fixture.nativeElement.querySelector('button[title*="Ver resumen"]') as HTMLButtonElement;
    expect(viewBtn).toBeTruthy();
    viewBtn.click();

    // Wait
    await fixture.whenStable();

    // Assert
    expect(openModalSpy).toHaveBeenCalledWith(mockVideos[0]);
  });
});
