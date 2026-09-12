import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SummariesStore } from '../../store/summaries.store';

@Component({
  selector: 'app-url-input-card',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './url-input-card.html',
  styleUrl: './url-input-card.css',
})
export class UrlInputCardComponent {
  readonly store = inject(SummariesStore);

  readonly url = signal('');
  readonly hasError = signal(false);

  private readonly youtubeRegex =
    /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|shorts\/)|youtu\.be\/)[a-zA-Z0-9_-]+/;

  onUrlChange(val: string) {
    if (val && !this.youtubeRegex.test(val.trim())) {
      this.hasError.set(true);
    } else {
      this.hasError.set(false);
    }
  }

  isValidUrl(): boolean {
    const val = this.url().trim();
    return val.length > 0 && this.youtubeRegex.test(val);
  }

  clearUrl() {
    this.url.set('');
    this.hasError.set(false);
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (!this.isValidUrl()) {
      this.hasError.set(true);
      return;
    }

    this.store.requestSummary(this.url().trim(), () => {
      this.clearUrl();
    });
  }
}
