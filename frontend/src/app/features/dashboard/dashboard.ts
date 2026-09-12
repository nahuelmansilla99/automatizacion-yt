import { Component, OnInit, inject } from '@angular/core';
import { SummariesStore } from './store/summaries.store';
import { UrlInputCardComponent } from './components/url-input-card/url-input-card';
import { SupadataMetricsCardComponent } from './components/supadata-metrics-card/supadata-metrics-card';
import { SummaryTableComponent } from './components/summary-table/summary-table';
import { SummaryModalComponent } from './components/summary-modal/summary-modal';
import { ErrorModalComponent } from './components/error-modal/error-modal';

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
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly store = inject(SummariesStore);

  ngOnInit() {
    this.store.init();
  }
}
