import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-md mx-auto px-4 py-12">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <h1 class="text-3xl font-bold text-mb-dark mb-6 text-center">Reset Password</h1>

        @if (!token()) {
          <div class="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
            Invalid or missing reset token.
            <a routerLink="/forgot-password" class="text-mb-blue hover:underline block mt-2">Request a new link</a>
          </div>
        } @else {
          <form (ngSubmit)="onSubmit()">
            <div class="form-group">
              <label class="form-label">New Password</label>
              <input type="password" [(ngModel)]="password" name="password" class="form-input" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label">Confirm Password</label>
              <input type="password" [(ngModel)]="confirmPassword" name="confirm" class="form-input" required>
            </div>
            <button type="submit" class="btn btn-primary w-full mt-4" [disabled]="loading()">
              {{ loading() ? 'Resetting...' : 'Reset Password' }}
            </button>
          </form>
        }
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);

  token = signal<string | null>(null);
  password = '';
  confirmPassword = '';
  loading = signal(false);

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
  }

  onSubmit(): void {
    if (this.password !== this.confirmPassword) {
      this.notification.error('Passwords do not match');
      return;
    }
    if (!this.token()) return;

    this.loading.set(true);
    this.api.resetPassword(this.token()!, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success('Password reset. You can now log in.');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.error(err?.error?.message || 'Failed to reset password');
      }
    });
  }
}
