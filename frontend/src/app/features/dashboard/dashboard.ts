import { Component, OnInit, inject } from '@angular/core';
import { SummariesStore } from './store/summaries.store';
import { UrlInputCardComponent } from './components/url-input-card';
import { SupadataMetricsCardComponent } from './components/supadata-metrics-card';
import { SummaryTableComponent } from './components/summary-table';
import { SummaryModalComponent } from './components/summary-modal';
import { ErrorModalComponent } from './components/error-modal';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    UrlInputCardComponent,
    SupadataMetricsCardComponent,
    SummaryTableComponent,
    SummaryModalComponent,
    ErrorModalComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Fila Superior: Input de URL y Métricas de Supadata -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <app-url-input-card />
        </div>
        <div class="lg:col-span-1">
          <app-supadata-metrics-card />
        </div>
      </div>

      <!-- Fila Inferior: Tabla de Historial -->
      <app-summary-table />

      <!-- Modales -->
      <app-summary-modal />
      <app-error-modal />
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(SummariesStore);

  ngOnInit() {
    this.store.init();
  }
}
