import { Component, inject, computed } from '@angular/core';
import { SummariesStore } from '../../store/summaries.store';

@Component({
  selector: 'app-supadata-metrics-card',
  standalone: true,
  templateUrl: './supadata-metrics-card.html',
  styleUrl: './supadata-metrics-card.css',
})
export class SupadataMetricsCardComponent {
  readonly store = inject(SummariesStore);

  readonly usagePercent = computed(() => {
    const s = this.store.metrics()?.supadata;
    if (!s || s.maxCredits === 0) return 0;
    return Math.min(100, Math.round((s.usedCredits / s.maxCredits) * 100));
  });
}
