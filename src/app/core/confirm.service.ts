import { Injectable, computed, signal } from '@angular/core';

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export interface ConfirmState extends ConfirmOptions {
  message: string;
  resolve: (resultado: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);
  readonly isOpen = computed(() => this.state() !== null);

  ask(message: string, options: ConfirmOptions = {}): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this.state.set({ message, ...options, resolve });
    });
  }

  close(resultado: boolean): void {
    const atual = this.state();
    if (!atual) return;
    this.state.set(null);
    atual.resolve(resultado);
  }
}
