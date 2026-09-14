import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PromptDetailModalComponent } from './prompt-detail-modal';
import { PromptApiService } from '../../../../core/services/prompt-api.service';
import { Prompt, PromptSummaryItem } from '../../../../core/models/prompt.model';

describe('PromptDetailModalComponent', () => {
  let component: PromptDetailModalComponent;
  let fixture: ComponentFixture<PromptDetailModalComponent>;
  let mockApi: {
    getSummariesByPrompt: ReturnType<typeof vi.fn>;
  };

  const mockPrompt: Prompt = {
    id: 'p-100',
    name: 'Prompt para Análisis',
    content: 'Analiza el siguiente texto de forma detallada...',
    tags: ['analisis', 'profundo'],
    isDefault: true,
    isActive: true,
    usageCount: 12,
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-02T10:00:00.000Z',
  };

  const mockSummaries: PromptSummaryItem[] = [
    {
      id: 's-1',
      youtubeUrl: 'https://youtube.com/watch?v=111',
      videoTitle: 'Video sobre TypeScript',
      channelName: 'Code Channel',
      status: 'SUCCESS',
      createdAt: '2026-09-10T12:00:00.000Z',
    },
    {
      id: 's-2',
      youtubeUrl: 'https://youtube.com/watch?v=222',
      videoTitle: 'Video con Error',
      channelName: 'Dev Channel',
      status: 'ERROR',
      createdAt: '2026-09-11T12:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    mockApi = {
      getSummariesByPrompt: vi.fn().mockReturnValue(
        of({
          data: mockSummaries,
          total: 25,
          page: 1,
          limit: 10,
          totalPages: 3,
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [PromptDetailModalComponent],
      providers: [
        { provide: PromptApiService, useValue: mockApi },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptDetailModalComponent);
    component = fixture.componentInstance;
    component.prompt = mockPrompt;
  });

  it('debería renderizar la información inicial del prompt y cargar el historial', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockApi.getSummariesByPrompt).toHaveBeenCalledWith(mockPrompt.id, 1, 10);
    expect(component.summaries()).toEqual(mockSummaries);
    expect(component.totalSummaries()).toBe(25);
    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(3);

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Prompt para Análisis');
    expect(el.textContent).toContain('12');
    expect(el.textContent).toContain('#analisis');
    expect(el.textContent).toContain('#profundo');
  });

  it('debería cambiar de pestaña entre info, history y content', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.activeTab()).toBe('info');

    // Cambiar a Historial
    component.activeTab.set('history');
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Video sobre TypeScript');
    expect(el.textContent).toContain('Code Channel');

    // Cambiar a Contenido
    component.activeTab.set('content');
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.textContent).toContain('Analiza el siguiente texto de forma detallada...');
  });

  it('debería manejar la paginación con nextPage y prevPage', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    // Siguiente página
    component.nextPage();
    expect(mockApi.getSummariesByPrompt).toHaveBeenCalledWith(mockPrompt.id, 2, 10);

    // Si está en página 2, ir a la previa
    component.currentPage.set(2);
    component.prevPage();
    expect(mockApi.getSummariesByPrompt).toHaveBeenCalledWith(mockPrompt.id, 1, 10);
  });

  it('no debería cambiar de página si está en los límites', () => {
    mockApi.getSummariesByPrompt.mockClear();

    // En la primera página, prevPage no debe ejecutar nada
    component.currentPage.set(1);
    component.prevPage();
    expect(mockApi.getSummariesByPrompt).not.toHaveBeenCalled();

    // En la última página, nextPage no debe ejecutar nada
    component.currentPage.set(3);
    component.totalPages.set(3);
    component.nextPage();
    expect(mockApi.getSummariesByPrompt).not.toHaveBeenCalled();
  });

  it('debería manejar error al cargar historial', () => {
    mockApi.getSummariesByPrompt.mockReturnValueOnce(throwError(() => new Error('Error')));
    component.loadHistory(1);
    expect(component.loading()).toBe(false);
  });

  it('debería emitir onClose al hacer click en el botón de cerrar', async () => {
    const closeSpy = vi.spyOn(component.onClose, 'emit');
    fixture.detectChanges();
    await fixture.whenStable();

    const closeBtn = fixture.nativeElement.querySelector('button.text-xl') as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();
    closeBtn.click();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('debería emitir onEdit y onClose al hacer click en editar desde la pestaña info', async () => {
    const editSpy = vi.spyOn(component.onEdit, 'emit');
    const closeSpy = vi.spyOn(component.onClose, 'emit');
    fixture.detectChanges();
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const editBtn = Array.from(buttons).find((b: any) =>
      b.textContent.includes('Editar este prompt'),
    ) as HTMLButtonElement;

    expect(editBtn).toBeTruthy();
    editBtn.click();

    expect(editSpy).toHaveBeenCalledWith(mockPrompt);
    expect(closeSpy).toHaveBeenCalled();
  });

  it('debería retornar etiquetas y clases correctas según el estado', () => {
    expect(component.getStatusLabel('SUCCESS')).toBe('✓ Completado');
    expect(component.getStatusLabel('ERROR')).toBe('✗ Error');
    expect(component.getStatusLabel('PENDING')).toBe('⏳ Pendiente');

    expect(component.getStatusClass('SUCCESS')).toContain('bright-green');
    expect(component.getStatusClass('ERROR')).toContain('bright-red');
    expect(component.getStatusClass('PENDING')).toContain('bright-yellow');
  });
});
