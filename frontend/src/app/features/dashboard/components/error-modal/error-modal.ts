import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SummariesStore } from '../../store/summaries.store';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './error-modal.html',
  styleUrl: './error-modal.css',
})
export class ErrorModalComponent {
  readonly store = inject(SummariesStore);

  onRetry(id: string) {
    this.store.closeErrorModal();
    this.store.retry(id);
  }
}
