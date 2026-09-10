import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  show(message: string, type: 'success' | 'error' | 'info' = 'info', title?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, message, type, title };

    this._toasts.update((current) => [...current, newToast]);

    // Auto eliminar a los 5 segundos
    setTimeout(() => {
      this.remove(id);
    }, 5000);
  }

  success(message: string, title = 'Operación Exitosa') {
    this.show(message, 'success', title);
  }

  error(message: string, title = 'Error Detectado') {
    this.show(message, 'error', title);
  }

  info(message: string, title = 'Información') {
    this.show(message, 'info', title);
  }

  remove(id: string) {
    this._toasts.update((current) => current.filter((t) => t.id !== id));
  }
}
