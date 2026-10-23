import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../core/confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  host: { '(document:keydown.escape)': 'aoEsc($event)' },
  template: `
    @if (confirm.state(); as s) {
      <div class="backdrop" (click)="confirm.close(false)">
        <div
          class="dialog"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-titulo"
          aria-describedby="confirm-msg"
          (click)="$event.stopPropagation()"
        >
          <h2 id="confirm-titulo">{{ s.title ?? 'Confirmação' }}</h2>
          <p id="confirm-msg">{{ s.message }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn" (click)="confirm.close(false)">{{ s.cancelLabel ?? 'Cancelar' }}</button>
            <button
              #ok
              type="button"
              class="btn"
              [class.btn-danger]="s.danger"
              [class.btn-primary]="!s.danger"
              (click)="confirm.close(true)"
            >
              {{ s.confirmLabel ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .backdrop {
        position: fixed;
        inset: 0;
        background: rgb(27 36 48 / 0.55);
        display: grid;
        place-items: center;
        padding: 1rem;
        z-index: 50;
      }
      .dialog {
        background: var(--surface);
        border-radius: 8px;
        padding: 1.5rem;
        width: min(26rem, 100%);
        box-shadow: 0 16px 48px rgb(0 0 0 / 0.3);
      }
      h2 { margin: 0 0 0.5rem; font-size: 1.15rem; }
      p { margin: 0 0 1.5rem; color: var(--muted); line-height: 1.5; }
      .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
    `,
  ],
})
export class ConfirmDialogComponent {
  readonly confirm = inject(ConfirmService);
  private readonly ok = viewChild<ElementRef<HTMLButtonElement>>('ok');

  constructor() {
    effect(() => {
      if (this.confirm.state()) {
        setTimeout(() => this.ok()?.nativeElement.focus(), 0);
      }
    });
  }

  aoEsc(event: Event): void {
    if (this.confirm.isOpen()) {
      // impede que o Esc chegue à tela por trás (ex.: atalho "Voltar")
      event.stopPropagation();
      this.confirm.close(false);
    }
  }
}
