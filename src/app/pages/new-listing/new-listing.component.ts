import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService, UsState, UsCitySuggestion } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { ImageCompressionService } from '../../services/image-compression.service';
import { Category } from '../../models/listing.model';
import { ImageUploadComponent } from '../../components/image-upload/image-upload.component';
import { CityAutocompleteComponent } from '../../components/city-autocomplete/city-autocomplete.component';

@Component({
  selector: 'app-new-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, ImageUploadComponent, CityAutocompleteComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8 min-page">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">Post New Ad</h1>

      <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input type="text" [(ngModel)]="title" name="title" class="form-input" required maxlength="200" minlength="10" placeholder="What are you selling?">
          <!-- Проверка идёт здесь, а не после отправки: недочёт виден сразу, и
               объявление не заводится в базе отклонённым -->
          @if (title.length > 0 && title.trim().length < 10) {
            <p class="text-sm text-red-600 mt-1">At least 10 characters ({{ title.trim().length }}/10)</p>
          }
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
          @if (description.length > 0 && description.trim().length < 40) {
            <p class="text-sm text-red-600 mt-1">At least 40 characters ({{ description.trim().length }}/40)</p>
          }
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Price ($) *</label>
            <input type="number" [(ngModel)]="price" name="price" class="form-input" min="1" step="0.01" required>
              @if (price !== null && price !== undefined && price < 1) {
                <p class="text-sm text-red-600 mt-1">Price must be at least $1</p>
              }
          </div>

          <div class="form-group">
            <label class="form-label">State *</label>
            <select [(ngModel)]="state" name="state" (ngModelChange)="onStateChange()" class="form-input" required>
              <option value="">Select state</option>
              @for (s of states(); track s.code) {
                <option [value]="s.code">{{ s.name }}</option>
              }
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">City / Town *</label>
          <app-city-autocomplete [state]="state" [value]="cityName"
                                 (valueChange)="cityName = $event"
                                 (citySelected)="onCityPicked($event)"
                                 placeholder="Start typing a city" />
        </div>

        <div class="form-group">
          <label class="form-label">Photos</label>
          <app-image-upload [maxFiles]="10" (filesChange)="onFilesChange($event)"></app-image-upload>
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" class="btn btn-primary flex-1" [disabled]="loading() || !formValid()">
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
  loading = signal(false);

  title = '';
  categoryId = '';
  description = '';
  price = 0;
  /** Двухбуквенный код выбранного штата. */
  state = '';
  cityName = '';
  states = signal<UsState[]>([]);

  /** Список городов зависит от штата — при смене штата прежний город недействителен. */
  onStateChange(): void {
    this.cityName = '';
  }

  onCityPicked(c: UsCitySuggestion): void {
    this.cityName = c.name;
  }

  /** listings.location хранит "City, ST" — формат совпадает с таблицей cities. */
  private composeLocation(): string {
    const city = this.cityName.trim();
    if (!city) return '';
    return this.state ? `${city}, ${this.state}` : city;
  }
  files: File[] = [];

  ngOnInit(): void {
    this.api.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => this.categories.set([])
    });
    this.api.getStates().subscribe({
      next: (data) => this.states.set(data || []),
      error: () => this.states.set([])
    });
  }

  onFilesChange(files: File[]): void {
    this.files = files;
  }

  /**
   * Годится ли к отправке. Те же требования, что на сервере: заголовок от
   * десяти знаков, описание от сорока, цена от доллара. Снимок необязателен.
   *
   * Проверка здесь не отменяет серверную — та защищает от обхода страницы.
   */
  formValid(): boolean {
    return this.title.trim().length >= 10
        && this.description.trim().length >= 40
        && this.price != null && this.price >= 1
        && !!this.categoryId
        && !!this.state
        && this.cityName.trim().length > 0;
  }

  async onSubmit(): Promise<void> {
    if (!this.title || !this.categoryId || !this.description || !this.state || !this.cityName.trim()) {
      this.notification.error('Please fill all required fields');
      return;
    }
    if (this.price === null || this.price === undefined || isNaN(Number(this.price)) || Number(this.price) < 0) {
      this.notification.error('Please enter a valid price');
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
    formData.append('location', this.composeLocation());
    compressedFiles.forEach(f => formData.append('images', f));

    this.api.createListing(formData).subscribe({
      next: (listing) => {
        this.loading.set(false);
        this.notification.success('Listing posted successfully!');
        // На продвижение, а не сразу в объявление: продавец заинтересован в
        // просмотрах именно сейчас, а не когда вспомнит про кнопку Boost.
        // Пропустить можно одним нажатием.
        this.router.navigate(['/promote', listing.id], { queryParams: { posted: 1 } });
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
