import { Component, input } from '@angular/core';
import { SummaryStatus } from '../../../core/models/summary.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.css',
})
export class StatusBadgeComponent {
  readonly status = input.required<SummaryStatus>();
}
