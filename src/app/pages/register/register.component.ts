import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { OAuthService, OAuthProvider } from '../../services/oauth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-mb-blue to-mb-cyan rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md">
              <i class="fas fa-user-plus text-white text-2xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-mb-dark">Create account</h1>
            <p class="text-gray-500 text-sm mt-2">Join MoneyBay marketplace</p>
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
              <i class="fas fa-exclamation-circle mt-0.5"></i>
              <span>{{ error() }}</span>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="form-label"><i class="fas fa-user text-mb-blue mr-2"></i>Username</label>
              <input type="text" [(ngModel)]="username" name="username" class="form-input" required minlength="3" placeholder="johndoe">
            </div>

            <div>
              <label class="form-label"><i class="fas fa-envelope text-mb-blue mr-2"></i>Email</label>
              <input type="email" [(ngModel)]="email" name="email" class="form-input" required placeholder="you@example.com">
            </div>

            <div>
              <label class="form-label"><i class="fas fa-lock text-mb-blue mr-2"></i>Password</label>
              <input type="password" [(ngModel)]="password" name="password" class="form-input" required minlength="6" placeholder="At least 6 characters">
            </div>

            <div>
              <label class="form-label"><i class="fas fa-map-marker-alt text-mb-blue mr-2"></i>City</label>
              <input type="text" [(ngModel)]="city" name="city" class="form-input" placeholder="Los Angeles, CA">
            </div>

            <button type="submit"
                    class="w-full bg-mb-blue hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="loading()">
              {{ loading() ? 'Creating account...' : 'Create account' }}
            </button>
          </form>

          @if (providers().length > 0) {
            <div class="mt-6 pt-6 border-t border-gray-200">
              <p class="text-xs text-gray-500 text-center mb-4">Or continue with</p>
              <div class="space-y-3">
                @for (p of providers(); track p.provider) {
                  <button type="button" (click)="startOAuth(p)" [disabled]="loading()"
                          class="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3 text-sm font-medium text-gray-800 disabled:opacity-50">
                    <i [class]="iconOf(p.provider)"></i>
                    {{ oauth.label(p.provider) }}
                  </button>
                }
              </div>
            </div>
          }

          <p class="text-xs text-gray-500 mt-4 text-center">
            By signing up you agree to our
            <a routerLink="/terms" class="text-mb-blue hover:underline">Terms</a> and
            <a routerLink="/privacy" class="text-mb-blue hover:underline">Privacy Policy</a>.
          </p>

          <div class="text-center text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
            Already registered? <a routerLink="/login" class="text-mb-blue hover:underline font-medium">Log in</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  oauth = inject(OAuthService);

  username = '';
  email = '';
  password = '';
  city = '';
  loading = signal(false);
  error = signal<string | null>(null);

  providers = signal<OAuthProvider[]>([]);

  private readonly icons: Record<string, string> = {
    google: 'fab fa-google text-[#4285F4]',
    facebook: 'fab fa-facebook text-[#1877F2]',
    apple: 'fab fa-apple text-black'
  };

  constructor() {
    this.oauth.providers$.subscribe(list => this.providers.set(list));
  }

  iconOf(provider: string): string {
    return this.icons[provider] || 'fas fa-right-to-bracket';
  }

  startOAuth(p: OAuthProvider): void {
    this.oauth.start(p);
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.register({
      email: this.email,
      username: this.username,
      password: this.password,
      city: this.city || undefined
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success('Account created. Welcome!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Registration failed');
      }
    });
  }
}
