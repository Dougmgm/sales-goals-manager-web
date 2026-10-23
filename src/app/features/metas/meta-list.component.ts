import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { toApiError } from '../../core/api-error';
import { ConfirmService } from '../../core/confirm.service';
import { formatarMeta, normalizar } from '../../core/format';
import { MetaService } from '../../core/meta.service';
import { MetaVendedor, PERIODICIDADES, TIPOS_META, rotulo } from '../../core/models';
import { ToastService } from '../../core/toast.service';

@Component({
  selector: 'app-meta-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="page-head">
      <div>
        <h1>Metas</h1>
        @if (!loading() && !erro()) {
          <p class="sub">{{ filtradas().length }} de {{ itens().length }} metas</p>
        }
      </div>
      <a class="btn btn-primary" routerLink="/metas/nova">Nova meta</a>
    </header>

    @if (loading()) {
      <p class="state">Carregando metas…</p>
    } @else if (erro()) {
      <div class="state state-error" role="alert">
        <p>{{ erro() }}</p>
        <button type="button" class="btn" (click)="carregar()">Tentar novamente</button>
      </div>
    } @else {
      @if (totais().length) {
        <section class="totals" aria-label="Totais da seleção atual">
          @for (t of totais(); track t.label) {
            <div class="total">
              <span class="total-label">{{ t.label }}</span>
              <strong>{{ t.texto }}</strong>
              <span class="total-sub">{{ t.qtd }} {{ t.qtd === 1 ? 'meta' : 'metas' }}</span>
            </div>
          }
        </section>
      }

      <div class="toolbar">
        <label class="sr-only" for="busca">Buscar metas</label>
        <input
          id="busca"
          class="input"
          type="search"
          placeholder="Buscar por vendedor, produto, tipo ou periodicidade"
          [value]="termo()"
          (input)="aoBuscar($event)"
        />
      </div>

      @if (filtradas().length === 0) {
        <p class="state">
          @if (itens().length === 0) {
            Nenhuma meta cadastrada ainda.
          } @else {
            Nenhuma meta encontrada para essa busca.
          }
        </p>
      } @else {
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Periodicidade</th>
                <th class="num">Meta</th>
                <th><span class="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              @for (m of filtradas(); track m.id) {
                <tr>
                  <td>{{ m.nomeVendedor }}</td>
                  <td>{{ m.produtoNome }}</td>
                  <td><span class="tag">{{ tipo(m) }}</span></td>
                  <td>{{ periodicidade(m) }}</td>
                  <td class="num">{{ valor(m) }}</td>
                  <td class="actions">
                    <a class="btn btn-quiet" [routerLink]="['/metas', m.id, 'editar']" [attr.aria-label]="'Editar meta de ' + m.nomeVendedor">Editar</a>
                    <button type="button" class="btn btn-quiet btn-danger-text" (click)="excluir(m)" [attr.aria-label]="'Excluir meta de ' + m.nomeVendedor">Excluir</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    }
  `,
})
export class MetaListComponent implements OnInit {
  private readonly service = inject(MetaService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  readonly itens = signal<MetaVendedor[]>([]);
  readonly loading = signal(true);
  readonly erro = signal<string | null>(null);
  readonly termo = signal('');

  readonly filtradas = computed(() => {
    const t = normalizar(this.termo());
    const base = [...this.itens()].sort(
      (a, b) => a.nomeVendedor.localeCompare(b.nomeVendedor, 'pt-BR') || a.produtoNome.localeCompare(b.produtoNome, 'pt-BR'),
    );
    if (!t) return base;
    return base.filter((m) =>
      normalizar([m.nomeVendedor, m.produtoNome, this.tipo(m), this.periodicidade(m)].join(' ')).includes(t),
    );
  });

  /** Soma por tipo de meta (somar R$ com litros não faria sentido). */
  readonly totais = computed(() =>
    TIPOS_META.map((tipo) => {
      const lista = this.filtradas().filter((m) => m.tipoMeta === tipo.value);
      const soma = lista.reduce((acc, m) => acc + m.valorMeta, 0);
      return { label: tipo.label, qtd: lista.length, texto: formatarMeta(tipo.value, soma) };
    }).filter((t) => t.qtd > 0),
  );

  ngOnInit(): void {
    void this.carregar();
  }

  async carregar(): Promise<void> {
    this.loading.set(true);
    this.erro.set(null);
    try {
      this.itens.set(await firstValueFrom(this.service.listar()));
    } catch (e) {
      this.erro.set(toApiError(e).message);
    } finally {
      this.loading.set(false);
    }
  }

  aoBuscar(event: Event): void {
    this.termo.set((event.target as HTMLInputElement).value);
  }

  tipo(m: MetaVendedor): string {
    return rotulo(TIPOS_META, m.tipoMeta);
  }

  periodicidade(m: MetaVendedor): string {
    return rotulo(PERIODICIDADES, m.periodicidade);
  }

  valor(m: MetaVendedor): string {
    return formatarMeta(m.tipoMeta, m.valorMeta);
  }

  async excluir(m: MetaVendedor): Promise<void> {
    const ok = await this.confirm.ask('Deseja realmente excluir a meta selecionada?', {
      title: 'Excluir meta',
      confirmLabel: 'Excluir',
      danger: true,
    });
    if (!ok) return;
    try {
      await firstValueFrom(this.service.excluir(m.id));
      this.itens.update((l) => l.filter((x) => x.id !== m.id));
      this.toast.success('Meta excluída.');
    } catch (e) {
      this.toast.error(toApiError(e).message);
    }
  }
}
