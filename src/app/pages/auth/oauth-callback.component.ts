import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  template: `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-mb-blue mb-4"></div>
        <h1 class="text-2xl font-bold text-mb-dark mb-2">Signing you in...</h1>
        <p class="text-gray-500">Please wait</p>
      </div>
    </div>
  `
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  ngOnInit(): void {
    // Провайдер берётся из route data — все три маршрута используют этот компонент
    const provider = this.route.snapshot.data['provider'] as string;

    this.route.queryParams.subscribe(params => {
      const accessToken = params['access_token'];
      const idToken = params['id_token'];

      if (!provider || (!accessToken && !idToken)) {
        this.router.navigate(['/register']);
        return;
      }
      this.exchangeToken(provider, { access_token: accessToken, id_token: idToken });
    });
  }

  private exchangeToken(provider: string, body: Record<string, string>): void {
    this.http.post(`${environment.apiUrl}/api/auth/oauth2/${provider}`, body).subscribe({
      next: (response: any) => {
        this.auth.setSession(response);
        this.router.navigate(['/']);
      },
      error: () => {
        this.router.navigate(['/register']);
      }
    });
  }
}
