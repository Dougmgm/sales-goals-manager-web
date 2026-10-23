import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from './api.config';
import { parseEnum } from './enum.util';
import { CategoriaProduto, Produto, ProdutoPayload } from './models';

type Raw = Record<string, unknown>;

function deApi(r: Raw): Produto {
  return {
    id: String(r['id'] ?? ''),
    nomeProduto: String(r['nomeProduto'] ?? ''),
    categoria: parseEnum<CategoriaProduto>(CategoriaProduto, r['categoria'], CategoriaProduto.Diversos),
  };
}

/** Consome ProdutoController: GET/POST /Produto, GET/PUT/DELETE /Produto/{id} */
@Injectable({ providedIn: 'root' })
export class ProdutoService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/Produto`;

  listar(): Observable<Produto[]> {
    return this.http.get<Raw[]>(this.base).pipe(map((lista) => lista.map(deApi)));
  }

  obter(id: string): Observable<Produto> {
    return this.http.get<Raw>(`${this.base}/${encodeURIComponent(id)}`).pipe(map(deApi));
  }

  criar(produto: ProdutoPayload): Observable<void> {
    return this.http.post<void>(this.base, produto);
  }

  atualizar(id: string, produto: ProdutoPayload): Observable<void> {
    return this.http.put<void>(`${this.base}/${encodeURIComponent(id)}`, produto);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
