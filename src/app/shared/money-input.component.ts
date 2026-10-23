import { Component, computed, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * Campo numérico com máscara pt-BR, equivalente ao DecimalMoedaConverter do WPF.
 *  - mode "money":   os dígitos entram como centavos, da direita para a esquerda (1.234,56)
 *  - mode "integer": apenas inteiros, com separador de milhar (1.234)
 * O valor do formulário é sempre um number; o texto exibido é só apresentação.
 */
@Component({
  selector: 'app-money-input',
  standalone: true,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MoneyInputComponent), multi: true },
  ],
  template: `
    <div class="money" [class.is-disabled]="disabled()">
      @if (mode() === 'money') {
        <span class="affix" aria-hidden="true">R$</span>
      }
      <input
        #campo
        type="text"
        inputmode="numeric"
        autocomplete="off"
        [id]="inputId()"
        [value]="display()"
        [disabled]="disabled()"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        (input)="aoDigitar(campo)"
        (focus)="caretNoFim(campo)"
        (click)="caretNoFim(campo)"
        (keydown)="aoTeclar($event)"
        (blur)="onTouched()"
      />
      @if (mode() === 'integer' && unit()) {
        <span class="affix" aria-hidden="true">{{ unit() }}</span>
      }
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .money {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--surface);
        border: 1px solid var(--line-strong);
        border-radius: 6px;
        padding: 0 0.75rem;
      }
      .money:focus-within { outline: 2px solid var(--ink); outline-offset: 1px; }
      .money.is-invalid, :host(.invalid) .money { border-color: var(--danger); }
      .money.is-disabled { background: var(--paper); }
      .affix { color: var(--muted); font-weight: 600; }
      input {
        flex: 1;
        min-width: 0;
        border: 0;
        outline: 0;
        background: transparent;
        font: inherit;
        font-variant-numeric: tabular-nums;
        text-align: right;
        padding: 0.6rem 0;
        color: var(--ink);
      }
    `,
  ],
})
export class MoneyInputComponent implements ControlValueAccessor {
  readonly mode = input<'money' | 'integer'>('money');
  readonly unit = input<string>('');
  readonly inputId = input<string>('');
  readonly invalid = input<boolean>(false);

  readonly valor = signal(0);
  readonly disabled = signal(false);

  private readonly formatador = computed(() => {
    const casas = this.mode() === 'money' ? 2 : 0;
    return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
  });

  readonly display = computed(() => this.formatador().format(this.valor()));

  private onChange: (v: number) => void = () => undefined;
  onTouched: () => void = () => undefined;

  /** Mantém o cursor no fim: assim cada dígito entra pela direita, como em caixa eletrônico. */
  caretNoFim(el: HTMLInputElement): void {
    setTimeout(() => el.setSelectionRange(el.value.length, el.value.length), 0);
  }

  aoTeclar(event: KeyboardEvent): void {
    // impede mover o cursor para a esquerda (o que bagunçaria a posição dos dígitos)
    if (!event.shiftKey && ['ArrowLeft', 'ArrowUp', 'Home'].includes(event.key)) {
      event.preventDefault();
    }
  }

  aoDigitar(el: HTMLInputElement): void {
    const digitos = el.value.replace(/\D/g, '').slice(0, 13);
    const bruto = Number(digitos || '0');
    const numero = this.mode() === 'money' ? bruto / 100 : bruto;
    this.valor.set(numero);
    // reaplica a máscara no DOM mesmo que o texto calculado não tenha mudado
    el.value = this.display();
    el.setSelectionRange(el.value.length, el.value.length);
    this.onChange(numero);
  }

  writeValue(v: number | null): void {
    this.valor.set(typeof v === 'number' && Number.isFinite(v) ? v : 0);
  }

  registerOnChange(fn: (v: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.disabled.set(desabilitado);
  }
}
