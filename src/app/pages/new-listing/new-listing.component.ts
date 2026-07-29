import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { ImageCompressionService } from '../../services/image-compression.service';
import { Category, City } from '../../models/listing.model';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';

@Component({
  selector: 'app-new-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">Post New Ad</h1>

      <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input type="text" [(ngModel)]="title" name="title" class="form-input" required maxlength="200" placeholder="What are you selling?">
        </div>

        <div class="form-group">
          <label class="form-label">Category *</label>
          <select [(ngModel)]="categoryId" name="category" class="form-input" required>
            <option value="">Select category</option>
            @for (cat of categories(); track cat.id) {
              <option [value]="cat.id">{{ cat.name }}</option>
            }
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Description *</label>
          <textarea [(ngModel)]="description" name="description" class="form-input" rows="6" required
                    placeholder="Describe condition, features, why you're selling..."></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Price ($) *</label>
            <input type="number" [(ngModel)]="price" name="price" class="form-input" min="0" step="0.01" required>
          </div>

          <div class="form-group">
            <label class="form-label">City *</label>
            <select [(ngModel)]="city" name="city" class="form-input" required>
              <option value="">Select city</option>
              @for (c of cities(); track c.id) {
                <option [value]="c.name">{{ c.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Area / District</label>
          <input type="text" [(ngModel)]="area" name="area" class="form-input" placeholder="Optional - neighborhood, district">
        </div>

        <div class="form-group">
          <label class="form-label">Photos</label>
          <app-image-upload [maxFiles]="10" (filesChange)="onFilesChange($event)"></app-image-upload>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" class="btn btn-primary flex-1" [disabled]="loading()">
            {{ loading() ? 'Posting...' : 'Post Ad' }}
          </button>
          <button type="button" (click)="cancel()" class="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `
})
export class NewListingComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private notification = inject(NotificationService);
  private compressor = inject(ImageCompressionService);

  categories = signal<Category[]>([]);
  cities = signal<City[]>([]);
  loading = signal(false);

  title = '';
  categoryId = '';
  description = '';
  price = 0;
  city = '';
  area = '';
  files: File[] = [];

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([])
    });
    this.api.getCities().subscribe({
      next: (data) => this.cities.set(data),
      error: () => this.cities.set([])
    });
  }

  onFilesChange(files: File[]): void {
    this.files = files;
  }

  async onSubmit(): Promise<void> {
    if (!this.title || !this.categoryId || !this.description || !this.city) {
      this.notification.error('Please fill all required fields');
      return;
    }

    this.loading.set(true);

    let compressedFiles = this.files;
    if (this.files.length > 0) {
      const originalSize = this.files.reduce((sum, f) => sum + f.size, 0);
      try {
        compressedFiles = await this.compressor.compressMany(this.files, {
          maxWidthPx: 1920,
          maxHeightPx: 1920,
          quality: 0.82,
          maxSizeBytes: 800 * 1024
        });
        const newSize = compressedFiles.reduce((sum, f) => sum + f.size, 0);
        const savedPct = Math.round((1 - newSize / originalSize) * 100);
        if (savedPct > 5) {
          this.notification.info(`Photos compressed (saved ${savedPct}% size)`);
        }
      } catch {
        compressedFiles = this.files;
      }
    }

    const formData = new FormData();
    formData.append('title', this.title);
    formData.append('category_id', this.categoryId);
    formData.append('description', this.description);
    formData.append('price', String(this.price));
    formData.append('location', this.city);
    if (this.area) formData.append('area', this.area);
    compressedFiles.forEach(f => formData.append('images', f));

    this.api.createListing(formData).subscribe({
      next: (listing) => {
        this.loading.set(false);
        this.notification.success('Listing posted successfully!');
        this.router.navigate(['/listing', listing.id]);
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.error(err?.error?.message || 'Failed to create listing');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}
