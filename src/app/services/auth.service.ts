import { Injectable, Injector, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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
  private readonly tokenKey = 'mb_auth_token';
  private readonly userKey = 'mb_auth_user';

  currentUser = signal<User | null>(this.loadUser());
  isAuthenticated = signal<boolean>(!!this.getToken());

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  login(email: string, password: string, recaptchaToken?: string): Observable<LoginResponse> {
    const body: Record<string, string> = { email, password };
    if (recaptchaToken) body['recaptcha_token'] = recaptchaToken;
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/login`, body).pipe(
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
    return this.http.post<LoginResponse>(`${this.baseUrl}/api/auth/register`, body).pipe(
      tap(res => this.setSession(res))
    );
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    // Ленивый резолв (циклическая зависимость SocketService -> AuthService):
    // без disconnect старый клиент продолжает reconnect с прежним JWT
    import('./socket.service').then(({ SocketService }) => {
      this.injector.get(SocketService).disconnect();
    });
  }

  getToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Silent session check on app start: if the stored JWT is expired/invalid,
   * the backend answers 401 and we clear the stale session so the UI
   * doesn't show the user as logged in.
   */
  validateSession(): void {
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
      localStorage.removeItem(this.tokenKey);
      return null;
    }
  }

  private setSession(res: LoginResponse): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.tokenKey, res.token);
      localStorage.setItem(this.userKey, JSON.stringify(res.user));
    }
    this.currentUser.set(res.user);
    this.isAuthenticated.set(true);
  }
}
