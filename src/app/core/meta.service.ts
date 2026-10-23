import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from './api.config';
import { parseEnum } from './enum.util';
import { MetaVendedor, MetaVendedorPayload, Periodicidade, TipoMeta } from './models';

type Raw = Record<string, unknown>;

function deApi(r: Raw): MetaVendedor {
  return {
    id: String(r['id'] ?? ''),
    vendedor: String(r['vendedor'] ?? ''),
    nomeVendedor: String(r['nomeVendedor'] ?? ''),
    produto: String(r['produto'] ?? ''),
    produtoNome: String(r['produtoNome'] ?? ''),
    periodicidade: parseEnum<Periodicidade>(Periodicidade, r['periodicidade'], Periodicidade.Mensal),
    tipoMeta: parseEnum<TipoMeta>(TipoMeta, r['tipoMeta'], TipoMeta.Monetario),
    valorMeta: Number(r['valorMeta'] ?? 0),
  };
}

/** Consome MetaController: GET/POST /Meta, GET/PUT/DELETE /Meta/{id} */
@Injectable({ providedIn: 'root' })
export class MetaService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/Meta`;

  listar(): Observable<MetaVendedor[]> {
    return this.http.get<Raw[]>(this.base).pipe(map((lista) => lista.map(deApi)));
  }

  obter(id: string): Observable<MetaVendedor> {
    return this.http.get<Raw>(`${this.base}/${encodeURIComponent(id)}`).pipe(map(deApi));
  }

  criar(meta: MetaVendedorPayload): Observable<void> {
    return this.http.post<void>(this.base, meta);
  }

  atualizar(id: string, meta: MetaVendedorPayload): Observable<void> {
    return this.http.put<void>(`${this.base}/${encodeURIComponent(id)}`, meta);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
