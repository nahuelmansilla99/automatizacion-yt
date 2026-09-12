import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { marked } from 'marked';
import { SummariesStore } from '../../store/summaries.store';
import { ToastService } from '../../../../core/services/toast.service';
import { SummaryApiService } from '../../../core/services/summary-api.service';


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
  readonly api = inject(SummaryApiService);

  readonly copied = signal(false);
  readonly syncingDrive = signal(false);

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

  syncToDrive() {
    const summary = this.store.selectedSummary();
    if (!summary?.id) return;

    this.syncingDrive.set(true);
    this.api.syncToDrive(summary.id).subscribe({
      next: (res) => {
        this.syncingDrive.set(false);
        if (res.data?.success) {
          this.toast.success('¡Enviado a Google Drive vía n8n con éxito!');
        } else {
          this.toast.error(
            res.data?.message ||
              res.message ||
              'Error al sincronizar con Google Drive',
          );
        }
      },
      error: (err) => {
        this.syncingDrive.set(false);
        const msg =
          err.error?.message ||
          'Error al conectar con el servidor para sincronizar con Drive';
        this.toast.error(msg);
      },
    });
  }
}
