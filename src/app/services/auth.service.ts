import { Injectable, Injector, inject, signal, PLATFORM_ID, REQUEST } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap, finalize, shareReplay } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/listing.model';
import { SKIP_SESSION_EXPIRED } from '../interceptors/http-context.tokens';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private injector = inject(Injector);
  private readonly baseUrl = environment.apiUrl;
  private readonly userKey = 'mb_auth_user';
  private readonly hintKey = 'mb_auth_hint';

  /**
   * Токен доступа держится только здесь, в памяти вкладки.
   *
   * В localStorage его больше нет: оттуда его прочёл бы любой скрипт,
   * попавший на страницу, и унёс бы вход целиком. Отсюда прочитать нечего —
   * при перезагрузке значение пропадает, а вход восстанавливается запросом
   * к /api/auth/refresh по куке, до которой скрипты не дотягиваются.
   */
  private accessToken: string | null = null;

  /** Идёт ли обновление: параллельные запросы ждут его, а не шлют своё. */
  private refreshing: Observable<LoginResponse> | null = null;

  currentUser = signal<User | null>(this.loadUser());
  isAuthenticated = signal<boolean>(false);

  constructor() {
    if (this.isBrowser()) {
      // Токена в памяти после перезагрузки нет — вход поднимается по куке.
      // Пока запрос идёт, шапка рисуется по метке, иначе она мигала бы
      // гостевым видом у вошедшего
      this.isAuthenticated.set(this.authHint());
      if (this.authHint()) this.restoreSession();
    }
  }

  /**
   * Поднять вход после перезагрузки: кука с обновляющим токеном приходит сама,
   * сервер отвечает новым токеном доступа.
   */
  private restoreSession(): void {
    this.refreshToken().subscribe({
      error: () => this.clearSession()
    });
  }

  /**
   * Новый токен доступа по куке.
   *
   * Запрос один на все ожидающие: без этого несколько одновременных ответов
   * 401 запустили бы обновление каждый, и последний перебил бы токен, который
   * уже разошёлся по остальным.
   */
  refreshToken(): Observable<LoginResponse> {
    if (this.refreshing) return this.refreshing;

    this.refreshing = this.http
      .post<LoginResponse>(`${this.baseUrl}/api/auth/refresh`, {}, {
        withCredentials: true,
        context: new HttpContext().set(SKIP_SESSION_EXPIRED, true)
      })
      .pipe(
        tap(res => this.setSession(res)),
        finalize(() => { this.refreshing = null; }),
        shareReplay(1)
      );

    return this.refreshing;
  }
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(email: string, password: string, recaptchaToken?: string): Observable<LoginResponse> {
    const body: Record<string, string> = { email, password };
    if (recaptchaToken) body['recaptcha_token'] = recaptchaToken;
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, body, { withCredentials: true }).pipe(
      tap(res => this.setSession(res))
    );
  }

  register(data: { email: string; username: string; password: string; city?: string; recaptchaToken?: string }): Observable<LoginResponse> {
    const body: Record<string, string> = {
      email: data.email,
      username: data.username,
      password: data.password
    };
    if (data.city) body['city'] = data.city;
    if (data.recaptchaToken) body['recaptcha_token'] = data.recaptchaToken;
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/register`, body, { withCredentials: true }).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    // Кука снимается на сервере: у неё HttpOnly, из скрипта её не удалить.
    // Ответа не ждём — вход в этой вкладке гасится сразу
    if (this.isBrowser()) {
      this.http.post(`${this.baseUrl}/api/auth/logout`, {}, {
        withCredentials: true,
        context: new HttpContext().set(SKIP_SESSION_EXPIRED, true)
      }).subscribe({ error: () => {} });
    }
    this.clearSession();
  }

  /** Забыть вход в этой вкладке, ничего не спрашивая у сервера. */
  private clearSession(): void {
    this.accessToken = null;
    if (this.isBrowser()) localStorage.removeItem(this.userKey);
    this.setAuthHint(false);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    // Ленивый резолв (циклическая зависимость SocketService -> AuthService):
    // без disconnect старый клиент продолжает reconnect с прежним JWT
    import('./socket.service').then(({ SocketService }) => {
      this.injector.get(SocketService).disconnect();
    });
  }

  getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Silent session check on app start: if the stored JWT is expired/invalid,
   * the backend answers 401 and we clear the stale session so the UI
   * doesn't show the user as logged in.
   */
  validateSession(): void {
    // Токена в памяти нет — проверять нечего: вход поднимает restoreSession
    if (!this.getToken()) return;
    this.http
      .get(`${this.baseUrl}/api/profile`, {
        context: new HttpContext().set(SKIP_SESSION_EXPIRED, true)
      })
      .subscribe({
        error: (err) => {
          if (err.status === 401) this.logout();
        }
      });
  }

  private loadUser(): User | null {
    if (!this.isBrowser()) return null;
    const data = localStorage.getItem(this.userKey);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      // Битое значение (частичная запись, ручная правка) не должно ронять
      // конструктор root-сервиса — чистим и продолжаем анонимно
      localStorage.removeItem(this.userKey);
      return null;
    }
  }


  /**
   * Метка входа в cookie. Сервер localStorage не видит, а cookie приходят
   * с каждым запросом — по ней серверная отрисовка сразу рисует шапку
   * верно, без мелькания ссылок.
   *
   * В cookie кладётся только признак, без токена: токен остаётся в
   * localStorage, недоступным для запросов с других сайтов.
   */

  /**
   * Предположение о входе для первой отрисовки. В браузере — из cookie,
   * на сервере — из заголовка Cookie запроса. Значение не удостоверяет
   * личность и правами не распоряжается: оно лишь определяет, какую шапку
   * показать до того, как прочитан localStorage.
   */
  authHint(): boolean {
    if (this.isBrowser()) {
      return document.cookie.includes(`${this.hintKey}=1`);
    }
    const request = this.injector.get(REQUEST, null);
    const header = request?.headers?.get('cookie') ?? '';
    return header.includes(`${this.hintKey}=1`);
  }
  private setAuthHint(active: boolean): void {
    if (!this.isBrowser()) return;
    const base = `${this.hintKey}=1; path=/; SameSite=Lax`;
    document.cookie = active
      ? `${base}; max-age=${60 * 60 * 24 * 30}`
      : `${this.hintKey}=; path=/; SameSite=Lax; max-age=0`;
  }
  setSession(res: LoginResponse): void {
    // Токен — только в память. В localStorage кладётся сам пользователь: имя и
    // город правами не распоряжаются, а без них шапка после перезагрузки
    // пустовала бы до ответа сервера
    this.accessToken = res.token;
    if (this.isBrowser()) {
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
    }
    this.setAuthHint(true);
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }
}
