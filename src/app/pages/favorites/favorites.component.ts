import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Listing } from '../../models/listing.model';
import { ListingCardComponent } from '../../components/listing-card/listing-card.component';
import { FavoritesService } from '../../services/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent],
  template: `
    <!-- Фон под объявлениями на всю ширину окна и вплотную к подвалу.
         Отрицательные отступы гасят поля main со всех сторон, а снизу ещё и
         mt-20 подвала: он задан снаружи, в границы блока не входит, и под
         фоном оставалась белая полоса в его высоту. Ширина берётся от края
         main до края окна, поэтому полоса прокрутки её не сдвигает -->
    <div class="min-page pt-8 pb-8"
         style="background-color: rgb(239, 244, 245); margin: -2rem calc(50% - 50vw) calc(-2rem - 5rem);">
    <div class="max-w-7xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">My Favorites</h1>

      @if (favorites().length > 0) {
        <!-- Раскладка на flex, а не на сетке: число карточек в ряду
             подбирается по ширине окна, до пяти, и неполный ряд встаёт
             посередине. Сетка так не умеет — justify-center выравнивает в
             ней всю раскладку целиком, а последний ряд остаётся у левого
             края. Ширина карточки от 170 до 224 пикселей -->
        <div class="flex flex-wrap gap-6 justify-center">
          @for (listing of favorites(); track listing.id) {
            <div class="flex-none w-[170px] sm:w-[200px] lg:w-[224px]">
              <app-listing-card [listing]="listing"></app-listing-card>
            </div>
          }
        </div>
      } @else if (!loading()) {
        <div class="bg-white rounded-2xl shadow p-12 text-center border border-gray-100">
          <span class="text-6xl mb-4 block">⭐</span>
          <h2 class="text-xl font-bold text-mb-dark mb-2">No favorites yet</h2>
          <p class="text-gray-600 mb-6">Save listings you like by clicking the star icon.</p>
          <a routerLink="/" class="btn btn-primary inline-block">Browse listings</a>
        </div>
      } @else {
        <!-- Кружок вместо надписи, как в разделах магазина -->
        <div class="flex items-center justify-center" style="min-height: 520px;">
          <span class="relative inline-flex items-center justify-center w-16 h-16">
            <span class="absolute inset-0 border-4 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
            <span class="text-2xl font-bold text-mb-blue select-none">M</span>
          </span>
        </div>
      }
    </div>
    </div>
  `
})
export class FavoritesComponent implements OnInit {
  private api = inject(ApiService);
  private favoritesService = inject(FavoritesService);

  /** Пришедшие с сервера объявления. Что из них показать, решает favorites(). */
  private loaded = signal<Listing[]>([]);
  // Начинаем с true: иначе пустое состояние мелькает до первого запроса
  loading = signal(true);

  /**
   * Показываются только те, что остались в общем списке опознаний.
   *
   * Прежде страница держала свой набор объявлений, и снятие звезды лишь гасило
   * её: карточка оставалась на месте до перезагрузки.
   */
  favorites = computed(() => {
    const ids = this.favoritesService.favoriteIds();
    return this.loaded().filter(l => ids.has(l.id));
  });

  ngOnInit(): void {
    // Попадание в кэш отдаётся синхронно: подъём флага вставил бы заглушки
    // на один тик, и список мелькал бы при каждом входе
    this.loading.set(!this.api.hasCached('favorites'));
    this.api.getFavorites().subscribe({
      next: (data) => {
        const list = data || [];
        this.loaded.set(list);
        // Опознания берутся из этого же ответа, без второго запроса: иначе
        // звёзды на карточках пустуют, пока общий список не подгрузится
        this.favoritesService.replaceAll(list.map(l => l.id));
        this.loading.set(false);
      },
      error: () => {
        this.loaded.set([]);
        this.loading.set(false);
      }
    });
  }
}
