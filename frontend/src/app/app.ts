import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar';
import { ToastContainerComponent } from './shared/components/toast-container/toast-container';
import { CrtOverlayComponent } from './shared/components/crt-overlay/crt-overlay';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, ToastContainerComponent, CrtOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
