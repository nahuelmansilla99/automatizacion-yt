import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SummariesStore } from '../store/summaries.store';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (store.errorModalSummary(); as summary) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
        (click)="store.closeErrorModal()"
      >
        <div
          class="relative flex flex-col w-full max-w-xl rounded-2xl bg-[var(--dark0)] border border-[var(--bright-red)] shadow-2xl overflow-hidden"
          (click)="$event.stopPropagation()"
        >
          <!-- Cabecera -->
          <div class="flex items-center justify-between border-b border-[var(--dark2)] bg-[var(--dark0-hard)] p-4 sm:p-5">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgba(251,73,52,0.2)] text-[var(--bright-red)] text-lg">
                ⚠
              </span>
              <div>
                <h3 class="text-base font-bold text-[var(--light0)]">
                  Detalle del Error de n8n
                </h3>
                <p class="text-xs text-[var(--light3)] truncate">
                  {{ summary.videoTitle || summary.youtubeUrl }}
                </p>
              </div>
            </div>

            <button
              (click)="store.closeErrorModal()"
              class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--dark1)] text-[var(--light2)] hover:text-[var(--light0)] cursor-pointer"
            >
              ✕
            </button>
          </div>

          <!-- Cuerpo -->
          <div class="p-5 space-y-4">
            <div>
              <span class="text-xs font-semibold uppercase tracking-wider text-[var(--light3)]">
                Mensaje de error capturado:
              </span>
              <div class="mt-1 rounded-lg bg-[var(--dark0-hard)] border border-[var(--dark2)] p-4 font-mono text-xs text-[var(--bright-red)] leading-relaxed whitespace-pre-wrap">
                {{ summary.errorMessage || 'No se recibió detalle del error' }}
              </div>
            </div>

            <div class="text-xs text-[var(--light2)] space-y-1 bg-[var(--dark1)] p-3 rounded-lg border border-[var(--dark2)]">
              <p><strong>Enlace del video:</strong> <a [href]="summary.youtubeUrl" target="_blank" class="text-[var(--bright-aqua)] hover:underline">{{ summary.youtubeUrl }}</a></p>
              <p><strong>Fecha del intento:</strong> {{ summary.updatedAt | date: 'medium' }}</p>
              <p><strong>ID de registro:</strong> <code class="text-[var(--bright-blue)]">{{ summary.id }}</code></p>
            </div>
          </div>

          <!-- Pie -->
          <div class="flex items-center justify-end gap-3 border-t border-[var(--dark2)] bg-[var(--dark0-hard)] px-5 py-3">
            <button
              (click)="store.closeErrorModal()"
              class="rounded-lg bg-[var(--dark1)] hover:bg-[var(--dark2)] text-[var(--light1)] px-4 py-2 text-xs font-semibold cursor-pointer border border-[var(--dark2)] transition-colors"
            >
              Cerrar
            </button>

            <button
              (click)="onRetry(summary.id)"
              class="rounded-lg bg-[var(--bright-orange)] hover:brightness-110 text-[var(--dark0-hard)] px-4 py-2 text-xs font-bold cursor-pointer transition-all shadow-md"
            >
              Reintentar en n8n
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ErrorModalComponent {
  readonly store = inject(SummariesStore);

  onRetry(id: string) {
    this.store.closeErrorModal();
    this.store.retry(id);
  }
}
