import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { API_URL } from './api.config';
import { Vendedor, VendedorPayload } from './models';

type Raw = Record<string, unknown>;

function deApi(r: Raw): Vendedor {
  return {
    id: String(r['id'] ?? ''),
    nomeVendedor: String(r['nomeVendedor'] ?? ''),
  };
}

/** Consome VendedorController: GET/POST /Vendedor, GET/PUT/DELETE /Vendedor/{id} */
@Injectable({ providedIn: 'root' })
export class VendedorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_URL)}/Vendedor`;

  listar(): Observable<Vendedor[]> {
    return this.http.get<Raw[]>(this.base).pipe(map((lista) => lista.map(deApi)));
  }

  obter(id: string): Observable<Vendedor> {
    return this.http.get<Raw>(`${this.base}/${encodeURIComponent(id)}`).pipe(map(deApi));
  }

  criar(vendedor: VendedorPayload): Observable<void> {
    return this.http.post<void>(this.base, vendedor);
  }

  atualizar(id: string, vendedor: VendedorPayload): Observable<void> {
    return this.http.put<void>(`${this.base}/${encodeURIComponent(id)}`, vendedor);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${encodeURIComponent(id)}`);
  }
}
