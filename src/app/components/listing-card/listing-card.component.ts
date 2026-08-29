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
    <!-- h-full и колонка: карточка занимает всю высоту ячейки сетки, чтобы
         блок описания мог растянуться и прижать дату к низу -->
    <div class="card-hover relative group h-full flex flex-col"
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
        <a [routerLink]="['/listing', listing.id]" [state]="{ listing: listing }" class="block overflow-hidden">
          <div class="relative h-64 cursor-pointer">
            <img [src]="getImageUrl(listing.images[currentImage()])"
                 [alt]="listing.title"
                 class="w-full h-full object-cover"
                 loading="lazy"
                 decoding="async"
                 width="600"
                 height="450">

            @if (listing.images.length > 1) {
              <!-- Стрелки без подложки: тень делает их различимыми и на светлой,
                   и на тёмной фотографии -->
              <button (click)="prevImage($event)"
                      class="absolute left-0 top-1/2 -translate-y-1/2 text-white w-11 h-11 flex items-center justify-start pl-1 z-10 transition drop-shadow-lg hover:scale-110">
                <i class="fas fa-chevron-left text-xl"></i>
              </button>
              <button (click)="nextImage($event)"
                      class="absolute right-0 top-1/2 -translate-y-1/2 text-white w-11 h-11 flex items-center justify-end pr-1 z-10 transition drop-shadow-lg hover:scale-110">
                <i class="fas fa-chevron-right text-xl"></i>
              </button>

            }
          </div>
        </a>
      } @else {
        <a [routerLink]="['/listing', listing.id]" [state]="{ listing: listing }" class="block overflow-hidden bg-gray-100 h-64">
          <div class="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
            <span class="text-center">
              <p class="text-lg font-medium">📷</p>
              <p class="text-sm">No photo</p>
            </span>
          </div>
        </a>
      }

      <!-- Указатели карусели: под фотографией, перед описанием. Поверх снимка
           они терялись на пёстром фоне. -->
      @if (listing.images && listing.images.length > 1) {
        <div class="flex gap-3 px-4 pt-3">
          @for (img of listing.images; track $index) {
            <button (click)="setImage($index, $event)"
                    class="carousel-dot w-1.5 h-1.5 rounded-full cursor-pointer"
                    [class.bg-mb-green]="currentImage() === $index"
                    [class.opacity-100]="currentImage() === $index"
                    [class.bg-gray-300]="currentImage() !== $index"
                    [class.opacity-40]="currentImage() !== $index"
                    [attr.aria-label]="'Image ' + ($index + 1)">
            </button>
          }
        </div>
      }

      <!-- Info: колонка, дата прижата к низу. Заголовок занимает одну или две
           строки, и без этого дата у соседних карточек стояла бы на разной
           высоте. -->
      <a [routerLink]="['/listing', listing.id]" [state]="{ listing: listing }" class="flex flex-col flex-1 px-4 pt-2 pb-4 hover:bg-gray-50 transition">
        <h3 class="font-bold text-mb-dark text-lg mb-2 line-clamp-2">{{ listing.title }}</h3>
        <p class="text-sm text-gray-600 mb-2 line-clamp-1">
          {{ listing.location }}@if (listing.area) { · {{ listing.area }} }
        </p>
        <p class="text-xs text-gray-500 mt-auto">{{ postedOn() }}</p>
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
  /** Загрузилось ли изображение: до этого видна серая подложка. */

  ngOnInit(): void {
    this.isFavorited.set(this.listing.is_favorited || false);
  }

  /**
   * Дата публикации строкой. DatePipe на нечитаемом значении бросает ошибку и
   * гасит всю карточку — оставались белые рамки без заголовка и цены. Здесь
   * разбор идёт сам, и при неудаче поле просто пустует.
   */
  postedOn(): string {
    const raw = this.listing.created_at;
    if (!raw) return '';
    const d = new Date(raw);
    if (isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getMonth() + 1)}/${p(d.getDate())}/${d.getFullYear()}`;
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
