import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-crt-overlay',
  standalone: true,
  templateUrl: './crt-overlay.html',
  styleUrl: './crt-overlay.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CrtOverlayComponent {}
