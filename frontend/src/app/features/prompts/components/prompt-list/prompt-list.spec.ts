import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PromptListComponent } from './prompt-list';
import { Prompt } from '../../../../core/models/prompt.model';

describe('PromptListComponent', () => {
  let component: PromptListComponent;
  let fixture: ComponentFixture<PromptListComponent>;

  const mockPrompts: Prompt[] = [
    {
      id: 'p-1',
      name: 'Default Prompt',
      content: 'Contenido del prompt por defecto para transcripciones de youtube.',
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
      content: 'Contenido secundario',
      tags: ['bullets'],
      isDefault: false,
      isActive: false,
      usageCount: 2,
      createdAt: '2026-09-12T10:00:00.000Z',
      updatedAt: '2026-09-12T11:00:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromptListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PromptListComponent);
    component = fixture.componentInstance;
  });

  it('debería renderizar estado de carga cuando loading es true', async () => {
    component.loading = true;
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.animate-spin')).toBeTruthy();
  });

  it('debería renderizar mensaje de lista vacía cuando no hay prompts', async () => {
    component.loading = false;
    component.prompts = [];
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No hay prompts configurados');
  });

  it('debería renderizar la lista de prompts con sus badges y etiquetas', async () => {
    component.loading = false;
    component.prompts = mockPrompts;
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Default Prompt');
    expect(el.textContent).toContain('Predeterminado');
    expect(el.textContent).toContain('#youtube');
    expect(el.textContent).toContain('Prompt Secundario');
    expect(el.textContent).toContain('Inactivo');
  });

  it('debería formatear los tags correctamente con formatTags', () => {
    expect(component.formatTags(['test', 'angular'])).toBe('#test, #angular');
  });

  it('debería emitir onDetail al hacer click en Historial', async () => {
    component.loading = false;
    component.prompts = mockPrompts;
    fixture.detectChanges();
    await fixture.whenStable();

    const detailSpy = vi.spyOn(component.onDetail, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button[title="Ver historial"]');
    (buttons[0] as HTMLButtonElement).click();

    expect(detailSpy).toHaveBeenCalledWith(mockPrompts[0]);
  });

  it('debería emitir onEdit al hacer click en Editar', async () => {
    component.loading = false;
    component.prompts = mockPrompts;
    fixture.detectChanges();
    await fixture.whenStable();

    const editSpy = vi.spyOn(component.onEdit, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button[title="Editar prompt"]');
    (buttons[0] as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalledWith(mockPrompts[0]);
  });

  it('debería emitir onSetDefault al hacer click en ⭐ Default en un prompt no predeterminado', async () => {
    component.loading = false;
    component.prompts = mockPrompts;
    fixture.detectChanges();
    await fixture.whenStable();

    const defaultSpy = vi.spyOn(component.onSetDefault, 'emit');
    const button = fixture.nativeElement.querySelector('button[title="Establecer como predeterminado"]') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();

    expect(defaultSpy).toHaveBeenCalledWith(mockPrompts[1]);
  });

  it('debería emitir onToggleActive al hacer click en Activar/Desactivar', async () => {
    component.loading = false;
    component.prompts = mockPrompts;
    fixture.detectChanges();
    await fixture.whenStable();

    const toggleSpy = vi.spyOn(component.onToggleActive, 'emit');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    const toggleBtn = Array.from(buttons).find((b: any) =>
      b.getAttribute('title') === 'Desactivar' || b.getAttribute('title') === 'Activar',
    ) as HTMLButtonElement;

    expect(toggleBtn).toBeTruthy();
    toggleBtn.click();

    expect(toggleSpy).toHaveBeenCalledWith(mockPrompts[0]);
  });

  it('debería emitir onDelete al hacer click en Eliminar', async () => {
    component.loading = false;
    component.prompts = mockPrompts;
    fixture.detectChanges();
    await fixture.whenStable();

    const deleteSpy = vi.spyOn(component.onDelete, 'emit');
    const button = fixture.nativeElement.querySelector('button[title="Eliminar prompt"]') as HTMLButtonElement;
    expect(button).toBeTruthy();
    button.click();

    expect(deleteSpy).toHaveBeenCalledWith(mockPrompts[1]);
  });
});
