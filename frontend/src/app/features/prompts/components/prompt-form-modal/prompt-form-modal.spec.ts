import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PromptFormModalComponent } from './prompt-form-modal';
import { PromptApiService } from '../../../../core/services/prompt-api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Prompt } from '../../../../core/models/prompt.model';

describe('PromptFormModalComponent', () => {
  let component: PromptFormModalComponent;
  let fixture: ComponentFixture<PromptFormModalComponent>;
  let mockApi: {
    createPrompt: ReturnType<typeof vi.fn>;
    updatePrompt: ReturnType<typeof vi.fn>;
  };
  let mockToast: {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
  };

  const existingPrompt: Prompt = {
    id: 'p-1',
    name: 'Prompt Existente',
    content: 'Instrucciones para resumir contenido...',
    tags: ['ia', 'youtube'],
    isDefault: true,
    isActive: true,
    usageCount: 5,
    createdAt: '2026-09-10T12:00:00.000Z',
    updatedAt: '2026-09-11T12:00:00.000Z',
  };

  beforeEach(async () => {
    mockApi = {
      createPrompt: vi.fn().mockReturnValue(
        of({
          statusCode: 201,
          message: 'Prompt created',
          data: { ...existingPrompt, id: 'p-new' },
        }),
      ),
      updatePrompt: vi.fn().mockReturnValue(
        of({
          statusCode: 200,
          message: 'Prompt updated',
          data: existingPrompt,
        }),
      ),
    };

    mockToast = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PromptFormModalComponent],
      providers: [
        { provide: PromptApiService, useValue: mockApi },
        { provide: ToastService, useValue: mockToast },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptFormModalComponent);
    component = fixture.componentInstance;
  });

  it('debería inicializar en modo creación por defecto cuando prompt es null', () => {
    expect(component.isEditing).toBe(false);
    expect(component.name).toBe('');
    expect(component.content).toBe('');
    expect(component.isDefault).toBe(false);
    expect(component.isActive).toBe(true);
  });

  it('debería inicializar en modo edición con los datos del prompt provisto', () => {
    component.prompt = existingPrompt;
    component.ngOnInit();

    expect(component.isEditing).toBe(true);
    expect(component.name).toBe('Prompt Existente');
    expect(component.content).toBe('Instrucciones para resumir contenido...');
    expect(component.tagsInput).toBe('ia, youtube');
    expect(component.isDefault).toBe(true);
    expect(component.isActive).toBe(true);
  });

  it('debería parsear correctamente los tags con parseTags', () => {
    component.tagsInput = ' #podcast, YOUTUBE ,  , #Angular ';
    expect(component.parseTags()).toEqual(['podcast', 'youtube', 'angular']);
  });

  it('debería mostrar error y no enviar si falta nombre o contenido', () => {
    component.name = '';
    component.content = 'Solo contenido';
    component.onSubmit();

    expect(mockToast.error).toHaveBeenCalledWith('El nombre y el contenido del prompt son obligatorios');
    expect(mockApi.createPrompt).not.toHaveBeenCalled();
    expect(mockApi.updatePrompt).not.toHaveBeenCalled();

    mockToast.error.mockClear();
    component.name = 'Solo nombre';
    component.content = '   ';
    component.onSubmit();

    expect(mockToast.error).toHaveBeenCalledWith('El nombre y el contenido del prompt son obligatorios');
    expect(mockApi.createPrompt).not.toHaveBeenCalled();
  });

  it('debería invocar createPrompt y emitir onSaved en modo creación', () => {
    const savedSpy = vi.spyOn(component.onSaved, 'emit');

    component.name = 'Nuevo Prompt';
    component.content = 'Contenido nuevo';
    component.tagsInput = 'nuevo, test';
    component.isDefault = false;
    component.isActive = true;

    component.onSubmit();

    expect(mockApi.createPrompt).toHaveBeenCalledWith({
      name: 'Nuevo Prompt',
      content: 'Contenido nuevo',
      tags: ['nuevo', 'test'],
      isDefault: false,
      isActive: true,
    });
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('creado exitosamente'));
    expect(savedSpy).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('debería manejar error al crear prompt', () => {
    mockApi.createPrompt.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Error duplicado' } })),
    );

    component.name = 'Duplicado';
    component.content = 'Contenido';
    component.onSubmit();

    expect(mockToast.error).toHaveBeenCalledWith('Error duplicado');
    expect(component.saving()).toBe(false);
  });

  it('debería invocar updatePrompt y emitir onSaved en modo edición', () => {
    const savedSpy = vi.spyOn(component.onSaved, 'emit');
    component.prompt = existingPrompt;
    component.ngOnInit();

    component.name = 'Prompt Modificado';
    component.onSubmit();

    expect(mockApi.updatePrompt).toHaveBeenCalledWith(existingPrompt.id, {
      name: 'Prompt Modificado',
      content: existingPrompt.content,
      tags: ['ia', 'youtube'],
      isDefault: true,
      isActive: true,
    });
    expect(mockToast.success).toHaveBeenCalledWith(expect.stringContaining('actualizado'));
    expect(savedSpy).toHaveBeenCalled();
    expect(component.saving()).toBe(false);
  });

  it('debería manejar error al actualizar prompt', () => {
    mockApi.updatePrompt.mockReturnValueOnce(
      throwError(() => ({ error: { message: 'Fallo de actualización' } })),
    );
    component.prompt = existingPrompt;
    component.ngOnInit();

    component.onSubmit();

    expect(mockToast.error).toHaveBeenCalledWith('Fallo de actualización');
    expect(component.saving()).toBe(false);
  });

  it('debería emitir onClose al cancelar', async () => {
    const closeSpy = vi.spyOn(component.onClose, 'emit');
    fixture.detectChanges();
    await fixture.whenStable();

    const cancelButton = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    expect(cancelButton).toBeTruthy();
    cancelButton.click();

    expect(closeSpy).toHaveBeenCalled();
  });
});
