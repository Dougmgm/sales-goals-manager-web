import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly items = signal<Toast[]>([]);
  private seq = 0;

  success(text: string): void {
    this.push('success', text, 4000);
  }

  error(text: string): void {
    this.push('error', text, 8000);
  }

  dismiss(id: number): void {
    this.items.update((lista) => lista.filter((t) => t.id !== id));
  }

  private push(kind: Toast['kind'], text: string, ms: number): void {
    const id = ++this.seq;
    this.items.update((lista) => [...lista, { id, kind, text }]);
    setTimeout(() => this.dismiss(id), ms);
  }
}
