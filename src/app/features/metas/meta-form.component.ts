import { Component, HostListener, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/api-error';
import { ConfirmService } from '../../core/confirm.service';
import { MetaService } from '../../core/meta.service';
import {
  CategoriaProduto,
  MetaVendedorPayload,
  PERIODICIDADES,
  Periodicidade,
  Produto,
  TIPOS_META,
  TipoMeta,
  Vendedor,
} from '../../core/models';
import { ProdutoService } from '../../core/produto.service';
import { ToastService } from '../../core/toast.service';
import { VendedorService } from '../../core/vendedor.service';
import { MoneyInputComponent } from '../../shared/money-input.component';

@Component({
  selector: 'app-meta-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoneyInputComponent],
  template: `
    <header class="page-head">
      <div>
        <h1>{{ editando() ? 'Editar meta' : 'Nova meta' }}</h1>
        <p class="sub">Atalhos: F2 salva, Esc volta.</p>
      </div>
      <div class="head-actions">
        <button type="button" class="btn" (click)="voltar()">Voltar</button>
        <button type="button" class="btn" (click)="limpar()" [disabled]="loading()">Limpar</button>
        <button type="button" class="btn btn-warn" (click)="dobrarValor()" [disabled]="loading() || !(valorAtual() > 0)">
          Dobrar valor
        </button>
        <button type="submit" form="meta-form" class="btn btn-primary" [disabled]="loading() || saving()">
          {{ saving() ? 'Salvando…' : 'Salvar' }}
        </button>
      </div>
    </header>

    @if (erros().length) {
      <div class="banner banner-error" role="alert">
        <strong>Não foi possível salvar a meta</strong>
        <ul>
          @for (e of erros(); track $index) {
            <li>{{ e }}</li>
          }
        </ul>
      </div>
    }

    @if (loading()) {
      <p class="state">Carregando…</p>
    } @else if (erroCarga()) {
      <div class="state state-error" role="alert">
        <p>{{ erroCarga() }}</p>
        <a class="btn" routerLink="/metas">Voltar para as metas</a>
      </div>
    } @else {
      <form id="meta-form" class="form-card" [formGroup]="form" (ngSubmit)="salvar()" novalidate>
        <div class="form-grid">
          <div class="field" [class.invalid]="invalido('vendedor')">
            <label for="vendedor">Vendedor</label>
            <select id="vendedor" class="select" formControlName="vendedor">
              <option [ngValue]="''" disabled>Selecione um vendedor</option>
              @for (v of vendedores(); track v.id) {
                <option [ngValue]="v.id">{{ v.nomeVendedor }}</option>
              }
            </select>
            @if (vendedores().length === 0) {
              <p class="hint">Nenhum vendedor cadastrado. <a routerLink="/vendedores">Cadastre um vendedor</a> primeiro.</p>
            }
          </div>

          <div class="field" [class.invalid]="invalido('produto') || litrosInvalido()">
            <label for="produto">Produto</label>
            <select id="produto" class="select" formControlName="produto">
              <option [ngValue]="''" disabled>Selecione um produto</option>
              @for (p of produtos(); track p.id) {
                <option [ngValue]="p.id">{{ p.nomeProduto }}</option>
              }
            </select>
            @if (litrosInvalido()) {
              <p class="field-error">Metas em litros só podem ser atribuídas a produtos líquidos, como Barris ou Garrafas/Latas.</p>
            }
            @if (produtos().length === 0) {
              <p class="hint">Nenhum produto cadastrado. <a routerLink="/produtos">Cadastre um produto</a> primeiro.</p>
            }
          </div>

          <fieldset class="field">
            <legend>Tipo de meta</legend>
            <div class="radios">
              @for (t of tiposMeta; track t.value) {
                <label class="radio">
                  <input type="radio" name="tipoMeta" formControlName="tipoMeta" [value]="t.value" />
                  {{ t.label }}
                </label>
              }
            </div>
          </fieldset>

          <div class="field" [class.invalid]="invalido('valorMeta')">
            <label for="valor">Valor da meta</label>
            <app-money-input
              inputId="valor"
              formControlName="valorMeta"
              [mode]="modoValor()"
              [unit]="unidade()"
              [invalid]="invalido('valorMeta')"
              [class.invalid]="invalido('valorMeta')"
            />
            @if (modoValor() === 'integer') {
              <p class="hint">Metas em litros e unidades não têm casas decimais.</p>
            }
          </div>

          <div class="field">
            <label for="periodicidade">Periodicidade</label>
            <select id="periodicidade" class="select" formControlName="periodicidade">
              @for (p of periodicidades; track p.value) {
                <option [ngValue]="p.value">{{ p.label }}</option>
              }
            </select>
          </div>
        </div>
      </form>
    }
  `,
})
export class MetaFormComponent implements OnInit {
  /** Vem da rota /metas/:id/editar (withComponentInputBinding). */
  readonly id = input<string>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly router = inject(Router);
  private readonly metas = inject(MetaService);
  private readonly produtosApi = inject(ProdutoService);
  private readonly vendedoresApi = inject(VendedorService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly tiposMeta = TIPOS_META;
  readonly periodicidades = PERIODICIDADES;

  readonly vendedores = signal<Vendedor[]>([]);
  readonly produtos = signal<Produto[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly erroCarga = signal<string | null>(null);
  readonly erros = signal<string[]>([]);

  readonly editando = computed(() => !!this.id());

  readonly form = this.fb.group({
    vendedor: this.fb.control('', Validators.required),
    produto: this.fb.control('', Validators.required),
    tipoMeta: this.fb.control<TipoMeta>(TipoMeta.Monetario, Validators.required),
    periodicidade: this.fb.control<Periodicidade>(Periodicidade.Mensal, Validators.required),
    valorMeta: this.fb.control(0, Validators.min(0.01)),
  });

  private readonly tipoAtual = toSignal(this.form.controls.tipoMeta.valueChanges, {
    initialValue: this.form.controls.tipoMeta.value,
  });
  private readonly produtoAtual = toSignal(this.form.controls.produto.valueChanges, {
    initialValue: this.form.controls.produto.value,
  });
  readonly valorAtual = toSignal(this.form.controls.valorMeta.valueChanges, {
    initialValue: this.form.controls.valorMeta.value,
  });

  readonly modoValor = computed<'money' | 'integer'>(() =>
    this.tipoAtual() === TipoMeta.Monetario ? 'money' : 'integer',
  );
  readonly unidade = computed(() => (this.tipoAtual() === TipoMeta.Litros ? 'L' : 'un'));

  /** Regra do back-end: meta em litros só para produto da categoria Líquido. */
  readonly litrosInvalido = computed(() => {
    if (this.tipoAtual() !== TipoMeta.Litros) return false;
    const produto = this.produtos().find((p) => p.id === this.produtoAtual());
    return !!produto && produto.categoria !== CategoriaProduto.Liquido;
  });

  constructor() {
    // Mesma regra do MetaVendedorDto: fora de "Monetário", o valor perde os centavos.
    this.form.controls.tipoMeta.valueChanges.pipe(takeUntilDestroyed()).subscribe((tipo) => {
      if (tipo !== TipoMeta.Monetario) {
        const c = this.form.controls.valorMeta;
        c.setValue(Math.trunc(c.value));
      }
    });
  }

  async ngOnInit(): Promise<void> {
    try {
      const [vendedores, produtos] = await Promise.all([
        firstValueFrom(this.vendedoresApi.listar()),
        firstValueFrom(this.produtosApi.listar()),
      ]);
      this.vendedores.set(vendedores);
      this.produtos.set(produtos);

      const id = this.id();
      if (id) {
        const meta = await firstValueFrom(this.metas.obter(id));
        this.form.patchValue({
          vendedor: meta.vendedor,
          produto: meta.produto,
          tipoMeta: meta.tipoMeta,
          periodicidade: meta.periodicidade,
        });
        this.form.controls.valorMeta.setValue(meta.valorMeta);
        this.form.markAsPristine();
      }
    } catch (e) {
      this.erroCarga.set(toApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  @HostListener('window:keydown', ['$event'])
  aoTeclar(event: KeyboardEvent): void {
    if (this.confirm.isOpen()) return;
    if (event.key === 'F2') {
      event.preventDefault();
      void this.salvar();
    } else if (event.key === 'Escape') {
      // Esc dentro de um <select> só fecha a lista de opções
      if ((event.target as HTMLElement | null)?.tagName === 'SELECT') return;
      void this.voltar();
    }
  }

  invalido(campo: 'vendedor' | 'produto' | 'valorMeta'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || this.submitted());
  }

  dobrarValor(): void {
    const c = this.form.controls.valorMeta;
    c.setValue(c.value * 2);
    c.markAsDirty();
  }

  async limpar(): Promise<void> {
    const ok = await this.confirm.ask('Deseja limpar os campos?', { title: 'Limpar campos', confirmLabel: 'Limpar' });
    if (!ok) return;
    this.form.reset();
    this.submitted.set(false);
    this.erros.set([]);
  }

  async voltar(): Promise<void> {
    if (this.form.dirty) {
      const ok = await this.confirm.ask('Deseja voltar a tela inicial? As alterações não salvas serão perdidas.', {
        title: 'Voltar',
        confirmLabel: 'Voltar',
      });
      if (!ok) return;
    }
    await this.router.navigate(['/metas']);
  }

  /** Espelha as validações de MetaVendedorValidacao; o back-end continua sendo a fonte da verdade. */
  private validarLocal(): string[] {
    const v = this.form.getRawValue();
    const erros: string[] = [];
    if (!v.vendedor) erros.push('Vendedor não preenchido.');
    if (!v.produto) erros.push('Produto não preenchido.');
    if (!(v.valorMeta > 0)) erros.push('Valor da meta deve ser maior que zero.');
    if (this.litrosInvalido()) {
      erros.push('Metas em litros só podem ser atribuídas a produtos líquidos, como Barris ou Garrafas/Latas.');
    }
    return erros;
  }

  async salvar(): Promise<void> {
    if (this.saving() || this.loading()) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();

    const locais = this.validarLocal();
    this.erros.set(locais);
    if (locais.length) return;

    const v = this.form.getRawValue();
    const vendedor = this.vendedores().find((x) => x.id === v.vendedor);
    const produto = this.produtos().find((x) => x.id === v.produto);

    const payload: MetaVendedorPayload = {
      vendedor: v.vendedor,
      nomeVendedor: vendedor?.nomeVendedor ?? '',
      produto: v.produto,
      produtoNome: produto?.nomeProduto ?? '',
      periodicidade: v.periodicidade,
      tipoMeta: v.tipoMeta,
      valorMeta: v.tipoMeta === TipoMeta.Monetario ? v.valorMeta : Math.trunc(v.valorMeta),
    };

    this.saving.set(true);
    try {
      const id = this.id();
      if (id) {
        await firstValueFrom(this.metas.atualizar(id, { ...payload, id }));
        this.toast.success('Meta editada com sucesso.');
      } else {
        await firstValueFrom(this.metas.criar(payload));
        this.toast.success('Meta cadastrada com sucesso.');
      }
      this.form.markAsPristine();
      await this.router.navigate(['/metas']);
    } catch (e) {
      this.erros.set(toApiError(e).lines);
    } finally {
      this.saving.set(false);
    }
  }
}
