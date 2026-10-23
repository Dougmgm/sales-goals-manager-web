/**
 * Converte o valor cru da API para o enum numérico.
 * Aceita número (padrão atual), número em string ou o nome do membro
 * (caso o back-end passe a usar JsonStringEnumConverter).
 */
export function parseEnum<T extends number>(
  enumObj: Record<string, string | number>,
  raw: unknown,
  fallback: T,
): T {
  if (typeof raw === 'number') return raw as T;
  if (typeof raw === 'string') {
    if (/^\d+$/.test(raw)) return Number(raw) as T;
    const chave = Object.keys(enumObj).find(
      (k) => k.toLowerCase() === raw.toLowerCase() && typeof enumObj[k] === 'number',
    );
    if (chave !== undefined) return enumObj[chave] as T;
  }
  return fallback;
}
