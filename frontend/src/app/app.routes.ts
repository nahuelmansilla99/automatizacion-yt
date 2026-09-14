import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'prompts',
    loadComponent: () =>
      import('./features/prompts/prompts').then((m) => m.PromptsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
