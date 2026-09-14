import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PromptApiService } from '../../core/services/prompt-api.service';
import { ToastService } from '../../core/services/toast.service';
import { Prompt } from '../../core/models/prompt.model';
import { PromptListComponent } from './components/prompt-list/prompt-list';
import { PromptFormModalComponent } from './components/prompt-form-modal/prompt-form-modal';
import { PromptDetailModalComponent } from './components/prompt-detail-modal/prompt-detail-modal';

@Component({
  selector: 'app-prompts',
  standalone: true,
  imports: [
    CommonModule,
    PromptListComponent,
    PromptFormModalComponent,
    PromptDetailModalComponent,
  ],
  templateUrl: './prompts.html',
  styleUrl: './prompts.css',
})
export class PromptsComponent implements OnInit {
  private readonly api = inject(PromptApiService);
  private readonly toast = inject(ToastService);

  readonly prompts = signal<Prompt[]>([]);
  readonly loading = signal(false);
  readonly isFormModalOpen = signal(false);
  readonly editingPrompt = signal<Prompt | null>(null);
  readonly detailPrompt = signal<Prompt | null>(null);

  ngOnInit(): void {
    this.loadPrompts();
  }

  loadPrompts(): void {
    this.loading.set(true);
    this.api.getPrompts({ limit: 100 }).subscribe({
      next: (res) => {
        this.prompts.set(res.data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar los prompts');
        this.loading.set(false);
      },
    });
  }

  openCreateForm(): void {
    this.editingPrompt.set(null);
    this.isFormModalOpen.set(true);
  }

  openEditForm(prompt: Prompt): void {
    this.editingPrompt.set(prompt);
    this.isFormModalOpen.set(true);
  }

  closeFormModal(): void {
    this.isFormModalOpen.set(false);
    this.editingPrompt.set(null);
  }

  openDetail(prompt: Prompt): void {
    this.detailPrompt.set(prompt);
  }

  closeDetail(): void {
    this.detailPrompt.set(null);
  }

  onPromptSaved(): void {
    this.closeFormModal();
    this.loadPrompts();
  }

  setDefault(prompt: Prompt): void {
    this.api.setDefault(prompt.id).subscribe({
      next: (res) => {
        this.toast.success(`"${res.data.name}" es ahora el prompt predeterminado`);
        this.loadPrompts();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al cambiar el prompt predeterminado');
      },
    });
  }

  deletePrompt(prompt: Prompt): void {
    if (!confirm(`¿Seguro que deseas eliminar el prompt "${prompt.name}"?`)) return;

    this.api.deletePrompt(prompt.id).subscribe({
      next: () => {
        this.toast.success(`Prompt "${prompt.name}" eliminado`);
        this.loadPrompts();
      },
      error: (err) => {
        this.toast.error(err.error?.message || 'Error al eliminar el prompt');
      },
    });
  }

  toggleActive(prompt: Prompt): void {
    this.api.updatePrompt(prompt.id, { isActive: !prompt.isActive }).subscribe({
      next: (res) => {
        const state = res.data.isActive ? 'activado' : 'desactivado';
        this.toast.success(`Prompt "${res.data.name}" ${state}`);
        this.loadPrompts();
      },
      error: () => {
        this.toast.error('Error al actualizar el estado del prompt');
      },
    });
  }
}
