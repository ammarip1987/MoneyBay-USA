import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { ListingCardComponent } from '../../components/listing-card/listing-card.component';
import { Storefront } from '../../models/storefront.model';
import { Listing } from '../../models/listing.model';
import { SeoService } from '../../services/seo.service';

/** Открытая страница магазина: витрина и объявления продавца. */
@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent],
  template: `
    <div class="min-page">
      @if (store()) {
        <!-- Обложка -->
        <div class="h-48 sm:h-64 bg-gradient-to-r from-mb-blue to-mb-cyan -mx-4 mb-0 overflow-hidden">
          @if (store()!.bannerUrl) {
            <img [src]="api.imageUrl(store()!.bannerUrl)" alt="" class="w-full h-full object-cover">
          }
        </div>

        <div class="bg-white rounded-2xl shadow-lg -mt-12 relative z-10 p-6 sm:p-8 mb-8">
          <div class="flex items-start gap-5 flex-wrap">
            <div class="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-mb-blue to-mb-cyan flex items-center justify-center -mt-16 border-4 border-white shadow-md">
              @if (store()!.logoUrl) {
                <img [src]="api.imageUrl(store()!.logoUrl)" alt="" class="w-full h-full object-cover">
              } @else {
                <span class="text-white text-3xl font-bold">{{ store()!.name[0].toUpperCase() }}</span>
              }
            </div>

            <div class="flex-1 min-w-64">
              <h1 class="text-3xl font-bold text-mb-dark mb-1">{{ store()!.name }}</h1>
              <p class="text-gray-600 text-sm mb-3">
                @if (store()!.location) {
                  <i class="fas fa-map-marker-alt mr-1 text-mb-blue"></i>{{ store()!.location }}
                }
                @if (store()!.hours) {
                  <span class="ml-3"><i class="fas fa-clock mr-1 text-mb-blue"></i>{{ store()!.hours }}</span>
                }
              </p>

              @if (store()!.about) {
                <p class="text-gray-700 mb-4 max-w-2xl">{{ store()!.about }}</p>
              }

              <div class="flex gap-3 flex-wrap">
                @if (store()!.phones) {
                  @if (phoneShown()) {
                    <a [href]="'tel:' + store()!.phones" class="btn btn-primary text-sm">
                      <i class="fas fa-phone mr-2"></i>{{ store()!.phones }}
                    </a>
                  } @else {
                    <!-- Номер скрыт до нажатия: открытые телефоны собирают
                         сборщики для рассылок, а в США за это штрафуют -->
                    <button (click)="phoneShown.set(true)" class="btn btn-primary text-sm">
                      <i class="fas fa-phone mr-2"></i>Show Phone
                    </button>
                  }
                }
                @if (store()!.website) {
                  <a [href]="store()!.website" target="_blank" rel="noopener noreferrer"
                     class="btn btn-secondary text-sm">
                    <i class="fas fa-globe mr-2"></i>Website
                  </a>
                }
              </div>

              @if (phoneShown()) {
                <p class="text-xs text-gray-500 mt-3 max-w-2xl">
                  By calling, you agree not to use this number for unsolicited marketing.
                </p>
              }
            </div>
          </div>
        </div>

        <h2 class="text-2xl font-bold text-mb-dark mb-6">
          Listings <span class="text-gray-500 font-normal text-lg">({{ count() }})</span>
        </h2>

        @if (listings().length > 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            @for (l of listings(); track l.id) {
              <app-listing-card [listing]="l"></app-listing-card>
            }
          </div>
        } @else {
          <p class="text-gray-500 py-12 text-center">Nothing listed yet.</p>
        }
      } @else if (loading()) {
        <div class="flex items-center justify-center" style="min-height: 520px;">
          <span class="relative inline-flex items-center justify-center w-16 h-16">
            <span class="absolute inset-0 border-4 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
            <span class="text-2xl font-bold text-mb-blue select-none">M</span>
          </span>
        </div>
      } @else {
        <div class="text-center py-16">
          <p class="text-gray-500 text-lg mb-4">Storefront not found</p>
          <a routerLink="/" class="text-mb-blue hover:underline">← Back to listings</a>
        </div>
      }
    </div>
  `
})
export class ShopComponent implements OnInit {
  api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private seo = inject(SeoService);

  store = signal<Storefront | null>(null);
  listings = signal<Listing[]>([]);
  count = signal(0);
  loading = signal(true);
  phoneShown = signal(false);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) return;

    this.api.getPublicStorefront(slug).subscribe({
      next: (data) => {
        this.store.set(data.storefront);
        this.listings.set(data.listings || []);
        this.count.set(data.listings_count || 0);
        this.loading.set(false);
        this.seo.update({
          title: data.storefront.name,
          description: (data.storefront.about || '').substring(0, 160),
          type: 'website'
        });
      },
      error: () => this.loading.set(false)
    });
  }
}
