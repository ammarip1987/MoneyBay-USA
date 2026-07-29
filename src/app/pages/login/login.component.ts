import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RecaptchaModule } from 'ng-recaptcha';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RecaptchaModule],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div class="text-center mb-8">
            <div class="w-16 h-16 bg-gradient-to-br from-mb-blue to-mb-cyan rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md">
              <i class="fas fa-sign-in-alt text-white text-2xl"></i>
            </div>
            <h1 class="text-3xl font-bold text-mb-dark">Welcome back</h1>
            <p class="text-gray-500 text-sm mt-2">Sign in to continue to MoneyBay</p>
          </div>

          @if (error()) {
            <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm flex items-start gap-2">
              <i class="fas fa-exclamation-circle mt-0.5"></i>
              <span>{{ error() }}</span>
            </div>
          }

          <form (ngSubmit)="onSubmit()" class="space-y-4">
            <div>
              <label class="form-label">
                <i class="fas fa-envelope text-mb-blue mr-2"></i>Email
              </label>
              <input type="email" [(ngModel)]="email" name="email" class="form-input" required placeholder="you@example.com">
            </div>

            <div>
              <label class="form-label">
                <i class="fas fa-lock text-mb-blue mr-2"></i>Password
              </label>
              <input type="password" [(ngModel)]="password" name="password" class="form-input" required placeholder="••••••••">
            </div>

            <div class="flex justify-end">
              <a routerLink="/forgot-password" class="text-sm text-mb-blue hover:underline">Forgot password?</a>
            </div>

            @if (isBrowser) {
              <div class="flex justify-center">
                <re-captcha [siteKey]="siteKey" (resolved)="onCaptchaResolved($event)"></re-captcha>
              </div>
            }

            <button type="submit"
                    class="w-full bg-mb-blue hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    [disabled]="loading() || (isBrowser && !captchaToken())">
              {{ loading() ? 'Logging in...' : 'Log in' }}
            </button>
          </form>

          <div class="text-center text-sm text-gray-600 mt-6 pt-6 border-t border-gray-100">
            New here? <a routerLink="/register" class="text-mb-blue hover:underline font-medium">Create an account</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private platformId = inject(PLATFORM_ID);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);
  captchaToken = signal<string | null>(null);
  siteKey = environment.recaptchaSiteKey;
  isBrowser = isPlatformBrowser(this.platformId);

  onCaptchaResolved(token: string | null): void {
    this.captchaToken.set(token);
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.auth.login(this.email, this.password, this.captchaToken() || undefined).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success('Welcome back!');
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Invalid email or password');
        this.captchaToken.set(null);
      }
    });
  }
}
