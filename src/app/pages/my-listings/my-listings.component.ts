import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Listing } from '../../models/listing.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-12 overflow-x-hidden min-page">
      <div class="mb-12">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-4xl font-bold text-mb-dark mb-2">My Ads</h1>
            <p class="text-gray-600">Manage and track all your listings</p>
          </div>
          <a routerLink="/new-listing" class="px-6 py-3 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-lg transition text-center">
            + Post New Ad
          </a>
        </div>
      </div>

      @if (listings().length > 0) {
        <!-- Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-mb-blue">
            <p class="text-gray-600 text-sm font-medium">Total Ads</p>
            <p class="text-3xl font-bold text-mb-dark mt-2">{{ listings().length }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-mb-cyan">
            <p class="text-gray-600 text-sm font-medium">Total Views</p>
            <p class="text-3xl font-bold text-mb-dark mt-2">{{ totalViews() }}</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-mb-green">
            <p class="text-gray-600 text-sm font-medium">Active Listings</p>
            <p class="text-3xl font-bold text-mb-dark mt-2">{{ activeCount() }}</p>
          </div>
        </div>

        <!-- Listings Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (listing of listings(); track listing.id) {
            <div class="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-gray-100">
              <!-- Image -->
              <div class="relative h-48 bg-gray-100 overflow-hidden group">
                @if (listing.images && listing.images.length > 0) {
                  <img [src]="getImageUrl(listing.images[0])" [alt]="listing.title"
                       class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                       loading="lazy"
                       decoding="async">
                } @else {
                  <div class="w-full h-full flex items-center justify-center text-gray-400">
                    <span class="text-5xl">📷</span>
                  </div>
                }

                <!-- Status Badge -->
                <div class="absolute top-3 right-3">
                  @if (listing.is_active) {
                    <span class="inline-block px-3 py-1 bg-mb-green text-white text-xs font-bold rounded-full">Active</span>
                  } @else {
                    <span class="inline-block px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">Inactive</span>
                  }
                </div>

                <!-- Promoted Badge -->
                @if (isPromoted(listing)) {
                  <div class="absolute top-3 left-3">
                    <span class="inline-block px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">⬆ Boosted</span>
                  </div>
                }
              </div>

              <!-- Content -->
              <div class="p-5">
                <div class="mb-3">
                  <a [routerLink]="['/listing', listing.id]" class="text-lg font-bold text-mb-dark hover:text-mb-blue transition line-clamp-2">
                    {{ listing.title }}
                  </a>
                  <p class="text-2xl font-bold text-mb-blue mt-2">\${{ listing.price }}</p>
                </div>

                <div class="space-y-2 mb-4 text-sm text-gray-600 border-b border-gray-100 pb-4">
                  <p>📍 {{ listing.location }}@if (listing.area) { · {{ listing.area }} }</p>
                  <p>📅 {{ listing.created_at | date:'MMM d, y' }}</p>
                  <p>👁 <strong>{{ listing.views }}</strong> views</p>
                </div>

                <!-- Actions -->
                <div class="flex flex-col gap-2">
                  <div class="grid grid-cols-2 gap-1">
                    <a [routerLink]="['/listing', listing.id]" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-mb-blue font-medium rounded transition text-center text-[10px]">View</a>
                    <a [routerLink]="['/promote', listing.id]" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-medium rounded transition text-center text-[10px]">Boost</a>
                  </div>
                  <div class="grid grid-cols-2 gap-1">
                    <a [routerLink]="['/edit-listing', listing.id]" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded transition text-center text-[10px]">Edit</a>
                    <button (click)="deleteListing(listing.id)" class="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded transition text-[10px]">Del</button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      } @else if (!loading()) {
        <div class="bg-white rounded-2xl shadow-md p-12 text-center border border-gray-100">
          <div class="mb-6"><span class="text-6xl">📝</span></div>
          <h2 class="text-2xl font-bold text-mb-dark mb-2">No listings yet</h2>
          <p class="text-gray-600 mb-8">Start selling by posting your first ad</p>
          <a routerLink="/new-listing" class="inline-block px-8 py-3 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-lg transition">
            Post Your First Ad
          </a>
        </div>
      }
    </div>
  `
})
export class MyListingsComponent implements OnInit {
  private api = inject(ApiService);

  listings = signal<Listing[]>([]);
  // Начинаем с true: иначе пустое состояние мелькает до первого запроса
  loading = signal(true);

  totalViews = () => this.listings().reduce((sum, l) => sum + (l.views || 0), 0);
  activeCount = () => this.listings().filter(l => l.is_active).length;

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getMyListings().subscribe({
      next: (data) => {
        this.listings.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.listings.set([]);
        this.loading.set(false);
      }
    });
  }

  isPromoted(listing: Listing): boolean {
    if (!listing.promoted_until) return false;
    return new Date(listing.promoted_until) > new Date();
  }

  getImageUrl(image: string): string {
    return this.api.imageUrl(image);
  }

  deleteListing(id: number): void {
    if (!confirm('Delete this listing?')) return;
    this.api.deleteListing(id).subscribe({
      next: () => this.listings.update(list => list.filter(l => l.id !== id))
    });
  }
}
