import { Component, input } from '@angular/core';
import { SummaryStatus } from '../../core/models/summary.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  template: `
    @switch (status()) {
      @case ('SUCCESS') {
        <span class="inline-flex items-center gap-1.5 rounded-md bg-[rgba(184,187,38,0.15)] px-2.5 py-1 text-xs font-semibold text-[var(--bright-green)] border border-[rgba(184,187,38,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          COMPLETADO
        </span>
      }
      @case ('PENDING') {
        <span class="inline-flex items-center gap-1.5 rounded-md bg-[rgba(250,189,47,0.15)] px-2.5 py-1 text-xs font-semibold text-[var(--bright-yellow)] border border-[rgba(250,189,47,0.3)]">
          <svg class="animate-spin h-3 w-3 text-[var(--bright-yellow)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          PROCESANDO
        </span>
      }
      @case ('ERROR') {
        <span class="inline-flex items-center gap-1.5 rounded-md bg-[rgba(251,73,52,0.15)] px-2.5 py-1 text-xs font-semibold text-[var(--bright-red)] border border-[rgba(251,73,52,0.3)]">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
          </svg>
          ERROR
        </span>
      }
    }
  `,
})
export class StatusBadgeComponent {
  readonly status = input.required<SummaryStatus>();
}
