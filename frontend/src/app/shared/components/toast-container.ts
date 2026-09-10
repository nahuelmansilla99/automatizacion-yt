import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../core/services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none px-4 sm:px-0">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start justify-between rounded-lg p-3.5 shadow-xl border transition-all duration-300 transform translate-y-0"
          [class.bg-[var(--dark1)]]="true"
          [class.border-[var(--bright-green)]]="toast.type === 'success'"
          [class.border-[var(--bright-red)]]="toast.type === 'error'"
          [class.border-[var(--bright-aqua)]]="toast.type === 'info'"
        >
          <div class="flex items-start gap-3">
            @if (toast.type === 'success') {
              <span class="text-[var(--bright-green)] text-lg">✓</span>
            } @else if (toast.type === 'error') {
              <span class="text-[var(--bright-red)] text-lg">⚠</span>
            } @else {
              <span class="text-[var(--bright-aqua)] text-lg">ℹ</span>
            }
            <div>
              @if (toast.title) {
                <h4 class="text-sm font-semibold text-[var(--light0)]">
                  {{ toast.title }}
                </h4>
              }
              <p class="text-xs text-[var(--light2)] mt-0.5 leading-relaxed">
                {{ toast.message }}
              </p>
            </div>
          </div>
          <button
            (click)="toastService.remove(toast.id)"
            class="text-[var(--light3)] hover:text-[var(--light0)] text-sm ml-2 cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
