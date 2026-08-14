import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

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

          <div class="mt-6 pt-6 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center mb-4">Or continue with</p>
            <div class="grid grid-cols-3 gap-3">
              <button type="button" (click)="loginWithGoogle()"
                      class="py-3 px-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                      [disabled]="loading()">
                <span class="text-lg">🔵</span> Google
              </button>
              <button type="button" (click)="loginWithFacebook()"
                      class="py-3 px-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                      [disabled]="loading()">
                <span class="text-lg">f</span> Facebook
              </button>
              <button type="button" (click)="loginWithApple()"
                      class="py-3 px-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm font-medium text-gray-700"
                      [disabled]="loading()">
                <span class="text-lg">🍎</span> Apple
              </button>
            </div>
          </div>

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

  username = '';
  email = '';
  password = '';
  city = '';
  loading = signal(false);
  error = signal<string | null>(null);

  loginWithGoogle(): void {
    const clientId = 'YOUR_GOOGLE_CLIENT_ID';
    const redirectUri = window.location.origin + '/auth/google/callback';
    const scope = 'openid email profile';
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    window.location.href = url;
  }

  loginWithFacebook(): void {
    const appId = 'YOUR_FACEBOOK_APP_ID';
    const redirectUri = window.location.origin + '/auth/facebook/callback';
    const scope = 'email,public_profile';
    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}`;
    window.location.href = url;
  }

  loginWithApple(): void {
    const teamId = 'YOUR_APPLE_TEAM_ID';
    const clientId = 'YOUR_APPLE_SERVICE_ID';
    const redirectUri = window.location.origin + '/auth/apple/callback';
    const url = `https://appleid.apple.com/auth/authorize?client_id=${clientId}&team_id=${teamId}&redirect_uri=${redirectUri}&response_type=code`;
    window.location.href = url;
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
