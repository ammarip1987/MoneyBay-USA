import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SeoService } from '../../services/seo.service';

type VerifyStatus = 'checking' | 'success' | 'expired' | 'invalid' | 'error';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="max-w-md w-full">
        <div class="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">

          @if (status() === 'checking') {
            <div class="w-20 h-20 rounded-full bg-blue-50 mx-auto mb-6 flex items-center justify-center">
              <span class="inline-block w-10 h-10 border-4 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
            </div>
            <h1 class="text-2xl font-bold text-mb-dark mb-3">Verifying your email...</h1>
            <p class="text-gray-500">This will only take a moment.</p>
          }

          @if (status() === 'success') {
            <div class="w-20 h-20 rounded-full bg-green-50 mx-auto mb-6 flex items-center justify-center">
              <i class="fas fa-check-circle text-5xl text-green-500"></i>
            </div>
            <h1 class="text-2xl font-bold text-mb-dark mb-3">Email Verified!</h1>
            <p class="text-gray-500 mb-8">Your email address has been successfully confirmed.</p>
            <a routerLink="/login" class="btn btn-primary w-full">
              <i class="fas fa-sign-in-alt mr-2"></i> Continue to Login
            </a>
          }

          @if (status() === 'expired') {
            <div class="w-20 h-20 rounded-full bg-orange-50 mx-auto mb-6 flex items-center justify-center">
              <i class="fas fa-clock text-5xl text-orange-500"></i>
            </div>
            <h1 class="text-2xl font-bold text-mb-dark mb-3">Link Expired</h1>
            <p class="text-gray-500 mb-8">This verification link has expired. Verification links are valid for 24 hours.</p>
            <button (click)="resend()" [disabled]="resending()" class="btn btn-primary w-full mb-3">
              @if (resending()) {
                <i class="fas fa-spinner fa-spin mr-2"></i> Sending...
              } @else {
                <i class="fas fa-paper-plane mr-2"></i> Resend Verification Email
              }
            </button>
            <a routerLink="/login" class="text-mb-blue hover:underline text-sm">Back to login</a>
          }

          @if (status() === 'invalid') {
            <div class="w-20 h-20 rounded-full bg-red-50 mx-auto mb-6 flex items-center justify-center">
              <i class="fas fa-times-circle text-5xl text-red-500"></i>
            </div>
            <h1 class="text-2xl font-bold text-mb-dark mb-3">Invalid Link</h1>
            <p class="text-gray-500 mb-8">This verification link is not valid. It may have already been used or is incorrect.</p>
            <a routerLink="/login" class="btn btn-primary w-full mb-3">
              <i class="fas fa-sign-in-alt mr-2"></i> Go to Login
            </a>
            <a routerLink="/contact" class="text-mb-blue hover:underline text-sm">Contact Support</a>
          }

          @if (status() === 'error') {
            <div class="w-20 h-20 rounded-full bg-red-50 mx-auto mb-6 flex items-center justify-center">
              <i class="fas fa-exclamation-triangle text-5xl text-red-500"></i>
            </div>
            <h1 class="text-2xl font-bold text-mb-dark mb-3">Verification Failed</h1>
            <p class="text-gray-500 mb-8">We couldn't verify your email at this time. Please try again later.</p>
            <button (click)="retry()" class="btn btn-primary w-full mb-3">
              <i class="fas fa-redo mr-2"></i> Try Again
            </button>
            <a routerLink="/contact" class="text-mb-blue hover:underline text-sm">Contact Support</a>
          }

        </div>

        <p class="text-center text-xs text-gray-400 mt-6">
          Need help? <a routerLink="/contact" class="text-mb-blue hover:underline">Contact our support team</a>
        </p>
      </div>
    </div>
  `
})
export class VerifyEmailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);

  status = signal<VerifyStatus>('checking');
  resending = signal(false);
  private token: string | null = null;

  ngOnInit(): void {
    this.seo.update({
      title: 'Email Verification',
      description: 'Verify your email address',
      noindex: true
    });

    this.token = this.route.snapshot.queryParamMap.get('token');
    if (!this.token) {
      this.status.set('invalid');
      return;
    }
    this.verify();
  }

  verify(): void {
    this.status.set('checking');
    this.http.post(`${environment.apiUrl}/api/auth/verify-email`, { token: this.token })
      .subscribe({
        next: () => this.status.set('success'),
        error: (err) => {
          const code = err?.error?.code;
          if (code === 'TOKEN_EXPIRED') {
            this.status.set('expired');
          } else if (code === 'TOKEN_INVALID') {
            this.status.set('invalid');
          } else {
            this.status.set('error');
          }
        }
      });
  }

  retry(): void {
    this.verify();
  }

  resend(): void {
    if (!this.token) return;
    this.resending.set(true);
    this.http.post(`${environment.apiUrl}/api/auth/resend-verification`, { token: this.token })
      .subscribe({
        next: () => {
          this.resending.set(false);
          this.status.set('checking');
          setTimeout(() => this.status.set('success'), 1000);
        },
        error: () => this.resending.set(false)
      });
  }
}
