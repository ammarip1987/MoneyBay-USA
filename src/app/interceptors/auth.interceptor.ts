import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Токен доступа к запросу и его продление.
 *
 * Токен живёт минуты, поэтому за время работы истекает не раз. Сервер отвечает
 * 401, перехватчик берёт новый по куке и повторяет запрос — для вошедшего это
 * незаметно, выхода не происходит.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);

  const withToken = (request: typeof req) => {
    const token = auth.getToken();
    return token
      ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : request;
  };

  return next(withToken(req)).pipe(
    catchError((err: HttpErrorResponse) => {
      // Обновление само отвечает 401, когда кука негодна — повторять его
      // значило бы уйти в круг
      const isRefresh = req.url.includes('/api/auth/refresh');
      if (err.status !== 401 || isRefresh || !auth.isAuthenticated()) {
        return throwError(() => err);
      }

      return auth.refreshToken().pipe(
        switchMap(() => next(withToken(req))),
        catchError(() => throwError(() => err))
      );
    })
  );
};
