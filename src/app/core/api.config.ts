import { InjectionToken } from '@angular/core';

/**
 * Base da API. Em desenvolvimento o `proxy.conf.json` encaminha /api para
 * https://localhost:7109. Em produção, forneça outra URL, por exemplo:
 *   { provide: API_URL, useValue: 'https://minha-api.com' }
 */
export const API_URL = new InjectionToken<string>('API_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
