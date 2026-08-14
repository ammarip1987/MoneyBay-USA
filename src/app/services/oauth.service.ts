import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface OAuthProvider {
  provider: 'google' | 'facebook' | 'apple';
  clientId: string;
}

const LABELS: Record<string, string> = {
  google: 'Continue with Google',
  facebook: 'Continue with Facebook',
  apple: 'Continue with Apple'
};

@Injectable({ providedIn: 'root' })
export class OAuthService {
  private http = inject(HttpClient);
  private readonly stateKey = 'mb_oauth_state';

  /**
   * Список включённых провайдеров приходит с backend вместе с Client ID.
   * Пока credentials не заданы в окружении, список пуст и кнопки не отображаются.
   */
  readonly providers$: Observable<OAuthProvider[]> = this.http
    .get<{ providers: OAuthProvider[] }>(`${environment.apiUrl}/api/auth/oauth2/config`)
    .pipe(
      map(res => res.providers || []),
      catchError(() => of([])),
      shareReplay(1)
    );

  label(provider: string): string {
    return LABELS[provider] || provider;
  }

  redirectUri(provider: string): string {
    return `${window.location.origin}/auth/${provider}/callback`;
  }

  /** Уводит на страницу провайдера; state запоминается для проверки на возврате. */
  start(p: OAuthProvider): void {
    const state = this.newState();
    sessionStorage.setItem(this.stateKey, state);

    const redirectUri = this.redirectUri(p.provider);
    const params = new URLSearchParams({
      client_id: p.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state
    });

    let base: string;
    switch (p.provider) {
      case 'google':
        base = 'https://accounts.google.com/o/oauth2/v2/auth';
        params.set('scope', 'openid email profile');
        break;
      case 'facebook':
        base = 'https://www.facebook.com/v18.0/dialog/oauth';
        params.set('scope', 'email,public_profile');
        break;
      case 'apple':
        // Без scope name/email Apple отвечает redirect'ом с query.
        // Запрос этих scope переводит ответ в form_post, который SPA не примет.
        base = 'https://appleid.apple.com/auth/authorize';
        break;
    }

    window.location.href = `${base}?${params.toString()}`;
  }

  /** state одноразовый: сверяется и сразу удаляется. */
  consumeState(returned: string | undefined): boolean {
    const stored = sessionStorage.getItem(this.stateKey);
    sessionStorage.removeItem(this.stateKey);
    return !!stored && !!returned && stored === returned;
  }

  private newState(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
}
