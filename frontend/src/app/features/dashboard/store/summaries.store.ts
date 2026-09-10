import { Injectable, signal, computed, inject } from '@angular/core';
import { SummaryApiService } from '../../../core/services/summary-api.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  VideoSummary,
  AppMetricsResponse,
  SummaryStatus,
} from '../../../core/models/summary.model';

@Injectable({
  providedIn: 'root',
})
export class SummariesStore {
  private readonly api = inject(SummaryApiService);
  private readonly ws = inject(WebSocketService);
  private readonly toast = inject(ToastService);

  // Estado reactivo privado
  private readonly _videos = signal<VideoSummary[]>([]);
  private readonly _loading = signal<boolean>(false);
  private readonly _submitting = signal<boolean>(false);
  private readonly _metrics = signal<AppMetricsResponse | null>(null);
  private readonly _metricsLoading = signal<boolean>(false);

  private readonly _selectedSummary = signal<VideoSummary | null>(null);
  private readonly _isModalOpen = signal<boolean>(false);

  private readonly _errorModalSummary = signal<VideoSummary | null>(null);

  private readonly _filterStatus = signal<string>('ALL');
  private readonly _searchQuery = signal<string>('');

  // Estado público expuesto como readonly
  readonly videos = this._videos.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly submitting = this._submitting.asReadonly();
  readonly metrics = this._metrics.asReadonly();
  readonly metricsLoading = this._metricsLoading.asReadonly();
  readonly selectedSummary = this._selectedSummary.asReadonly();
  readonly isModalOpen = this._isModalOpen.asReadonly();
  readonly errorModalSummary = this._errorModalSummary.asReadonly();
  readonly filterStatus = this._filterStatus.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly isWsConnected = this.ws.isConnected;

  // Derivados computados memoizados
  readonly pendientes = computed(
    () => this._videos().filter((v) => v.status === 'PENDING').length,
  );
  readonly completados = computed(
    () => this._videos().filter((v) => v.status === 'SUCCESS').length,
  );
  readonly conError = computed(
    () => this._videos().filter((v) => v.status === 'ERROR').length,
  );
  readonly totalVideos = computed(() => this._videos().length);

  readonly filteredVideos = computed(() => {
    const list = this._videos();
    const filter = this._filterStatus();
    const search = this._searchQuery().toLowerCase().trim();

    return list.filter((item) => {
      const matchStatus = filter === 'ALL' || item.status === filter;
      const matchSearch =
        !search ||
        (item.videoTitle?.toLowerCase().includes(search) ?? false) ||
        (item.channelName?.toLowerCase().includes(search) ?? false) ||
        item.youtubeUrl.toLowerCase().includes(search);

      return matchStatus && matchSearch;
    });
  });

  init() {
    this.ws.connect();
    this.ws.registerCallbacks(
      (created) => this.onSummaryCreated(created),
      (updated) => this.onSummaryUpdated(updated),
      (id) => this.onSummaryDeleted(id),
    );

    this.loadSummaries();
    this.loadMetrics();
  }

  loadSummaries() {
    this._loading.set(true);
    this.api.getSummaries(1, 100).subscribe({
      next: (res) => {
        this._videos.set(res.data);
        this._loading.set(false);
      },
      error: (err) => {
        this._loading.set(false);
        this.toast.error('Error al cargar la lista de resúmenes');
        console.error(err);
      },
    });
  }

  loadMetrics(forceRefresh = false) {
    this._metricsLoading.set(true);
    const request = forceRefresh
      ? this.api.refreshMetrics()
      : this.api.getMetrics();

    request.subscribe({
      next: (res) => {
        this._metrics.set(res);
        this._metricsLoading.set(false);
        if (forceRefresh) {
          this.toast.success('Métricas de Supadata actualizadas');
        }
      },
      error: (err) => {
        this._metricsLoading.set(false);
        console.error('Error al obtener métricas:', err);
      },
    });
  }

  requestSummary(youtubeUrl: string, onSuccess?: () => void) {
    this._submitting.set(true);
    this.api.createSummary(youtubeUrl).subscribe({
      next: (res) => {
        this._submitting.set(false);
        this.toast.info(
          'Solicitud aceptada. n8n está procesando el video...',
          'Proceso Iniciado',
        );
        this.onSummaryCreated(res.data);
        onSuccess?.();
      },
      error: (err) => {
        this._submitting.set(false);
        const msg = err.error?.message || 'Error al enviar la URL a procesar';
        this.toast.error(msg);
      },
    });
  }

  retry(id: string) {
    this.api.retrySummary(id).subscribe({
      next: (res) => {
        this.toast.info('Reintento enviado a n8n');
        this.onSummaryUpdated(res.data);
      },
      error: (err) => {
        this.toast.error('Error al reintentar el resumen');
        console.error(err);
      },
    });
  }

  delete(id: string) {
    if (!confirm('¿Seguro que deseas eliminar este resumen?')) {
      return;
    }

    this.api.deleteSummary(id).subscribe({
      next: () => {
        this.toast.success('Resumen eliminado correctamente');
        this.onSummaryDeleted(id);
      },
      error: (err) => {
        this.toast.error('Error al eliminar el resumen');
        console.error(err);
      },
    });
  }

  setFilterStatus(status: string) {
    this._filterStatus.set(status);
  }

  setSearchQuery(query: string) {
    this._searchQuery.set(query);
  }

  openModal(summary: VideoSummary) {
    this._selectedSummary.set(summary);
    this._isModalOpen.set(true);
  }

  closeModal() {
    this._isModalOpen.set(false);
    this._selectedSummary.set(null);
  }

  openErrorModal(summary: VideoSummary) {
    this._errorModalSummary.set(summary);
  }

  closeErrorModal() {
    this._errorModalSummary.set(null);
  }

  private onSummaryCreated(summary: VideoSummary) {
    this._videos.update((current) => {
      const exists = current.some((v) => v.id === summary.id);
      if (exists) return current;
      return [summary, ...current];
    });
  }

  private onSummaryUpdated(summary: VideoSummary) {
    this._videos.update((current) =>
      current.map((v) => (v.id === summary.id ? summary : v)),
    );

    // Si el modal actual está viendo este resumen, actualizarlo
    if (this._selectedSummary()?.id === summary.id) {
      this._selectedSummary.set(summary);
    }
  }

  private onSummaryDeleted(id: string) {
    this._videos.update((current) => current.filter((v) => v.id !== id));
    if (this._selectedSummary()?.id === id) {
      this.closeModal();
    }
  }
}
