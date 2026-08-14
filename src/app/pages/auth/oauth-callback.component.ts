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
    this.route.queryParams.subscribe(params => {
      const code = params['code'];
      const provider = this.getProvider();

      if (code) {
        this.exchangeCodeForToken(provider, code);
      } else {
        this.router.navigate(['/register']);
      }
    });
  }

  private getProvider(): string {
    const path = this.router.routerState.root.component?.constructor.name || '';
    if (path.includes('google')) return 'google';
    if (path.includes('facebook')) return 'facebook';
    if (path.includes('apple')) return 'apple';
    return 'unknown';
  }

  private exchangeCodeForToken(provider: string, code: string): void {
    this.http.post(`${environment.apiUrl}/api/auth/oauth2/${provider}`, { code }).subscribe({
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
