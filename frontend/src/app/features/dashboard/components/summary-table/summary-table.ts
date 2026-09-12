import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SummariesStore } from '../../store/summaries.store';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge';
import { ToastService } from '../../../../core/services/toast.service';
import { VideoSummary } from '../../../../core/models/summary.model';

@Component({
  selector: 'app-summary-table',
  standalone: true,
  imports: [DatePipe, FormsModule, StatusBadgeComponent],
  templateUrl: './summary-table.html',
  styleUrl: './summary-table.css',
})
export class SummaryTableComponent {
  readonly store = inject(SummariesStore);
  readonly toast = inject(ToastService);

  copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(() => {
      this.toast.info('Enlace de YouTube copiado');
    });
  }
}
