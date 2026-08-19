import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { User, Listing } from '../../models/listing.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden min-page">
      <!-- Header Card -->
      <div class="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
        <div class="flex flex-col md:flex-row items-start md:items-center gap-8">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <div class="w-32 h-32 bg-gradient-to-br from-mb-blue to-mb-cyan rounded-2xl flex items-center justify-center text-white text-5xl font-bold shadow-md">
              {{ (user()?.email || '?')[0].toUpperCase() }}
            </div>
          </div>

          <!-- Profile Info -->
          <div class="flex-1">
            <h1 class="text-4xl font-bold text-mb-dark mb-2">{{ user()?.username }}</h1>
            <p class="text-gray-600 text-lg mb-4 break-all">{{ user()?.email }}</p>
            <p class="text-gray-500 text-sm mb-6">
              Member since {{ user()?.created_at | date:'longDate' }}
            </p>

            <!-- Action Buttons -->
            <div class="flex flex-wrap gap-2">
              <a routerLink="/edit-profile" class="btn btn-primary flex-1 min-w-[100px] text-xs py-2 px-2">
                <i class="fas fa-edit mr-1"></i> Edit
              </a>
              <a routerLink="/my-listings" class="flex-1 min-w-[100px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition py-2 px-2 text-xs text-center flex items-center justify-center">
                <i class="fas fa-list mr-1"></i> Ads
              </a>
              <a routerLink="/messages" class="flex-1 min-w-[100px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition py-2 px-2 text-xs text-center flex items-center justify-center">
                <i class="fas fa-comments mr-1"></i> Msg
              </a>
              <a routerLink="/favorites" class="flex-1 min-w-[100px] bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition py-2 px-2 text-xs text-center flex items-center justify-center">
                ★ Fav
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-md p-6 border border-blue-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Active Listings</p>
              <p class="text-3xl font-bold text-mb-blue mt-2">{{ myListings().length }}</p>
            </div>
            <i class="fas fa-list text-5xl text-mb-blue opacity-20"></i>
          </div>
        </div>

        <div class="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-2xl shadow-md p-6 border border-cyan-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Total Views</p>
              <p class="text-3xl font-bold text-mb-cyan mt-2">{{ totalViews() }}</p>
            </div>
            <i class="fas fa-eye text-5xl text-mb-cyan opacity-20"></i>
          </div>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl shadow-md p-6 border border-green-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Active</p>
              <p class="text-3xl font-bold text-mb-green mt-2">{{ activeCount() }}</p>
            </div>
            <i class="fas fa-check-circle text-5xl text-mb-green opacity-20"></i>
          </div>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-md p-6 border border-purple-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Profile Score</p>
              <p class="text-3xl font-bold text-purple-600 mt-2">{{ profileScore() }}%</p>
            </div>
            <i class="fas fa-star text-5xl text-purple-600 opacity-20"></i>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Column -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Personal Info -->
          <div class="bg-white rounded-2xl shadow p-6 border border-gray-100">
            <h2 class="text-lg font-bold text-mb-dark mb-4 flex items-center">
              <i class="fas fa-user-circle text-mb-blue mr-2"></i> Personal Info
            </h2>
            <ul class="space-y-4 text-sm">
              <li class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-gray-600">Email</span>
                <span class="font-medium text-gray-800 truncate ml-2">{{ user()?.email }}</span>
              </li>
              <li class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-gray-600">Phone</span>
                <span class="font-medium">
                  @if (user()?.phone) {
                    <a [href]="'tel:' + user()!.phone" class="text-mb-blue hover:underline">{{ user()!.phone }}</a>
                  } @else {
                    <span class="text-gray-400">Not provided</span>
                  }
                </span>
              </li>
              <li class="flex justify-between items-center pb-3 border-b border-gray-100">
                <span class="text-gray-600">City</span>
                <span class="font-medium">{{ user()?.city || 'Not provided' }}</span>
              </li>
              <li class="flex justify-between items-center">
                <span class="text-gray-600">Joined</span>
                <span class="font-medium">{{ user()?.created_at | date:'MM/dd/yyyy' }}</span>
              </li>
            </ul>
          </div>

          <!-- Account Status -->
          <div class="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow p-6 border border-blue-100">
            <h3 class="font-bold text-mb-dark mb-3 flex items-center">
              <i class="fas fa-shield-alt text-mb-blue mr-2"></i> Account Status
            </h3>
            <div class="space-y-2 text-sm">
              <div class="flex items-center">
                <i class="fas fa-check-circle text-mb-green mr-2"></i>
                <span>Email verified</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-check-circle text-mb-green mr-2"></i>
                <span>Active member</span>
              </div>
              @if (user()?.is_admin) {
                <div class="flex items-center">
                  <i class="fas fa-star text-mb-blue mr-2"></i>
                  <span>Administrator</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right Column: My Active Listings -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-2xl shadow border border-gray-100">
            <div class="border-b border-gray-100 px-6 py-4">
              <h2 class="text-xl font-bold text-mb-dark flex items-center">
                <i class="fas fa-list text-mb-blue mr-2"></i> My Active Listings
                <span class="ml-auto text-sm font-normal text-gray-500">{{ myListings().length }} total</span>
              </h2>
            </div>

            <div class="divide-y divide-gray-100">
              @for (listing of myListings().slice(0, 6); track listing.id) {
                <div class="p-4 hover:bg-gray-50 transition">
                  <div class="flex gap-4">
                    <div class="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                      @if (listing.images && listing.images.length > 0) {
                        <img [src]="getImageUrl(listing.images[0])" class="w-full h-full object-cover" [alt]="listing.title" width="80" height="80" loading="lazy" decoding="async">
                      } @else {
                        <div class="w-full h-full flex items-center justify-center text-gray-400">
                          <i class="fas fa-image text-2xl"></i>
                        </div>
                      }
                    </div>

                    <div class="flex-1 min-w-0">
                      <a [routerLink]="['/listing', listing.id]" class="block text-mb-dark font-bold hover:text-mb-blue truncate mb-1">
                        {{ listing.title }}
                      </a>
                      <p class="text-mb-blue font-bold text-lg">\${{ listing.price | number:'1.0-2' }}</p>
                      <p class="text-sm text-gray-500">
                        <i class="fas fa-map-marker-alt mr-1"></i> {{ listing.location }}
                      </p>
                    </div>

                    <div class="flex flex-col gap-1 flex-shrink-0 w-20">
                      <a [routerLink]="['/promote', listing.id]" class="w-full flex items-center justify-center bg-mb-blue hover:bg-blue-700 text-white text-xs py-1 px-2 rounded transition">
                        <i class="fas fa-rocket mr-1"></i> Boost
                      </a>
                      <a [routerLink]="['/edit-listing', listing.id]" class="w-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1 px-2 rounded transition">
                        <i class="fas fa-edit mr-1"></i> Edit
                      </a>
                      <button (click)="deleteListing(listing.id)" class="w-full flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs py-1 px-2 rounded transition">
                        <i class="fas fa-trash-alt mr-1"></i> Del
                      </button>
                    </div>
                  </div>
                </div>
              }

              @if (myListings().length === 0 && !loading()) {
                <div class="p-12 text-center text-gray-500">
                  <i class="fas fa-inbox text-4xl mb-4 block opacity-50"></i>
                  <p>No listings yet</p>
                  <a routerLink="/new-listing" class="btn btn-primary mt-4 inline-block">
                    <i class="fas fa-plus mr-2"></i> Create Your First Ad
                  </a>
                </div>
              }
            </div>

            @if (myListings().length > 6) {
              <div class="border-t border-gray-100 px-6 py-4 text-center">
                <a routerLink="/my-listings" class="text-mb-blue hover:underline font-medium">
                  View all {{ myListings().length }} listings <i class="fas fa-arrow-right ml-2"></i>
                </a>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  user = signal<User | null>(null);
  myListings = signal<Listing[]>([]);
  // Начинаем с true: иначе пустое состояние мелькает до первого запроса
  loading = signal(true);

  totalViews = () => this.myListings().reduce((sum, l) => sum + (l.views || 0), 0);
  activeCount = () => this.myListings().filter(l => l.is_active).length;
  profileScore = () => Math.min(85 + this.myListings().length * 2, 100);

  ngOnInit(): void {
    this.user.set(this.auth.currentUser());
    // Попадание в кэш отдаётся синхронно: подъём флага вставил бы заглушки
    // на один тик, и список мелькал бы при каждом входе
    this.loading.set(!this.api.hasCached('my-listings'));
    this.api.getProfile().subscribe({
      next: (data) => this.user.set(data),
      error: () => {}
    });
    this.api.getMyListings().subscribe({
      next: (data) => {
        this.myListings.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.myListings.set([]);
        this.loading.set(false);
      }
    });
  }

  getImageUrl(image: string): string {
    return this.api.imageUrl(image);
  }

  deleteListing(id: number): void {
    if (!confirm('Delete this listing?')) return;
    this.api.deleteListing(id).subscribe({
      next: () => this.myListings.update(list => list.filter(l => l.id !== id))
    });
  }
}
