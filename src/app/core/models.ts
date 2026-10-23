/**
 * Espelha os DTOs e enums do projeto RegraDeNegocio (.NET).
 * A API serializa enums como número (padrão do System.Text.Json),
 * então os valores abaixo precisam bater com os enums do back-end:
 *   Periodicidade: Diaria = 1, Semanal = 2, Mensal = 3
 *   TipoMeta:      Monetario = 1, Litros = 2, Unidades = 3
 *   CategoriaProduto (aninhado em ProdutoDto): Liquido = 0, Diversos = 1
 */
export enum Periodicidade {
  Diaria = 1,
  Semanal = 2,
  Mensal = 3,
}

export enum TipoMeta {
  Monetario = 1,
  Litros = 2,
  Unidades = 3,
}

export enum CategoriaProduto {
  Liquido = 0,
  Diversos = 1,
}

export interface Opcao<T> {
  value: T;
  label: string;
}

export const PERIODICIDADES: Opcao<Periodicidade>[] = [
  { value: Periodicidade.Diaria, label: 'Diária' },
  { value: Periodicidade.Semanal, label: 'Semanal' },
  { value: Periodicidade.Mensal, label: 'Mensal' },
];

export const TIPOS_META: Opcao<TipoMeta>[] = [
  { value: TipoMeta.Monetario, label: 'Monetário' },
  { value: TipoMeta.Litros, label: 'Litros' },
  { value: TipoMeta.Unidades, label: 'Unidades' },
];

export const CATEGORIAS: Opcao<CategoriaProduto>[] = [
  { value: CategoriaProduto.Liquido, label: 'Líquido' },
  { value: CategoriaProduto.Diversos, label: 'Diversos' },
];

export function rotulo<T>(lista: Opcao<T>[], valor: T): string {
  return lista.find((o) => o.value === valor)?.label ?? '—';
}

/** MetaVendedorDto */
export interface MetaVendedor {
  id: string;
  /** Id do vendedor (FK) */
  vendedor: string;
  nomeVendedor: string;
  /** Id do produto (FK) */
  produto: string;
  produtoNome: string;
  periodicidade: Periodicidade;
  tipoMeta: TipoMeta;
  valorMeta: number;
}

/** ProdutoDto */
export interface Produto {
  id: string;
  nomeProduto: string;
  categoria: CategoriaProduto;
}

/** VendedorDto */
export interface Vendedor {
  id: string;
  nomeVendedor: string;
}

export type MetaVendedorPayload = Omit<MetaVendedor, 'id'> & { id?: string };
export type ProdutoPayload = Omit<Produto, 'id'> & { id?: string };
export type VendedorPayload = Omit<Vendedor, 'id'> & { id?: string };
