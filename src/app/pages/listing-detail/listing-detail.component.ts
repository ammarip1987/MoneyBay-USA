import { Component, OnInit, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService, SimilarListings } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';
import { Listing } from '../../models/listing.model';
import { ListingCardComponent } from '../../components/listing-card/listing-card.component';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent, FormsModule],
  template: `
    @if (listing()) {
      <div class="max-w-6xl mx-auto px-4 py-8 min-page">
        <a href="/" (click)="goBackToListings($event)" class="text-mb-blue hover:underline mb-4 inline-block">← Back to listings</a>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-none">
            <div class="flex flex-col gap-px rounded-none">
              <div class="bg-gray-100 relative group rounded-none" style="height: 361px; width: 100%; overflow: hidden !important;">
                @if (listing()!.images && listing()!.images.length > 0) {
                  <img [src]="getImageUrl(listing()!.images[currentImage()])"
                       [alt]="listing()!.title"
                       (click)="openLightbox(currentImage())"
                       class="w-full h-full object-cover cursor-zoom-in transition-opacity duration-300 !rounded-none"
                       loading="eager"
                       fetchpriority="high"
                       decoding="async">
                  @if (listing()!.images.length > 1) {
                    <button (click)="prevImage()" class="absolute left-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 w-6 h-24 flex items-center justify-start z-10 border-none cursor-pointer" style="background-color: rgba(255, 255, 255, 0.8); color: rgb(41, 45, 51); border-top-right-radius: 8px; border-bottom-right-radius: 8px;">
                      <svg width="20" height="28" viewBox="0 0 20 32" fill="none"><path d="M16 4L4 16L16 28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <button (click)="nextImage()" class="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 w-6 h-24 flex items-center justify-end z-10 border-none cursor-pointer" style="background-color: rgba(255, 255, 255, 0.8); color: rgb(41, 45, 51); border-top-left-radius: 8px; border-bottom-left-radius: 8px;">
                      <svg width="20" height="28" viewBox="0 0 20 32" fill="none"><path d="M4 4L16 16L4 28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </button>
                    <div class="absolute left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition w-full" style="top: 0;">
                      <div class="font-semibold w-full" style="background-color: rgba(255, 255, 255, 0.4); padding: 4px 8px; color: rgb(41, 45, 51); font-size: 0.78rem; display: flex; align-items: center; justify-content: center; line-height: 1;">
                        image&nbsp;<span>{{ currentImage() + 1 }}</span>&nbsp;of {{ listing()!.images.length }}
                      </div>
                    </div>

                  }
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-gray-400"><span class="text-6xl">📷</span></div>
                }
              </div>
              @if (listing()!.images && listing()!.images.length > 1) {
                <div class="flex overflow-hidden justify-start bg-white rounded-none flex-wrap">
                  @for (img of listing()!.images; track $index) {
                    <div class="group relative">
                      <button (click)="setImage($index)" (mouseenter)="currentImage.set($index)" class="flex-shrink-0 w-14 h-14 overflow-hidden border-2 transition !rounded-none" [class.border-mb-blue]="currentImage() === $index" [class.border-gray-300]="currentImage() !== $index">
                        <img [src]="getImageUrl(img)" [alt]="'Thumbnail ' + ($index + 1)" class="w-full h-full object-cover !rounded-none">
                      </button>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="p-8">
              <div class="flex justify-between items-start mb-4">
                <h1 class="text-3xl font-bold text-mb-dark">{{ listing()!.title }}</h1>
                @if (signedIn()) {
                  <button (click)="toggleFavorite()" class="text-2xl bg-white/80 hover:bg-white rounded-lg p-2 transition" [style.color]="isFavorited() ? '#FFD700' : ''">
                    {{ isFavorited() ? '★' : '☆' }}
                  </button>
                }
              </div>
              <p class="text-4xl font-bold text-mb-blue mb-6">\${{ listing()!.price | number:'1.0-2' }}</p>

              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <p class="text-gray-600">
                  <i class="fas fa-map-marker-alt mr-2 text-mb-blue"></i>{{ listing()!.location }}
                  @if (listing()!.area) {
                    <span class="text-gray-500"> · {{ listing()!.area }}</span>
                  }
                </p>
                <a [href]="googleMapsUrl()"
                   target="_blank"
                   rel="noopener noreferrer"
                   class="inline-flex items-center gap-1.5 text-mb-blue hover:text-blue-700 underline text-sm font-medium">
                  <i class="fas fa-map"></i> google map
                </a>
              </div>

              <div class="flex items-center gap-4 text-gray-500 text-sm mb-6">
                <span>{{ listing()!.created_at | date:'MMM d, yyyy' }}</span>
                <span class="flex items-center gap-1">
                  <i class="fas fa-eye"></i> {{ listing()!.views || 0 }} views
                </span>
              </div>
              <div class="prose max-w-none mb-6" [innerHTML]="listing()!.description"></div>

              @if (signedIn()) {
                <div class="space-y-3">
                  <a [routerLink]="['/chat', listing()!.user_id]" class="btn btn-primary w-full text-center block">Contact Seller</a>
                  <div class="flex gap-3">
                    <button (click)="toggleFavorite()" class="btn btn-secondary flex-1">{{ isFavorited() ? '★ Saved' : '☆ Save' }}</button>
                    <button (click)="openFlagModal()" class="btn btn-secondary flex-1"><i class="fas fa-flag mr-1"></i>Flag</button>
                  </div>
                </div>
              } @else {
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                  <a routerLink="/login" class="text-mb-blue hover:underline font-bold">Log in</a> to contact seller or save this listing.
                </div>
              }

              <!-- Flag Modal -->
              @if (flagModalOpen()) {
                <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeFlagModal()">
                  <div class="bg-white rounded-lg max-w-md w-full p-6 shadow-lg" (click)="$event.stopPropagation()">
                    <div class="flex justify-between items-center mb-4">
                      <h2 class="text-xl font-bold text-mb-dark">Flag Listing</h2>
                      <button (click)="closeFlagModal()" class="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
                    </div>

                    @if (flagSuccess()) {
                      <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center mb-4">
                        <p class="text-green-700 font-semibold"><i class="fas fa-check-circle mr-2"></i>Thank you for reporting</p>
                        <p class="text-green-600 text-sm mt-1">Our team will review this listing</p>
                      </div>
                    } @else {
                      <div class="space-y-4">
                        <div>
                          <label class="block text-sm font-semibold text-gray-700 mb-2">Reason for reporting</label>
                          <select [(ngModel)]="selectedReason" class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mb-blue">
                            <option value="">Select a reason...</option>
                            @for (reason of flagReasons; track reason.value) {
                              <option [value]="reason.value">{{ reason.label }}</option>
                            }
                          </select>
                        </div>

                        <div>
                          <label class="block text-sm font-semibold text-gray-700 mb-2">Description (optional)</label>
                          <textarea [(ngModel)]="flagDescription" class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-mb-blue" rows="3" placeholder="Provide details about why you're reporting this listing..."></textarea>
                        </div>

                        <div class="flex gap-3 pt-4">
                          <button (click)="closeFlagModal()" class="flex-1 btn btn-secondary">Cancel</button>
                          <button (click)="submitFlag()" [disabled]="!selectedReason() || flagSubmitting()" class="flex-1 btn btn-primary">
                            @if (flagSubmitting()) {
                              <i class="fas fa-spinner fa-spin mr-1"></i>Submitting...
                            } @else {
                              Submit Flag
                            }
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

        <!-- Lightbox -->
        @if (lightboxOpen()) {
          <div class="fixed inset-0 bg-black/90 flex items-center justify-center" style="z-index: 99999;" (click)="closeLightbox()">
            <button (click)="closeLightbox(); $event.stopPropagation()" class="absolute top-5 right-7 text-white text-4xl cursor-pointer">&times;</button>
            <button (click)="prevImageLightbox(); $event.stopPropagation()" class="absolute left-5 top-1/2 -translate-y-1/2 text-white text-5xl cursor-pointer user-select-none">&#10094;</button>
            <img [src]="getImageUrl(listing()!.images[currentImage()])" class="max-w-5xl max-h-5xl !rounded-none" (click)="$event.stopPropagation()">
            <button (click)="nextImageLightbox(); $event.stopPropagation()" class="absolute right-5 top-1/2 -translate-y-1/2 text-white text-5xl cursor-pointer user-select-none">&#10095;</button>
          </div>
        }

        <!-- Similar Products -->
        @if (similar() && (similar()!.same_location.length > 0 || similar()!.similar_price.length > 0 || similar()!.from_seller.length > 0)) {
          <div class="mt-12 space-y-12">

            @if (similar()!.same_location.length > 0) {
              <section>
                <!-- Стрелки в строке заголовка, справа: не перекрывают карточки
                     и не зависят от высоты ряда -->
                <div class="flex items-center justify-between mb-4 gap-4">
                  <h3 class="text-2xl font-bold text-mb-dark">Similar Products in {{ listing()!.location }}</h3>
                  @if (similar()!.same_location.length > 3) {
                    <div class="hidden md:flex gap-2 flex-none">
                      <button (click)="scrollRow(row1, -300)" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Previous">
                        <i class="fas fa-chevron-left text-sm"></i>
                      </button>
                      <button (click)="scrollRow(row1, 300)" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Next">
                        <i class="fas fa-chevron-right text-sm"></i>
                      </button>
                    </div>
                  }
                </div>
                <div class="flex gap-4 overflow-x-auto scrollbar-bottom pb-4 -mx-2 px-2 snap-x" #row1>
                  @for (item of similar()!.same_location; track item.id) {
                    <div class="flex-none w-64 sm:w-72 snap-start">
                      <app-listing-card [listing]="item"></app-listing-card>
                    </div>
                  }
                </div>
              </section>
            }

            @if (similar()!.similar_price.length > 0) {
              <section>
                <div class="flex items-center justify-between mb-4 gap-4">
                  <h3 class="text-2xl font-bold text-mb-dark">Similar Price Range</h3>
                  @if (similar()!.similar_price.length > 3) {
                    <div class="hidden md:flex gap-2 flex-none">
                      <button (click)="scrollRow(row2, -300)" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Previous">
                        <i class="fas fa-chevron-left text-sm"></i>
                      </button>
                      <button (click)="scrollRow(row2, 300)" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Next">
                        <i class="fas fa-chevron-right text-sm"></i>
                      </button>
                    </div>
                  }
                </div>
                <div class="flex gap-4 overflow-x-auto scrollbar-bottom pb-4 -mx-2 px-2 snap-x" #row2>
                  @for (item of similar()!.similar_price; track item.id) {
                    <div class="flex-none w-64 sm:w-72 snap-start">
                      <app-listing-card [listing]="item"></app-listing-card>
                    </div>
                  }
                </div>
              </section>
            }

            @if (similar()!.from_seller.length > 0) {
              <section>
                <div class="flex items-center justify-between mb-4 gap-4">
                  <h3 class="text-2xl font-bold text-mb-dark">More from this Seller</h3>
                  @if (similar()!.from_seller.length > 3) {
                    <div class="hidden md:flex gap-2 flex-none">
                      <button (click)="scrollRow(row3, -300)" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Previous">
                        <i class="fas fa-chevron-left text-sm"></i>
                      </button>
                      <button (click)="scrollRow(row3, 300)" class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-200 transition" aria-label="Next">
                        <i class="fas fa-chevron-right text-sm"></i>
                      </button>
                    </div>
                  }
                </div>
                <div class="flex gap-4 overflow-x-auto scrollbar-bottom pb-4 -mx-2 px-2 snap-x" #row3>
                  @for (item of similar()!.from_seller; track item.id) {
                    <div class="flex-none w-64 sm:w-72 snap-start">
                      <app-listing-card [listing]="item"></app-listing-card>
                    </div>
                  }
                </div>
              </section>
            }

          </div>
        }
      </div>
    } @else if (loading()) {
      <div class="text-center py-12"><p class="text-gray-500">Loading listing...</p></div>
    } @else {
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">Listing not found</p>
        <a routerLink="/" class="text-mb-blue hover:underline mt-4 inline-block">← Back to home</a>
      </div>
    }
  `
})
export class ListingDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);
  auth = inject(AuthService);

  /**
   * Признак входа для отрисовки. На сервере токена не видно — он в
   * localStorage, — поэтому там применяется метка из cookie. Без этого сервер
   * рисует приглашение войти, а после гидратации на его месте появляются три
   * кнопки: страница подпрыгивает вместе с подвалом.
   */
  private authReady = signal(false);
  signedIn = () => this.authReady() ? this.auth.isAuthenticated() : this.auth.authHint();

  constructor() {
    afterNextRender(() => {
      this.authReady.set(true);

      // Лента подгружается заранее, пока читают объявление: возврат на главную
      // идёт внутри приложения, без участия сервера, и без кэша там ждали бы
      // ответа около секунды со скелетом на экране. Запрос уходит один раз и
      // кладётся в тот же кэш, из которого главная читает.
      this.api.getListings({ page: 1 }).subscribe({ error: () => {} });
    });
  }

  listing = signal<Listing | null>(null);
  loading = signal(false);
  currentImage = signal(0);
  isFavorited = signal(false);
  similar = signal<SimilarListings | null>(null);
  lightboxOpen = signal(false);
  flagModalOpen = signal(false);
  selectedReason = signal('');
  flagDescription = signal('');
  flagSubmitting = signal(false);
  flagSuccess = signal(false);

  flagReasons = [
    { value: 'SPAM', label: 'Spam' },
    { value: 'PROHIBITED_ITEM', label: 'Prohibited Item' },
    { value: 'FRAUD_SCAM', label: 'Fraud or Scam' },
    { value: 'OFFENSIVE_CONTENT', label: 'Offensive Content' },
    { value: 'INVALID_CONTACT', label: 'Invalid Contact' },
    { value: 'DUPLICATE', label: 'Duplicate Listing' },
    { value: 'OTHER', label: 'Other' }
  ];

  /**
   * Объявление, переданное карточкой при переходе. Сверяем id: при возврате
   * назад или переходе на другое объявление в состоянии может остаться чужое.
   */

  /**
   * Возврат в ленту через историю браузера: сохраняет фильтры, страницу и
   * положение прокрутки. Прежняя ссылка вела на «/» и всё это теряла.
   * При заходе по прямой ссылке истории нет — уходим на главную.
   */
  goBackToListings(event: Event): void {
    event.preventDefault();
    if (typeof history !== 'undefined' && history.length > 1) {
      history.back();
    } else {
      this.router.navigateByUrl('/');
    }
  }
  private preloadedListing(id: number): Listing | null {
    if (typeof history === 'undefined') return null;
    const passed = history.state?.listing as Listing | undefined;
    return passed && passed.id === id ? passed : null;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) return;

      this.currentImage.set(0);
      this.similar.set(null);

      // Карточка передаёт объявление через состояние перехода: те же поля,
      // что отдаёт лента. Показываем их сразу, без пустого экрана, а ответ
      // сервера потом обновляет данные на случай, если они устарели.
      //
      // При обновлении страницы ngOnInit выполняется дважды — на сервере и в
      // браузере после гидратации. Во втором проходе history.state пуст, и
      // безусловная запись стёрла бы объявление, отрисованное сервером: на его
      // месте мелькает «Loading listing». Поэтому уже показанное объявление
      // сохраняется, если это то же самое.
      const passed = this.preloadedListing(id);
      const shown = this.listing();
      const alreadyShown = shown !== null && shown.id === id;

      if (passed) {
        this.listing.set(passed);
        this.isFavorited.set(passed.is_favorited || false);
      } else if (!alreadyShown) {
        this.listing.set(null);
      }
      this.loading.set(!passed && !alreadyShown);

      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      this.api.getListing(id).subscribe({
        next: (data) => {
          this.listing.set(data);
          this.isFavorited.set(data.is_favorited || false);
          this.loading.set(false);
          const image = data.images && data.images.length > 0
            ? data.images[0]
            : undefined;
          this.seo.update({
            title: data.title,
            description: (data.description || '').substring(0, 160),
            image,
            type: 'product',
            keywords: [data.title, data.location, 'classifieds', 'marketplace'].filter(Boolean).join(', ')
          });
          this.loadSimilar(id);
        },
        error: () => {
          this.loading.set(false);
          // Данные из карточки не стираем: показанное объявление остаётся,
          // «не найдено» выводим только если показывать нечего
          if (this.listing() === null) {
            this.seo.update({ title: 'Listing not found', noindex: true });
          } else {
            this.loadSimilar(id);
          }
        }
      });
    });
  }

  loadSimilar(id: number): void {
    this.api.getSimilarListings(id).subscribe({
      next: (data) => this.similar.set(data),
      error: () => this.similar.set({ same_location: [], similar_price: [], from_seller: [] })
    });
  }

  scrollRow(element: HTMLElement, offset: number): void {
    element.scrollBy({ left: offset, behavior: 'smooth' });
  }

  googleMapsUrl(): string {
    const l = this.listing();
    if (!l) return '#';
    const parts: string[] = [];
    if (l.location) parts.push(l.location);
    if (l.area) parts.push(l.area);
    const query = encodeURIComponent(parts.join(', '));
    return `https://www.google.com/maps?q=${query}`;
  }

  getImageUrl(image: string): string {
    return this.api.imageUrl(image);
  }

  prevImage(): void {
    const len = this.listing()!.images.length;
    this.currentImage.update(i => (i - 1 + len) % len);
  }

  nextImage(): void {
    const len = this.listing()!.images.length;
    this.currentImage.update(i => (i + 1) % len);
  }

  setImage(index: number): void {
    this.currentImage.set(index);
  }

  toggleFavorite(): void {
    if (!this.listing()) return;
    this.api.toggleFavorite(this.listing()!.id).subscribe({
      next: (res) => this.isFavorited.set(res.liked)
    });
  }

  openLightbox(index: number): void {
    this.currentImage.set(index);
    this.lightboxOpen.set(true);
  }

  closeLightbox(): void {
    this.lightboxOpen.set(false);
  }

  prevImageLightbox(): void {
    if (!this.listing()) return;
    const len = this.listing()!.images.length;
    this.currentImage.update(i => (i - 1 + len) % len);
  }

  nextImageLightbox(): void {
    if (!this.listing()) return;
    const len = this.listing()!.images.length;
    this.currentImage.update(i => (i + 1) % len);
  }

  openFlagModal(): void {
    this.flagModalOpen.set(true);
    this.selectedReason.set('');
    this.flagDescription.set('');
    this.flagSuccess.set(false);
  }

  closeFlagModal(): void {
    this.flagModalOpen.set(false);
    this.selectedReason.set('');
    this.flagDescription.set('');
    this.flagSubmitting.set(false);
    this.flagSuccess.set(false);
  }

  submitFlag(): void {
    if (!this.listing() || !this.selectedReason()) return;

    this.flagSubmitting.set(true);
    const listingId = this.listing()!.id;
    const reason = this.selectedReason();
    const description = this.flagDescription();

    this.api.flagListing(listingId, reason, description).subscribe({
      next: () => {
        this.flagSuccess.set(true);
        this.flagSubmitting.set(false);
        setTimeout(() => {
          this.closeFlagModal();
        }, 2000);
      },
      error: (err) => {
        console.error('Error flagging listing:', err);
        this.flagSubmitting.set(false);
      }
    });
  }
}
