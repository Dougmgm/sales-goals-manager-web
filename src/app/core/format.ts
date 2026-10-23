import { TipoMeta } from './models';

const numero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });
const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** Exibe a meta de acordo com o tipo: R$ 1.234,56 | 1.234 L | 1.234 un */
export function formatarMeta(tipo: TipoMeta, valor: number): string {
  switch (tipo) {
    case TipoMeta.Monetario:
      return moeda.format(valor);
    case TipoMeta.Litros:
      return `${numero.format(valor)} L`;
    default:
      return `${numero.format(valor)} un`;
  }
}

/** Minúsculas e sem acento, para buscas. */
export function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}
