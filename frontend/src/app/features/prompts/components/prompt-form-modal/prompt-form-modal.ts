import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Prompt, CreatePromptPayload, UpdatePromptPayload } from '../../../../core/models/prompt.model';
import { PromptApiService } from '../../../../core/services/prompt-api.service';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-prompt-form-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './prompt-form-modal.html',
  styleUrl: './prompt-form-modal.css',
})
export class PromptFormModalComponent implements OnInit {
  @Input() prompt: Prompt | null = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onSaved = new EventEmitter<void>();

  private readonly api = inject(PromptApiService);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);

  // Form fields
  name = '';
  content = '';
  tagsInput = '';
  isDefault = false;
  isActive = true;

  get isEditing(): boolean {
    return !!this.prompt;
  }

  ngOnInit(): void {
    if (this.prompt) {
      this.name = this.prompt.name;
      this.content = this.prompt.content;
      this.tagsInput = this.prompt.tags.join(', ');
      this.isDefault = this.prompt.isDefault;
      this.isActive = this.prompt.isActive;
    }
  }

  parseTags(): string[] {
    return this.tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, '').toLowerCase())
      .filter((t) => t.length > 0);
  }

  onSubmit(): void {
    if (!this.name.trim() || !this.content.trim()) {
      this.toast.error('El nombre y el contenido del prompt son obligatorios');
      return;
    }

    const tags = this.parseTags();
    this.saving.set(true);

    if (this.isEditing && this.prompt) {
      const payload: UpdatePromptPayload = {
        name: this.name.trim(),
        content: this.content.trim(),
        tags,
        isDefault: this.isDefault,
        isActive: this.isActive,
      };
      this.api.updatePrompt(this.prompt.id, payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success(`Prompt "${res.data.name}" actualizado`);
          this.onSaved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.error?.message || 'Error al actualizar el prompt');
        },
      });
    } else {
      const payload: CreatePromptPayload = {
        name: this.name.trim(),
        content: this.content.trim(),
        tags,
        isDefault: this.isDefault,
        isActive: this.isActive,
      };
      this.api.createPrompt(payload).subscribe({
        next: (res) => {
          this.saving.set(false);
          this.toast.success(`Prompt "${res.data.name}" creado exitosamente`);
          this.onSaved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err.error?.message || 'Error al crear el prompt');
        },
      });
    }
  }
}
