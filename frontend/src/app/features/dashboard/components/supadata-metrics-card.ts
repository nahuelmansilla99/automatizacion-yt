import { Component, inject, computed } from '@angular/core';
import { SummariesStore } from '../store/summaries.store';

@Component({
  selector: 'app-supadata-metrics-card',
  standalone: true,
  template: `
    <div class="rounded-xl bg-[var(--dark1)] border border-[var(--dark2)] p-5 sm:p-6 shadow-lg flex flex-col justify-between">
      <!-- Cabecera de la tarjeta -->
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="text-xl">📊</span>
          <div>
            <h3 class="text-sm sm:text-base font-bold text-[var(--light0)]">
              Cuota de Supadata (Transcripciones)
            </h3>
            <span class="text-xs text-[var(--light3)]">
              Plan: {{ store.metrics()?.supadata?.plan || 'Estándar' }}
            </span>
          </div>
        </div>

        <button
          (click)="store.loadMetrics(true)"
          [disabled]="store.metricsLoading()"
          title="Actualizar cuota (0 créditos consumidos)"
          class="flex items-center gap-1.5 rounded-lg bg-[var(--dark0-hard)] px-2.5 py-1.5 text-xs text-[var(--light2)] hover:text-[var(--light0)] border border-[var(--dark2)] hover:border-[var(--light3)] disabled:opacity-50 cursor-pointer transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-3.5 w-3.5"
            [class.animate-spin]="store.metricsLoading()"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span class="hidden sm:inline">Refrescar</span>
        </button>
      </div>

      <!-- Barra de Progreso y Datos -->
      @if (store.metrics()?.supadata; as supadata) {
        <div class="space-y-2 mt-1">
          <div class="flex items-baseline justify-between text-xs">
            <span class="text-[var(--light2)]">
              Consumido este periodo:
              <strong class="text-[var(--light0)] font-semibold">{{ supadata.usedCredits }}</strong>
              / {{ supadata.maxCredits }} créditos
            </span>
            <span class="font-bold text-[var(--bright-yellow)]">
              {{ usagePercent() }}%
            </span>
          </div>

          <!-- Barra -->
          <div class="h-2.5 w-full overflow-hidden rounded-full bg-[var(--dark0-hard)] border border-[var(--dark2)]">
            <div
              class="h-full rounded-full transition-all duration-500"
              [style.width.%]="usagePercent()"
              [class.bg-[var(--bright-green)]]="usagePercent() < 70"
              [class.bg-[var(--bright-yellow)]]="usagePercent() >= 70 && usagePercent() < 90"
              [class.bg-[var(--bright-red)]]="usagePercent() >= 90"
            ></div>
          </div>

          <div class="flex items-center justify-between text-xs text-[var(--light3)] pt-1">
            <span>
              Disponibles: <strong class="text-[var(--bright-green)]">{{ supadata.remainingCredits }}</strong> créditos
            </span>
            <span class="text-[0.7rem]">0 créditos por consultar</span>
          </div>
        </div>
      } @else {
        <div class="rounded-lg bg-[var(--dark0-hard)] p-3 text-center border border-[var(--dark2)] text-xs text-[var(--light3)]">
          @if (store.metricsLoading()) {
            <span class="animate-pulse">Cargando datos de cuota...</span>
          } @else {
            <span>Configura 'SUPADATA_API_KEY' en el backend para ver tu cuota en tiempo real.</span>
          }
        </div>
      }
    </div>
  `,
})
export class SupadataMetricsCardComponent {
  readonly store = inject(SummariesStore);

  readonly usagePercent = computed(() => {
    const s = this.store.metrics()?.supadata;
    if (!s || s.maxCredits === 0) return 0;
    return Math.min(100, Math.round((s.usedCredits / s.maxCredits) * 100));
  });
}
