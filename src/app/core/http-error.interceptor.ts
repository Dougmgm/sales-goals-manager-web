import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { toApiError } from './api-error';

/** Converte qualquer falha HTTP em ApiError, para as telas tratarem de um jeito só. */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((err: unknown) => throwError(() => toApiError(err))));
