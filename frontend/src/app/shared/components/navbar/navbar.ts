import { Component, inject } from '@angular/core';
import { SummariesStore } from '../../../features/dashboard/store/summaries.store';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class NavbarComponent {
  readonly store = inject(SummariesStore);
}
