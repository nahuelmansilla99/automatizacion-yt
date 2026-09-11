import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { marked } from 'marked';
import { SummariesStore } from '../../store/summaries.store';
import { ToastService } from '../../../../core/services/toast.service';

@Component({
  selector: 'app-summary-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './summary-modal.html',
  styleUrl: './summary-modal.css',
})
export class SummaryModalComponent {
  readonly store = inject(SummariesStore);
  readonly toast = inject(ToastService);

  readonly copied = signal(false);

  readonly renderedMarkdown = computed(() => {
    const raw = this.store.selectedSummary()?.markdownContent;
    if (!raw) return '';
    return marked.parse(raw);
  });

  onBackdropClick(event: MouseEvent) {
    this.store.closeModal();
  }

  copyMarkdown() {
    const content = this.store.selectedSummary()?.markdownContent;
    if (!content) return;

    navigator.clipboard.writeText(content).then(() => {
      this.copied.set(true);
      this.toast.success('Markdown copiado al portapapeles');
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  downloadMarkdown() {
    const summary = this.store.selectedSummary();
    if (!summary?.markdownContent) return;

    const safeTitle = (summary.videoTitle || 'Resumen')
      .replace(/[\\/:*?"<>|]/g, '')
      .substring(0, 50);
    const fileName = `${safeTitle} - Resumen.md`;

    const blob = new Blob([summary.markdownContent], {
      type: 'text/markdown;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    this.toast.success(`Archivo "${fileName}" descargado`);
  }
}
