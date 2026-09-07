import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Listing } from '../../models/listing.model';
import { ListingCardComponent } from '../../components/listing-card/listing-card.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent],
  template: `
    <div class="min-page">
    <!-- Синяя полоса за заголовком на всю ширину окна: отрицательные отступы
         выводят её за пределы обёртки, ограниченной по ширине. Заголовок на
         ней тёмный, а карточки ниже остаются на светлом -->
    <div class="-mt-8 mb-8 px-4 py-10 w-screen relative left-1/2 -translate-x-1/2"
         style="background-color: rgb(145, 178, 186);">
      <h1 class="max-w-7xl mx-auto text-3xl font-bold text-mb-dark">My Favorites</h1>
    </div>

    <div class="max-w-7xl mx-auto px-4 pb-8">
      @if (favorites().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (listing of favorites(); track listing.id) {
            <app-listing-card [listing]="listing"></app-listing-card>
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
        <div class="text-center py-12 text-gray-500">Loading...</div>
      }
    </div>
    </div>
  `
})
export class FavoritesComponent implements OnInit {
  private api = inject(ApiService);

  favorites = signal<Listing[]>([]);
  // Начинаем с true: иначе пустое состояние мелькает до первого запроса
  loading = signal(true);

  ngOnInit(): void {
    // Попадание в кэш отдаётся синхронно: подъём флага вставил бы заглушки
    // на один тик, и список мелькал бы при каждом входе
    this.loading.set(!this.api.hasCached('favorites'));
    this.api.getFavorites().subscribe({
      next: (data) => {
        this.favorites.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.favorites.set([]);
        this.loading.set(false);
      }
    });
  }
}
