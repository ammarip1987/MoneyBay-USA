import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Listing } from '../../models/listing.model';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-listing-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="card-hover relative group"
         [class.ring-2]="listing.is_featured"
         [class.ring-mb-blue]="listing.is_featured">

      <!-- Price Badge (Top Left) -->
      <span class="absolute top-0 left-0 text-mb-green font-bold text-xs z-10 bg-white px-2 py-1">
        \${{ listing.price | number:'1.0-0' }}
      </span>

      <!-- Favorite Button (Top Right) -->
      @if (auth.isAuthenticated()) {
        <button class="absolute top-2 right-2 text-2xl z-10 transition"
                style="color: #FFD700;"
                (click)="toggleFavorite($event)">
          {{ isFavorited() ? '★' : '☆' }}
        </button>
      }

      <!-- Promoted / Featured badges (Top Right Below Favorite) -->
      @if (isPromoted()) {
        <span class="absolute top-12 right-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold z-10">TOP</span>
      }
      @if (listing.is_featured) {
        <span class="absolute top-12 right-2 text-2xl z-10">⭐</span>
      }

      <!-- Image carousel -->
      @if (listing.images && listing.images.length > 0) {
        <a [routerLink]="['/listing', listing.id]" class="block overflow-hidden">
          <div class="relative bg-gray-100 h-64 cursor-pointer">
            <img [src]="getImageUrl(listing.images[currentImage()])"
                 [alt]="listing.title"
                 class="w-full h-full object-cover transition-opacity duration-300"
                 loading="lazy"
                 decoding="async">

            @if (listing.images.length > 1) {
              <button (click)="prevImage($event)"
                      class="absolute left-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-11 h-11 rounded-full flex items-center justify-center z-10 transition">
                <i class="fas fa-chevron-left"></i>
              </button>
              <button (click)="nextImage($event)"
                      class="absolute right-0 top-1/2 -translate-y-1/2 bg-black/60 hover:bg-black/80 text-white w-11 h-11 rounded-full flex items-center justify-center z-10 transition">
                <i class="fas fa-chevron-right"></i>
              </button>

              <!-- Indicators on image -->
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 flex justify-center gap-2 z-10">
                @for (img of listing.images; track $index) {
                  <button (click)="setImage($index, $event)"
                          class="carousel-dot w-2.5 h-2.5 rounded-full transition-all cursor-pointer"
                          [class.bg-mb-green]="currentImage() === $index"
                          [class.scale-110]="currentImage() === $index"
                          [class.opacity-100]="currentImage() === $index"
                          [class.bg-gray-300]="currentImage() !== $index"
                          [class.opacity-40]="currentImage() !== $index"
                          [class.scale-100]="currentImage() !== $index">
                  </button>
                }
              </div>
            }
          </div>
        </a>
      } @else {
        <a [routerLink]="['/listing', listing.id]" class="block overflow-hidden bg-gray-100 h-64">
          <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <span class="text-center">
              <p class="text-lg font-medium">📷</p>
              <p class="text-sm">No photo</p>
            </span>
          </div>
        </a>
      }

      <!-- Info -->
      <a [routerLink]="['/listing', listing.id]" class="block p-4 hover:bg-gray-50 transition">
        <h3 class="font-bold text-mb-dark text-lg mb-2 line-clamp-2">{{ listing.title }}</h3>
        <p class="text-sm text-gray-600 mb-2 line-clamp-1">
          {{ listing.location }}@if (listing.area) { · {{ listing.area }} }
        </p>
        <p class="text-xs text-gray-500">{{ listing.created_at | date:'MM/dd/yyyy' }}</p>
      </a>
    </div>
  `
})
export class ListingCardComponent {
  @Input() listing!: Listing;

  auth = inject(AuthService);
  private api = inject(ApiService);

  currentImage = signal(0);
  isFavorited = signal(false);

  ngOnInit(): void {
    this.isFavorited.set(this.listing.is_favorited || false);
  }

  isPromoted(): boolean {
    if (!this.listing.promoted_until) return false;
    return new Date(this.listing.promoted_until) > new Date();
  }

  getImageUrl(image: string): string {
    return this.api.imageUrl(image);
  }

  prevImage(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const len = this.listing.images.length;
    this.currentImage.update(i => (i - 1 + len) % len);
  }

  nextImage(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    const len = this.listing.images.length;
    this.currentImage.update(i => (i + 1) % len);
  }

  setImage(index: number, e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.currentImage.set(index);
  }

  toggleFavorite(e: Event): void {
    e.preventDefault();
    e.stopPropagation();
    this.api.toggleFavorite(this.listing.id).subscribe({
      next: (res) => this.isFavorited.set(res.liked)
    });
  }
}
