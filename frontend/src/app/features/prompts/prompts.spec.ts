import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PromptsComponent } from './prompts';
import { PromptApiService } from '../../core/services/prompt-api.service';
import { ToastService } from '../../core/services/toast.service';
import { Prompt } from '../../core/models/prompt.model';

describe('PromptsComponent', () => {
  let component: PromptsComponent;
  let fixture: ComponentFixture<PromptsComponent>;
  let mockApi: {
    getPrompts: ReturnType<typeof vi.fn>;
    setDefault: ReturnType<typeof vi.fn>;
    deletePrompt: ReturnType<typeof vi.fn>;
    updatePrompt: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    info: ReturnType<typeof vi.fn>;
    warning: ReturnType<typeof vi.fn>;
  };

  const mockPrompts: Prompt[] = [
    {
      id: 'p-1',
      name: 'Default Prompt',
      content: 'Resume este video detalladamente...',
      tags: ['youtube', 'resumen'],
      isDefault: true,
      isActive: true,
      usageCount: 15,
      createdAt: '2026-09-10T12:00:00.000Z',
      updatedAt: '2026-09-11T14:00:00.000Z',
    },
    {
      id: 'p-2',
      name: 'Prompt Secundario',
      content: 'Resume en 3 puntos clave',
      tags: ['puntos'],
      isDefault: false,
      isActive: false,
      usageCount: 3,
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T11:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    mockApi = {
      getPrompts: vi.fn().mockReturnValue(
        of({
          data: mockPrompts,
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        }),
      ),
      setDefault: vi.fn().mockReturnValue(
        of({
          statusCode: 200,
          message: 'Prompt set as default',
          data: { ...mockPrompts[1], isDefault: true },
        }),
      ),
      deletePrompt: vi.fn().mockReturnValue(
        of({ deleted: true }),
      ),
      updatePrompt: vi.fn().mockReturnValue(
        of({
          statusCode: 200,
          message: 'Prompt updated',
          data: { ...mockPrompts[0], isActive: false },
        }),
      ),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      warning: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PromptsComponent],
      providers: [
        { provide: PromptApiService, useValue: mockApi },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptsComponent);
    component = fixture.componentInstance;
  });

  it('debería montarse y cargar prompts al inicializar', async () => {
    fixture.detectChanges();
    await fixture.whenStable();

    expect(mockApi.getPrompts).toHaveBeenCalledWith({ limit: 100 });
    expect(component.prompts()).toEqual(mockPrompts);
    expect(component.loading()).toBe(false);
  });

  it('debería manejar error al cargar prompts', async () => {
    mockApi.getPrompts.mockReturnValueOnce(throwError(() => new Error('Error al cargar')));
    component.loadPrompts();

    expect(component.loading()).toBe(false);
    expect(mockToast.error).toHaveBeenCalledWith('Error al cargar los prompts');
  });

  it('debería abrir el modal de creación con openCreateForm', () => {
    component.openCreateForm();

    expect(component.editingPrompt()).toBeNull();
    expect(component.isFormModalOpen()).toBe(true);
  });

  it('debería abrir el modal de edición con openEditForm', () => {
    component.openEditForm(mockPrompts[0]);

    expect(component.editingPrompt()).toBe(mockPrompts[0]);
    expect(component.isFormModalOpen()).toBe(true);
  });

  it('debería cerrar el modal de formulario con closeFormModal', () => {
    component.openEditForm(mockPrompts[0]);
    component.closeFormModal();

    expect(component.isFormModalOpen()).toBe(false);
    expect(component.editingPrompt()).toBeNull();
  });

  it('debería abrir y cerrar el detalle del prompt con openDetail y closeDetail', () => {
    component.openDetail(mockPrompts[0]);
    expect(component.detailPrompt()).toBe(mockPrompts[0]);

    component.closeDetail();
    expect(component.detailPrompt()).toBeNull();
  });

  it('debería cerrar modal y recargar prompts en onPromptSaved', () => {
    const loadSpy = vi.spyOn(component, 'loadPrompts');
    component.openCreateForm();

    component.onPromptSaved();

    expect(component.isFormModalOpen()).toBe(false);
    expect(loadSpy).toHaveBeenCalled();
  });

  it('debería establecer un prompt como default exitosamente', () => {
    const loadSpy = vi.spyOn(component, 'loadPrompts');
    component.setDefault(mockPrompts[1]);

    expect(mockApi.setDefault).toHaveBeenCalledWith(mockPrompts[1].id);
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('es ahora el prompt predeterminado'));
    expect(loadSpy).toHaveBeenCalled();
  });

  it('debería manejar error al establecer un prompt como default', () => {
    mockApi.setDefault.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Fallo al marcar default' } })),
    );

    component.setDefault(mockPrompts[1]);

    expect(mockToast.error).toHaveBeenCalledWith('Fallo al marcar default');
  });

  it('no debería eliminar prompt si el usuario cancela confirmación', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    component.deletePrompt(mockPrompts[0]);

    expect(mockApi.deletePrompt).not.toHaveBeenCalled();
  });

  it('debería eliminar prompt si el usuario confirma', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const loadSpy = vi.spyOn(component, 'loadPrompts');

    component.deletePrompt(mockPrompts[0]);

    expect(mockApi.deletePrompt).toHaveBeenCalledWith(mockPrompts[0].id);
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('eliminado'));
    expect(loadSpy).toHaveBeenCalled();
  });

  it('debería alternar el estado activo (toggleActive) exitosamente', () => {
    const loadSpy = vi.spyOn(component, 'loadPrompts');

    component.toggleActive(mockPrompts[0]);

    expect(mockApi.updatePrompt).toHaveBeenCalledWith(mockPrompts[0].id, { isActive: false });
    expect(mockToast.success).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
  });
});
