import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface PricingTier {
  hours: number;
  price: number;
  popular?: boolean;
  label: string;
}

@Component({
  selector: 'app-promote',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-12 min-page">
      <div class="text-center mb-12">
        @if (justPosted()) {
          <!-- Приход сразу после публикации: сначала подтверждение, потом
               предложение — иначе выглядит как условие, а не как выбор -->
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6">
            <i class="fas fa-circle-check"></i> Your listing is live
          </div>
          <h1 class="text-4xl font-bold text-mb-dark mb-4">Want more people to see it?</h1>
          <p class="text-gray-600 text-lg">Boosted listings sit at the top of the feed and their category</p>
        } @else {
          <h1 class="text-4xl font-bold text-mb-dark mb-4">Boost Your Listing</h1>
          <p class="text-gray-600 text-lg">Boosted listings sit at the top of the feed and their category</p>
        }
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-6 text-sm max-w-2xl mx-auto">{{ error() }}</div>
      }

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        @for (tier of tiers; track tier.hours) {
          <div class="bg-white rounded-2xl shadow-lg p-8 border-2 relative"
               [class.border-mb-blue]="tier.popular"
               [class.border-gray-200]="!tier.popular">
            @if (tier.popular) {
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 bg-mb-blue text-white text-xs font-bold px-4 py-1 rounded-full">
                Most Popular
              </div>
            }

            <h3 class="text-2xl font-bold text-mb-dark mb-2">{{ tier.label }}</h3>
            <p class="text-gray-600 mb-6">{{ tier.hours }} hours of top placement</p>

            <div class="mb-6">
              <span class="text-4xl font-bold text-mb-blue">\${{ tier.price }}</span>
            </div>

            <ul class="space-y-2 mb-8 text-sm">
              <li class="flex items-start">
                <i class="fas fa-check text-mb-green mr-2 mt-1"></i>
                <span>Shown in Hot offers on the home page</span>
              </li>
              <li class="flex items-start">
                <i class="fas fa-check text-mb-green mr-2 mt-1"></i>
                <span>Top of category for {{ tier.hours }}h</span>
              </li>
              <li class="flex items-start">
                <i class="fas fa-check text-mb-green mr-2 mt-1"></i>
                <span>Highlighted "BOOSTED" badge</span>
              </li>
              <li class="flex items-start">
                <i class="fas fa-check text-mb-green mr-2 mt-1"></i>
                <span>Stays on top the whole time</span>
              </li>
            </ul>

            <button (click)="purchase(tier)"
                    class="w-full btn"
                    [class.btn-primary]="tier.popular"
                    [class.btn-secondary]="!tier.popular"
                    [disabled]="loading()">
              {{ loading() ? '...' : 'Boost Now' }}
            </button>
          </div>
        }
      </div>

      <div class="text-center mt-8">
        <button (click)="skip()" class="text-gray-600 hover:text-mb-blue text-sm underline">
          {{ justPosted() ? 'Skip for now' : 'Back to my listing' }}
        </button>
      </div>

      <p class="text-center text-xs text-gray-500 mt-6">
        Payment processed by Stripe. No subscription, one-time charge.
      </p>
    </div>
  `
})
export class PromoteComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  listingId = signal(0);
  /** Пришли сразу после публикации: заголовок и надпись на кнопке иные. */
  justPosted = signal(false);
  loading = signal(false);
  error = signal<string | null>(null);

  tiers: PricingTier[] = [
    { hours: 24, price: 1.99, label: '24h Boost' },
    { hours: 48, price: 3.49, label: '48h Boost', popular: true },
    { hours: 72, price: 4.99, label: '72h Boost' }
  ];

  ngOnInit(): void {
    this.listingId.set(Number(this.route.snapshot.paramMap.get('id')));
    this.justPosted.set(this.route.snapshot.queryParamMap.get('posted') === '1');
  }

  /** Пропустить: объявление уже опубликовано, продвижение можно взять позже. */
  skip(): void {
    this.router.navigate(['/listing', this.listingId()]);
  }

  purchase(tier: PricingTier): void {
    if (!this.listingId()) return;
    this.loading.set(true);
    this.error.set(null);
    this.api.createBoostCheckout(this.listingId(), tier.hours).subscribe({
      next: (res) => {
        if (res.checkout_url) {
          window.location.href = res.checkout_url;
        } else {
          this.loading.set(false);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to start checkout');
      }
    });
  }
}
