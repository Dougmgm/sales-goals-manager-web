import { Component, OnInit, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/api-error';
import { ConfirmService } from '../../core/confirm.service';
import { Vendedor } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { VendedorService } from '../../core/vendedor.service';

@Component({
  selector: 'app-vendedores',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <header class="page-head">
      <div>
        <h1>Vendedores</h1>
        @if (!loading() && !erroCarga()) {
          <p class="sub">{{ itens().length }} {{ itens().length === 1 ? 'vendedor cadastrado' : 'vendedores cadastrados' }}</p>
        }
      </div>
    </header>

    <div class="split">
      <section aria-label="Lista de vendedores">
        @if (loading()) {
          <p class="state">Carregando vendedores…</p>
        } @else if (erroCarga()) {
          <div class="state state-error" role="alert">
            <p>{{ erroCarga() }}</p>
            <button type="button" class="btn" (click)="carregar()">Tentar novamente</button>
          </div>
        } @else if (itens().length === 0) {
          <p class="state">Nenhum vendedor cadastrado ainda.</p>
        } @else {
          <div class="table-wrap">
            <table class="table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (v of itens(); track v.id) {
                  <tr [class.is-editing]="v.id === editandoId()">
                    <td>{{ v.nomeVendedor }}</td>
                    <td class="actions">
                      <button type="button" class="btn btn-quiet" (click)="editar(v)" [attr.aria-label]="'Editar ' + v.nomeVendedor">Editar</button>
                      <button type="button" class="btn btn-quiet btn-danger-text" (click)="excluir(v)" [attr.aria-label]="'Excluir ' + v.nomeVendedor">Excluir</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>

      <section class="panel" aria-labelledby="titulo-form">
        <h2 id="titulo-form">{{ editandoId() ? 'Editar vendedor' : 'Novo vendedor' }}</h2>

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
          <div class="field" [class.invalid]="nomeInvalido()">
            <label for="nomeVendedor">Nome do vendedor</label>
            <input id="nomeVendedor" class="input" type="text" formControlName="nomeVendedor" autocomplete="off" />
            @if (nomeInvalido()) {
              <p class="field-error">Vendedor não preenchido, favor preencher.</p>
            }
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
export class VendedoresComponent implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(VendedorService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly itens = signal<Vendedor[]>([]);
  readonly loading = signal(true);
  readonly erroCarga = signal<string | null>(null);
  readonly editandoId = signal<string | null>(null);
  readonly saving = signal(false);
  readonly submitted = signal(false);
  readonly erros = signal<string[]>([]);

  readonly form = this.fb.group({
    nomeVendedor: this.fb.control('', Validators.required),
  });

  ngOnInit(): void {
    void this.carregar();
  }

  nomeInvalido(): boolean {
    return this.submitted() && !this.form.controls.nomeVendedor.value.trim();
  }

  async carregar(): Promise<void> {
    this.loading.set(true);
    this.erroCarga.set(null);
    try {
      const lista = await firstValueFrom(this.service.listar());
      this.itens.set([...lista].sort((a, b) => a.nomeVendedor.localeCompare(b.nomeVendedor, 'pt-BR')));
    } catch (e) {
      this.erroCarga.set(toApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  editar(v: Vendedor): void {
    this.editandoId.set(v.id);
    this.form.setValue({ nomeVendedor: v.nomeVendedor });
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

    const nome = this.form.getRawValue().nomeVendedor.trim();
    if (!nome) {
      this.erros.set(['Vendedor não preenchido, favor preencher.']);
      return;
    }

    this.saving.set(true);
    try {
      const id = this.editandoId();
      if (id) {
        await firstValueFrom(this.service.atualizar(id, { nomeVendedor: nome, id }));
        this.toast.success('Vendedor atualizado.');
      } else {
        await firstValueFrom(this.service.criar({ nomeVendedor: nome }));
        this.toast.success('Vendedor cadastrado.');
      }
      this.cancelar();
      await this.carregar();
    } catch (e) {
      this.erros.set(toApiError(e).lines);
    } finally {
      this.saving.set(false);
    }
  }

  async excluir(v: Vendedor): Promise<void> {
    const ok = await this.confirm.ask(`Deseja realmente excluir o vendedor "${v.nomeVendedor}"?`, {
      title: 'Excluir vendedor',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.service.excluir(v.id));
      if (this.editandoId() === v.id) this.cancelar();
      this.itens.update((l) => l.filter((x) => x.id !== v.id));
      this.toast.success('Vendedor excluído.');
    } catch (e) {
      const err = toApiError(e);
      this.toast.error(
        err.status >= 500
          ? `Não foi possível excluir "${v.nomeVendedor}". Verifique se há metas vinculadas a ele.`
          : err.message,
      );
    }
  }
}
