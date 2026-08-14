import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService, UsState, UsCitySuggestion } from '../../services/api.service';
import { ImageCompressionService } from '../../services/image-compression.service';
import { NotificationService } from '../../services/notification.service';
import { Listing } from '../../models/listing.model';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { CityAutocompleteComponent } from '../../components/city-autocomplete/city-autocomplete.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-edit-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent, CityAutocompleteComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">Edit Listing</h1>

      @if (listing()) {
        <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl shadow-lg p-8 space-y-6">
          <div class="form-group">
            <label class="form-label">Title *</label>
            <input type="text" [(ngModel)]="title" name="title" class="form-input" required>
          </div>

          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea [(ngModel)]="description" name="description" class="form-input" rows="6"></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Price ($) *</label>
              <input type="number" [(ngModel)]="price" name="price" class="form-input" required>
            </div>

            <div class="form-group">
              <label class="form-label">State</label>
              <select [(ngModel)]="state" name="state" (ngModelChange)="onStateChange()" class="form-input">
                <option value="">Select state</option>
                @for (s of states(); track s.code) {
                  <option [value]="s.code">{{ s.name }}</option>
                }
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">City</label>
              <app-city-autocomplete [state]="state" [value]="cityName"
                                     (valueChange)="cityName = $event"
                                     (citySelected)="cityName = $event.name"
                                     placeholder="Start typing a city" />
            </div>

            <div class="form-group">
              <label class="form-label">Area / District</label>
              <input type="text" [(ngModel)]="area" name="area" class="form-input"
                     placeholder="Optional - neighborhood, district">
            </div>
          </div>

          @if (existingImages().length > 0) {
            <div class="form-group">
              <label class="form-label">Current Photos</label>
              <div class="grid grid-cols-4 gap-2">
                @for (img of existingImages(); track $index) {
                  <div class="relative group">
                    <img [src]="getImageUrl(img)" class="w-full h-24 object-cover rounded border border-gray-200" loading="lazy" decoding="async">
                    <button type="button" (click)="removeExisting($index)"
                            class="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition">×</button>
                  </div>
                }
              </div>
            </div>
          }

          <div class="form-group">
            <label class="form-label">Add Photos</label>
            <app-image-upload [maxFiles]="10" (filesChange)="onFilesChange($event)"></app-image-upload>
          </div>

          <div class="flex gap-3 pt-4 border-t border-gray-100">
            <button type="submit" class="btn btn-primary flex-1" [disabled]="loading()">
              {{ loading() ? 'Saving...' : 'Save Changes' }}
            </button>
            <button type="button" (click)="cancel()" class="btn btn-secondary">Cancel</button>
          </div>
        </form>
      } @else {
        <div class="text-center py-12 text-gray-500">Loading...</div>
      }
    </div>
  `
})
export class EditListingComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private compressor = inject(ImageCompressionService);

  listing = signal<Listing | null>(null);
  existingImages = signal<string[]>([]);
  states = signal<UsState[]>([]);
  loading = signal(false);

  title = '';
  description = '';
  price = 0;
  state = '';
  cityName = '';
  area = '';

  newFiles: File[] = [];
  removedImages: string[] = [];

  /** Список городов зависит от штата — при смене штата прежний город недействителен. */
  onStateChange(): void {
    this.cityName = '';
  }

  /** listings.location хранит "City, ST" — разбираем на город и код штата. */
  private splitLocation(location: string): void {
    const parts = (location || '').split(',');
    this.cityName = (parts[0] || '').trim();
    this.state = parts.length > 1 ? (parts[1] || '').trim().toUpperCase() : '';
  }

  private composeLocation(): string {
    const city = this.cityName.trim();
    if (!city) return '';
    return this.state ? `${city}, ${this.state}` : city;
  }

  ngOnInit(): void {
    this.api.getStates().subscribe({
      next: (data) => this.states.set(data || []),
      error: () => this.states.set([])
    });

    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (id) {
      this.api.getListing(id).subscribe({
        next: (data) => {
          this.listing.set(data);
          this.title = data.title;
          this.description = data.description || '';
          this.price = data.price;
          this.splitLocation(data.location);
          this.area = data.area || '';
          this.existingImages.set(data.images || []);
        }
      });
    }
  }

  getImageUrl(image: string): string {
    return this.api.imageUrl(image);
  }

  removeExisting(index: number): void {
    const img = this.existingImages()[index];
    this.removedImages.push(img);
    this.existingImages.update(list => list.filter((_, i) => i !== index));
  }

  onFilesChange(files: File[]): void {
    this.newFiles = files;
  }

  async onSubmit(): Promise<void> {
    if (!this.listing()) return;
    this.loading.set(true);

    let uploadFiles = this.newFiles;
    if (this.newFiles.length > 0) {
      try {
        uploadFiles = await this.compressor.compressMany(this.newFiles, {
          maxWidthPx: 1920,
          maxHeightPx: 1920,
          quality: 0.82,
          maxSizeBytes: 800 * 1024
        });
      } catch {
        uploadFiles = this.newFiles;
      }
    }

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('description', this.description);
    formData.append('price', String(this.price));
    formData.append('location', this.composeLocation());
    formData.append('area', this.area);
    this.removedImages.forEach(img => formData.append('removed_images', img));
    uploadFiles.forEach(f => formData.append('images', f));

    this.api.updateListing(this.listing()!.id, formData).subscribe({
      next: () => {
        this.loading.set(false);
        this.notification.success('Listing updated');
        this.router.navigate(['/my-listings']);
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.error(err?.error?.message || 'Failed to save');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/my-listings']);
  }
}
