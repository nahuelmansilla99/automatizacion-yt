import { Injectable, signal, inject } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { VideoSummary } from '../models/summary.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private socket: Socket | null = null;
  private readonly toast = inject(ToastService);

  readonly isConnected = signal(false);

  // Callbacks para el store
  private onSummaryUpdatedCallback?: (summary: VideoSummary) => void;
  private onSummaryCreatedCallback?: (summary: VideoSummary) => void;
  private onSummaryDeletedCallback?: (id: string) => void;

  connect() {
    if (this.socket) {
      return;
    }

    const wsUrl = environment.wsUrl || window.location.origin;
    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
      console.log('🟢 WebSocket conectado al backend');
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
      console.log('🔴 WebSocket desconectado');
    });

    this.socket.on('summary:created', (summary: VideoSummary) => {
      this.onSummaryCreatedCallback?.(summary);
    });

    this.socket.on('summary:updated', (summary: VideoSummary) => {
      this.onSummaryUpdatedCallback?.(summary);
      if (summary.status === 'SUCCESS') {
        this.toast.success(
          `Resumen listo para: ${summary.videoTitle || 'Video de YouTube'}`,
          'Resumen Completado',
        );
      }
    });

    this.socket.on('summary:error', (summary: VideoSummary) => {
      this.onSummaryUpdatedCallback?.(summary);
      this.toast.error(
        summary.errorMessage || 'Ocurrió un error en el flujo de n8n',
        'Fallo en Resumen',
      );
    });

    this.socket.on('summary:deleted', (data: { id: string }) => {
      this.onSummaryDeletedCallback?.(data.id);
    });

    this.socket.on(
      'summary:driveSynced',
      (data: { id: string; driveFileName?: string; driveUrl?: string }) => {
        const title = data.driveFileName
          ? `Nota "${data.driveFileName}" guardada en Google Drive`
          : 'Resumen sincronizado exitosamente con Google Drive';
        this.toast.success(title, '☁ Google Drive');
      },
    );
  }

  registerCallbacks(
    onCreated: (summary: VideoSummary) => void,
    onUpdated: (summary: VideoSummary) => void,
    onDeleted: (id: string) => void,
  ) {
    this.onSummaryCreatedCallback = onCreated;
    this.onSummaryUpdatedCallback = onUpdated;
    this.onSummaryDeletedCallback = onDeleted;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected.set(false);
    }
  }
}
