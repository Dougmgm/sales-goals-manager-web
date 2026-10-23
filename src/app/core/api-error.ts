import { HttpErrorResponse } from '@angular/common/http';

/** Erro normalizado. Vem do middleware da API (ProblemDetails) ou de falha de rede. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly lines: string[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function montar(texto: string, status: number): ApiError {
  const lines = texto
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*-\s*/, '').trim())
    .filter(Boolean);
  return new ApiError(lines.join(' '), status, lines);
}

export function toApiError(err: unknown): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) {
      return montar('Não foi possível conectar à API. Verifique se ela está em execução.', 0);
    }

    let detalhe: string | null = null;
    const corpo: unknown = err.error;

    if (typeof corpo === 'string' && corpo.trim()) {
      detalhe = corpo;
    } else if (corpo && typeof corpo === 'object') {
      const o = corpo as Record<string, unknown>;
      if (typeof o['detail'] === 'string' && o['detail']) {
        detalhe = o['detail'];
      } else if (o['errors'] && typeof o['errors'] === 'object') {
        // 400 automático do [ApiController] (falha de model binding)
        const msgs = Object.values(o['errors'] as Record<string, unknown>)
          .flat()
          .filter((m): m is string => typeof m === 'string');
        if (msgs.length) detalhe = msgs.join('\n');
      } else if (typeof o['title'] === 'string') {
        detalhe = o['title'];
      }
    }

    if (!detalhe) {
      if (err.status === 404) detalhe = 'Registro não encontrado.';
      else if (err.status >= 500) detalhe = 'Ocorreu um erro interno. Tente novamente mais tarde.';
      else detalhe = `Erro inesperado (HTTP ${err.status}).`;
    }
    return montar(detalhe, err.status);
  }

  const msg = err instanceof Error ? err.message : 'Erro inesperado.';
  return montar(msg, -1);
}
