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
    <!-- Фон под объявлениями на всю ширину окна и вплотную к подвалу.
         Отрицательные отступы гасят поля main со всех сторон, а снизу ещё и
         mt-20 подвала: он задан снаружи, в границы блока не входит, и под
         фоном оставалась белая полоса в его высоту. Ширина берётся от края
         main до края окна, поэтому полоса прокрутки её не сдвигает -->
    <div class="min-page pt-8 pb-8"
         style="background-color: rgb(0, 157, 255); margin: -2rem calc(50% - 50vw) calc(-2rem - 5rem);">
    <div class="max-w-7xl mx-auto px-4">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">My Favorites</h1>

      @if (favorites().length > 0) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
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
        <div class="text-center py-12 text-white">Loading...</div>
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
