import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { OAuthService } from '../../services/oauth.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4">
      @if (error()) {
        <div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
          <div class="w-14 h-14 bg-red-50 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-mb-dark mb-2">Sign-in failed</h1>
          <p class="text-gray-600 text-sm mb-6">{{ error() }}</p>
          <a routerLink="/login" class="inline-block px-6 py-3 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-lg transition">
            Back to login
          </a>
        </div>
      } @else {
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mb-blue mb-4"></div>
          <h1 class="text-2xl font-bold text-mb-dark mb-2">Signing you in...</h1>
          <p class="text-gray-500">Please wait</p>
        </div>
      }
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private oauth = inject(OAuthService);
  private notification = inject(NotificationService);

  error = signal<string | null>(null);

  ngOnInit(): void {
    // Провайдер берётся из route data — все три маршрута ведут в этот компонент
    const provider = this.route.snapshot.data['provider'] as string;
    const params = this.route.snapshot.queryParams;

    if (params['error']) {
      this.error.set(params['error_description'] || 'Access was denied by the provider.');
      return;
    }

    const code = params['code'];
    if (!provider || !code) {
      this.error.set('The provider did not return an authorization code.');
      return;
    }

    // Несовпадение state означает подложенный редирект — код не отправляем
    if (!this.oauth.consumeState(params['state'])) {
      this.error.set('Security check failed. Please start the sign-in again.');
      return;
    }

    this.exchangeCode(provider, code);
  }

  private exchangeCode(provider: string, code: string): void {
    this.http.post<{ token: string; user: any }>(
      `${environment.apiUrl}/api/auth/oauth2/${provider}`,
      { code, redirect_uri: this.oauth.redirectUri(provider) }
    ).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.notification.success('Signed in successfully');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not complete sign-in. Please try again.');
      }
    });
  }
}
