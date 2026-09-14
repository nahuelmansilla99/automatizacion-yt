import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SummariesStore } from '../../store/summaries.store';
import { PromptApiService } from '../../../../core/services/prompt-api.service';
import { Prompt } from '../../../../core/models/prompt.model';

@Component({
  selector: 'app-url-input-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './url-input-card.html',
  styleUrl: './url-input-card.css',
})
export class UrlInputCardComponent implements OnInit {
  readonly store = inject(SummariesStore);
  private readonly promptApi = inject(PromptApiService);

  readonly url = signal('');
  readonly hasError = signal(false);
  readonly prompts = signal<Prompt[]>([]);
  readonly selectedPromptId = signal<string | undefined>(undefined);

  private readonly youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/;

  ngOnInit(): void {
    this.loadPrompts();
  }

  loadPrompts(): void {
    this.promptApi.getPrompts({ isActive: true, limit: 50 }).subscribe({
      next: (res) => {
        this.prompts.set(res.data);
        // Preseleccionar el prompt default
        const defaultPrompt = res.data.find((p) => p.isDefault);
        if (defaultPrompt) {
          this.selectedPromptId.set(defaultPrompt.id);
        }
      },
      error: () => {
        // No interrumpir el flujo si los prompts no cargan
      },
    });
  }

  onUrlChange(val: string) {
    if (val && !this.youtubeRegex.test(val.trim())) {
      this.hasError.set(true);
    } else {
      this.hasError.set(false);
    }
  }

  isValidUrl(): boolean {
    const val = this.url().trim();
    return val.length > 0 && this.youtubeRegex.test(val);
  }

  clearUrl() {
    this.url.set('');
    this.hasError.set(false);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.isValidUrl()) {
      this.hasError.set(true);
      return;
    }

    this.store.requestSummary(this.url().trim(), this.selectedPromptId(), () => {
      this.clearUrl();
    });
  }

  getSelectedPromptName(): string {
    const id = this.selectedPromptId();
    if (!id) return 'Prompt predeterminado';
    const found = this.prompts().find((p) => p.id === id);
    return found ? found.name : 'Prompt predeterminado';
  }
}
