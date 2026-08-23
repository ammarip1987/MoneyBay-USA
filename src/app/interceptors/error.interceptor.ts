import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { SKIP_SESSION_EXPIRED } from './http-context.tokens';

/**
 * Global handling of expired/invalid sessions:
 * a 401 on an authenticated request (stale JWT in localStorage)
 * clears the session, notifies the user and redirects to /login
 * instead of showing a generic "Failed" message.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        // Только 401. Прежде сюда попадал и 403, чтобы сбрасывать просроченный
        // токен, но Forbidden приходит и при нехватке прав, и когда сервер
        // отвергает запрос под нагрузкой — из системы выбрасывало посреди
        // работы. Просроченный токен отсеивает validateSession при запуске.
        err.status === 401 &&
        !req.context.get(SKIP_SESSION_EXPIRED) &&
        !req.url.includes('/api/auth/') &&
        // Токен в памяти пропал — значит обновление по куке уже пробовали и
        // получили отказ. Пока токен на месте, 401 разбирает authInterceptor:
        // он берёт новый по куке и повторяет запрос, выбрасывать не за что.
        // Прежде здесь стояло обратное условие, и первый же истёкший токен
        // выкидывал из учётной записи, хотя вход можно было продлить
        !auth.getToken()
      ) {
        auth.logout();
        notification.error('Session expired. Please log in again.');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    })
  );
};
