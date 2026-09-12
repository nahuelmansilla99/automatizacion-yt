import { Component, inject, computed, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { marked } from 'marked';
import { SummariesStore } from '../store/summaries.store';
import { ToastService } from '../../../core/services/toast.service';
import { SummaryApiService } from '../../../core/services/summary-api.service';

@Component({
  selector: 'app-summary-modal',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (store.isModalOpen() && store.selectedSummary(); as summary) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        (click)="onBackdropClick($event)"
      >
        <div
          class="relative flex flex-col w-full max-w-4xl max-h-[90vh] rounded-2xl bg-[var(--dark0)] border border-[var(--dark2)] shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Cabecera del Modal -->
          <div class="flex items-start justify-between border-b border-[var(--dark2)] bg-[var(--dark0-hard)] p-4 sm:p-5">
            <div class="pr-4 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="rounded bg-[var(--dark2)] px-2 py-0.5 text-xs font-semibold text-[var(--bright-yellow)]">
                  Obsidian Note
                </span>
                <span class="text-xs text-[var(--light3)] truncate">
                  {{ summary.channelName || 'Canal de YouTube' }}
                </span>
              </div>
              <h2 class="text-base sm:text-lg font-bold text-[var(--light0)] truncate">
                {{ summary.videoTitle || 'Resumen de Video' }}
              </h2>
            </div>

            <!-- Botones de Acción Superiores -->
            <div class="flex items-center gap-2 shrink-0">
              <button
                (click)="copyMarkdown()"
                class="flex items-center gap-1.5 rounded-lg bg-[var(--dark1)] hover:bg-[var(--dark2)] text-[var(--light1)] px-3 py-1.5 text-xs font-semibold border border-[var(--dark2)] cursor-pointer transition-colors"
                title="Copiar contenido Markdown para pegar en Obsidian"
              >
                @if (copied()) {
                  <span class="text-[var(--bright-green)]">✓ Copiado</span>
                } @else {
                  <span>📋 Copiar Markdown</span>
                }
              </button>

              <button
                (click)="downloadMarkdown()"
                class="hidden sm:flex items-center gap-1.5 rounded-lg bg-[var(--dark1)] hover:bg-[var(--dark2)] text-[var(--light1)] px-3 py-1.5 text-xs font-semibold border border-[var(--dark2)] cursor-pointer transition-colors"
                title="Descargar archivo .md"
              >
                <span>💾 Descargar .md</span>
              </button>

              <button
                (click)="syncToDrive()"
                [disabled]="syncingDrive()"
                class="flex items-center gap-1.5 rounded-lg bg-[rgba(131,165,152,0.15)] hover:bg-[rgba(131,165,152,0.25)] text-[var(--bright-blue)] px-3 py-1.5 text-xs font-semibold border border-[rgba(131,165,152,0.3)] cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Sincronizar archivo .md con Google Drive vía n8n"
              >
                @if (syncingDrive()) {
                  <span class="animate-spin">⏳</span>
                  <span>Subiendo...</span>
                } @else {
                  <span>☁ Subir a Drive</span>
                }
              </button>

              <a
                [href]="summary.youtubeUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center gap-1.5 rounded-lg bg-[rgba(251,73,52,0.15)] hover:bg-[rgba(251,73,52,0.25)] text-[var(--bright-red)] px-3 py-1.5 text-xs font-semibold border border-[rgba(251,73,52,0.3)] transition-colors"
                title="Abrir video en YouTube"
              >
                <span>▶ Video</span>
              </a>

              <button
                (click)="store.closeModal()"
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dark1)] text-[var(--light2)] hover:text-[var(--light0)] hover:bg-[var(--dark2)] border border-[var(--dark2)] cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>
          </div>

          <!-- Contenido Markdown Renderizado -->
          <div class="flex-1 overflow-y-auto p-5 sm:p-8">
            @if (summary.markdownContent) {
              <div
                class="markdown-body text-sm leading-relaxed"
                [innerHTML]="renderedMarkdown()"
              ></div>
            } @else {
              <div class="text-center py-12 text-[var(--light3)] text-sm">
                <p class="text-lg mb-2">⏳</p>
                <p>El resumen aún no se ha generado o está en proceso.</p>
              </div>
            }
          </div>

          <!-- Pie del Modal -->
          <div class="flex items-center justify-between border-t border-[var(--dark2)] bg-[var(--dark0-hard)] px-5 py-3 text-xs text-[var(--light3)]">
            <span>
              Generado: {{ summary.updatedAt | date: 'medium' }}
            </span>
            <span>
              Guardado automáticamente en Google Drive
            </span>
          </div>
        </div>
      </div>
    }
  `,
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
