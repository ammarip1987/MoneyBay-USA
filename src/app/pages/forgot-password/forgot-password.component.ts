import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto px-4 py-12 min-page">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h1 class="text-3xl font-bold text-mb-dark mb-6 text-center">Forgot Password</h1>
        <p class="text-gray-600 text-sm mb-6 text-center">
          Enter your email and we'll send a password reset link.
        </p>

        @if (sent()) {
          <div class="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 text-sm">
            If an account exists, a reset link was sent. Check your email.
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">Email</label>
              <input type="email" [(ngModel)]="email" name="email" class="form-input" required>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loading()">
              {{ loading() ? 'Sending...' : 'Send Reset Link' }}
            </button>
          </form>
        }

        <p class="text-center text-sm text-gray-600 mt-6">
          <a routerLink="/login" class="text-mb-blue hover:underline">← Back to log in</a>
        </p>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  private api = inject(ApiService);
  private notification = inject(NotificationService);

  email = '';
  loading = signal(false);
  sent = signal(false);

  onSubmit(): void {
    this.loading.set(true);
    this.api.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.sent.set(true);
        this.notification.success('Reset link sent to your email');
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Failed to send reset link');
      }
    });
  }
}
