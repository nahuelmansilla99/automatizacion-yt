import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Prompt, PromptSummaryItem, PromptSummariesResponse } from '../../../../core/models/prompt.model';
import { PromptApiService } from '../../../../core/services/prompt-api.service';

@Component({
  selector: 'app-prompt-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prompt-detail-modal.html',
  styleUrl: './prompt-detail-modal.css',
})
export class PromptDetailModalComponent implements OnInit {
  @Input() prompt!: Prompt;
  @Output() onClose = new EventEmitter<void>();
  @Output() onEdit = new EventEmitter<Prompt>();

  private readonly api = inject(PromptApiService);

  readonly summaries = signal<PromptSummaryItem[]>([]);
  readonly loading = signal(false);
  readonly totalSummaries = signal(0);
  readonly currentPage = signal(1);
  readonly totalPages = signal(1);

  readonly activeTab = signal<'info' | 'history' | 'content'>('info');

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(page = 1): void {
    this.loading.set(true);
    this.api.getSummariesByPrompt(this.prompt.id, page, 10).subscribe({
      next: (res) => {
        this.summaries.set(res.data);
        this.totalSummaries.set(res.total);
        this.currentPage.set(res.page);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.loadHistory(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.loadHistory(this.currentPage() + 1);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'SUCCESS': return 'text-[var(--bright-green)] bg-[rgba(184,187,38,0.1)]';
      case 'ERROR': return 'text-[var(--bright-red)] bg-[rgba(251,73,52,0.1)]';
      default: return 'text-[var(--bright-yellow)] bg-[rgba(250,189,47,0.1)]';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'SUCCESS': return '✓ Completado';
      case 'ERROR': return '✗ Error';
      default: return '⏳ Pendiente';
    }
  }
}
