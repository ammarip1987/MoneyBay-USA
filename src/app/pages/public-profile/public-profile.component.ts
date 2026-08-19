import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Listing } from '../../models/listing.model';
import { ListingCardComponent } from '../../components/listing-card/listing-card.component';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';
import { AuthService } from '../../services/auth.service';
import { SeoService } from '../../services/seo.service';

interface PublicProfile {
  id: number;
  username: string;
  city: string | null;
  created_at: string;
  listings_count: number;
  listings: Listing[];
}

@Component({
  selector: 'app-public-profile',
  standalone: true,
  imports: [CommonModule, RouterLink, ListingCardComponent, SkeletonLoaderComponent],
  template: `
    @if (loading()) {
      <app-skeleton-loader variant="profile"></app-skeleton-loader>
      <div class="max-w-6xl mx-auto px-4">
        <app-skeleton-loader variant="listing-grid" [count]="8"></app-skeleton-loader>
      </div>
    } @else if (profile()) {
      <div class="max-w-6xl mx-auto px-4 py-8 min-page">
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div class="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div class="w-24 h-24 bg-gradient-to-br from-mb-blue to-mb-cyan rounded-full flex items-center justify-center text-white text-4xl font-bold flex-shrink-0">
              {{ getInitial() }}
            </div>
            <div class="flex-1 text-center sm:text-left">
              <h1 class="text-3xl font-bold text-mb-dark mb-2">{{ profile()!.username }}</h1>
              @if (profile()!.city) {
                <p class="text-gray-600 mb-1"><i class="fas fa-map-marker-alt mr-2"></i>{{ profile()!.city }}</p>
              }
              <p class="text-gray-500 text-sm mb-3">Member since {{ profile()!.created_at | date:'MMM yyyy' }}</p>
              <p class="text-mb-blue font-semibold">{{ profile()!.listings_count }} active listing{{ profile()!.listings_count !== 1 ? 's' : '' }}</p>
            </div>
            @if (auth.isAuthenticated() && auth.currentUser()?.id !== profile()!.id) {
              <a [routerLink]="['/chat', profile()!.id]" class="btn btn-primary">
                <i class="fas fa-envelope mr-2"></i>Message Seller
              </a>
            }
          </div>
        </div>

        @if (profile()!.listings.length > 0) {
          <h2 class="text-2xl font-bold text-mb-dark mb-6">Listings by {{ profile()!.username }}</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            @for (listing of profile()!.listings; track listing.id) {
              <app-listing-card [listing]="listing"></app-listing-card>
            }
          </div>
        } @else {
          <div class="text-center py-12 bg-white rounded-2xl shadow">
            <i class="fas fa-box-open text-5xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">No active listings</p>
          </div>
        }
      </div>
    } @else {
      <div class="text-center py-12">
        <p class="text-gray-500 text-lg">User not found</p>
        <a routerLink="/" class="text-mb-blue hover:underline mt-4 inline-block">← Back to home</a>
      </div>
    }
  `
})
export class PublicProfileComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private seo = inject(SeoService);
  auth = inject(AuthService);

  profile = signal<PublicProfile | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      if (!id) return;

      this.loading.set(true);
      this.profile.set(null);

      this.http.get<PublicProfile>(`${environment.apiUrl}/api/users/${id}/public`).subscribe({
        next: (data) => {
          this.profile.set(data);
          this.loading.set(false);
          this.seo.update({
            title: `${data.username} on MoneyBay`,
            description: `${data.listings_count} listing${data.listings_count !== 1 ? 's' : ''} from ${data.username}${data.city ? ' in ' + data.city : ''}`,
            type: 'website'
          });
        },
        error: () => {
          this.profile.set(null);
          this.loading.set(false);
          this.seo.update({ title: 'User not found', noindex: true });
        }
      });
    });
  }

  getInitial(): string {
    const name = this.profile()?.username || '';
    return name.charAt(0).toUpperCase() || '?';
  }
}
