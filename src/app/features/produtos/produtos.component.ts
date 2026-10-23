import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/api-error';
import { ConfirmService } from '../../core/confirm.service';
import { CATEGORIAS, CategoriaProduto, Produto, rotulo } from '../../core/models';
import { ProdutoService } from '../../core/produto.service';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-produtos',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <header class="page-head">
      <div>
        <h1>Produtos</h1>
        @if (!loading() && !erroCarga()) {
          <p class="sub">{{ itens().length }} {{ itens().length === 1 ? 'produto cadastrado' : 'produtos cadastrados' }}</p>
        }
      </div>
    </header>

    <div class="split">
      <section aria-label="Lista de produtos">
        @if (loading()) {
          <p class="state">Carregando produtos…</p>
        } @else if (erroCarga()) {
          <div class="state state-error" role="alert">
            <p>{{ erroCarga() }}</p>
            <button type="button" class="btn" (click)="carregar()">Tentar novamente</button>
          </div>
        } @else if (itens().length === 0) {
          <p class="state">Nenhum produto cadastrado ainda.</p>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Categoria</th>
                  <th><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (p of itens(); track p.id) {
                  <tr [class.is-editing]="p.id === editandoId()">
                    <td>{{ p.nomeProduto }}</td>
                    <td><span class="tag">{{ categoria(p) }}</span></td>
                    <td class="actions">
                      <button type="button" class="btn btn-quiet" (click)="editar(p)" [attr.aria-label]="'Editar ' + p.nomeProduto">Editar</button>
                      <button type="button" class="btn btn-quiet btn-danger-text" (click)="excluir(p)" [attr.aria-label]="'Excluir ' + p.nomeProduto">Excluir</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="panel" aria-labelledby="titulo-form">
        <h2 id="titulo-form">{{ editandoId() ? 'Editar produto' : 'Novo produto' }}</h2>

        @if (erros().length) {
          <div class="banner banner-error" role="alert">
            <ul>
              @for (e of erros(); track $index) {
                <li>{{ e }}</li>
              }
            </ul>
          </div>
        }

        <form [formGroup]="form" (ngSubmit)="salvar()" novalidate>
          <div class="stack">
            <div class="field" [class.invalid]="nomeInvalido()">
              <label for="nomeProduto">Nome do produto</label>
              <input id="nomeProduto" class="input" type="text" formControlName="nomeProduto" autocomplete="off" />
              @if (nomeInvalido()) {
                <p class="field-error">Nome do produto não preenchido, favor preencher.</p>
              }
            </div>
            <div class="field">
              <label for="categoria">Categoria</label>
              <select id="categoria" class="select" formControlName="categoria">
                @for (c of categorias; track c.value) {
                  <option [ngValue]="c.value">{{ c.label }}</option>
                }
              </select>
              <p class="hint">Metas em litros só aceitam produtos da categoria Líquido.</p>
            </div>
          </div>
          <div class="actions-row">
            <button type="submit" class="btn btn-primary" [disabled]="saving()">{{ saving() ? 'Salvando…' : 'Salvar' }}</button>
            @if (editandoId()) {
              <button type="button" class="btn" (click)="cancelar()">Cancelar edição</button>
            }
          </div>
        </form>
      </section>
    </div>
  `,
})
export class ProdutosComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ProdutoService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly categorias = CATEGORIAS;
  readonly itens = signal<Produto[]>([]);
  readonly loading = signal(true);
  readonly erroCarga = signal<string | null>(null);
  readonly editandoId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly erros = signal<string[]>([]);

  readonly form = this.fb.group({
    nomeProduto: this.fb.control('', Validators.required),
    categoria: this.fb.control<CategoriaProduto>(CategoriaProduto.Liquido, Validators.required),
  });

  ngOnInit(): void {
    void this.carregar();
  }

  categoria(p: Produto): string {
    return rotulo(CATEGORIAS, p.categoria);
  }

  nomeInvalido(): boolean {
    return this.submitted() && !this.form.controls.nomeProduto.value.trim();
  }

  async carregar(): Promise<void> {
    this.loading.set(true);
    this.erroCarga.set(null);
    try {
      const lista = await firstValueFrom(this.service.listar());
      this.itens.set([...lista].sort((a, b) => a.nomeProduto.localeCompare(b.nomeProduto, 'pt-BR')));
    } catch (e) {
      this.erroCarga.set(toApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  editar(p: Produto): void {
    this.editandoId.set(p.id);
    this.form.setValue({ nomeProduto: p.nomeProduto, categoria: p.categoria });
    this.submitted.set(false);
    this.erros.set([]);
  }

  cancelar(): void {
    this.editandoId.set(null);
    this.form.reset();
    this.submitted.set(false);
    this.erros.set([]);
  }

  async salvar(): Promise<void> {
    if (this.saving()) return;
    this.submitted.set(true);
    this.erros.set([]);

    const v = this.form.getRawValue();
    const nome = v.nomeProduto.trim();
    if (!nome) {
      this.erros.set(['Nome do produto não preenchido, favor preencher.']);
      return;
    }

    this.saving.set(true);
    try {
      const id = this.editandoId();
      const payload = { nomeProduto: nome, categoria: v.categoria };
      if (id) {
        await firstValueFrom(this.service.atualizar(id, { ...payload, id }));
        this.toast.success('Produto atualizado.');
      } else {
        await firstValueFrom(this.service.criar(payload));
        this.toast.success('Produto cadastrado.');
      }
      this.cancelar();
      await this.carregar();
    } catch (e) {
      this.erros.set(toApiError(e).lines);
    } finally {
      this.saving.set(false);
    }
  }

  async excluir(p: Produto): Promise<void> {
    const ok = await this.confirm.ask(`Deseja realmente excluir o produto "${p.nomeProduto}"?`, {
      title: 'Excluir produto',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.service.excluir(p.id));
      if (this.editandoId() === p.id) this.cancelar();
      this.itens.update((l) => l.filter((x) => x.id !== p.id));
      this.toast.success('Produto excluído.');
    } catch (e) {
      const err = toApiError(e);
      // O banco usa DeleteBehavior.Restrict: produto com metas vinculadas não pode ser removido.
      this.toast.error(
        err.status >= 500
          ? `Não foi possível excluir "${p.nomeProduto}". Verifique se há metas vinculadas a ele.`
          : err.message,
      );
    }
  }
}
