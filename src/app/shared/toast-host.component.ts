import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'app-toast-host',
  standalone: true,
  template: `
    <div class="toasts" aria-live="polite" role="status">
      @for (t of toasts.items(); track t.id) {
        <div class="toast" [class.toast-error]="t.kind === 'error'">
          <span>{{ t.text }}</span>
          <button type="button" class="toast-close" (click)="toasts.dismiss(t.id)" aria-label="Fechar aviso">×</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toasts {
        position: fixed;
        right: 1rem;
        bottom: 1rem;
        display: grid;
        gap: 0.5rem;
        z-index: 60;
        max-width: min(26rem, calc(100vw - 2rem));
      }
      .toast {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        background: var(--ink);
        color: #fff;
        border-left: 4px solid var(--gold);
        padding: 0.75rem 0.5rem 0.75rem 1rem;
        border-radius: 6px;
        box-shadow: 0 6px 20px rgb(0 0 0 / 0.25);
      }
      .toast-error { border-left-color: #ff7b6b; }
      .toast span { flex: 1; }
      .toast-close {
        background: none;
        border: 0;
        color: inherit;
        font-size: 1.25rem;
        line-height: 1;
        cursor: pointer;
        padding: 0 0.5rem;
      }
    `,
  ],
})
export class ToastHostComponent {
  readonly toasts = inject(ToastService);
}
