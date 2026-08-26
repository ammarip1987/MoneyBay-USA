import { Component, EventEmitter, Input, Output, OnInit, OnChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListingFilters, POSTED_WITHIN_OPTIONS, ListingFacets } from '../../models/listing-filters.model';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-filter-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity"
           (click)="close.emit()">
        <!-- Слева, с той же стороны, где кнопка Filters: панель выезжает там, куда
             человек только что нажал, а не через весь экран -->
        <aside class="absolute left-0 top-0 bottom-0 w-full sm:w-96 bg-white shadow-2xl flex flex-col"
               (click)="$event.stopPropagation()">

          <header class="flex justify-between items-center p-4 border-b border-gray-200 bg-mb-dark text-white">
            <h2 class="text-lg font-bold flex items-center gap-2">
              <i class="fas fa-sliders"></i> All Filters
            </h2>
            <button (click)="close.emit()"
                    class="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition">
              <i class="fas fa-times"></i>
            </button>
          </header>

          <div class="flex-1 overflow-y-auto p-4 space-y-6">

            <section>
              <h3 class="font-bold text-mb-dark mb-3 flex items-center gap-2">
                <i class="fas fa-dollar-sign text-mb-blue"></i> Price Range
              </h3>
              @if (facets() && facets()!.total > 0) {
                <p class="text-xs text-gray-500 mb-2">
                  Range: \${{ facets()!.price_min | number:'1.0-0' }} - \${{ facets()!.price_max | number:'1.0-0' }} ·
                  Avg: \${{ facets()!.price_avg | number:'1.0-0' }} ·
                  {{ facets()!.total }} listings
                </p>

                <div class="flex items-end h-20 gap-1 mb-2">
                  @for (bucket of facets()!.price_buckets; track bucket.min) {
                    <div class="flex-1 bg-mb-blue/30 hover:bg-mb-blue/60 transition rounded-t cursor-pointer"
                         [style.height.%]="(bucket.count / maxBucketCount()) * 100"
                         [title]="'$' + bucket.min + '-$' + bucket.max + ': ' + bucket.count + ' listings'"
                         (click)="setPriceRange(bucket.min, bucket.max)">
                    </div>
                  }
                </div>
              }

              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="text-xs text-gray-500">Min</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number"
                           [(ngModel)]="priceMin"
                           min="0"
                           placeholder="0"
                           class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mb-blue text-sm">
                  </div>
                </div>
                <div>
                  <label class="text-xs text-gray-500">Max</label>
                  <div class="relative">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                    <input type="number"
                           [(ngModel)]="priceMax"
                           min="0"
                           placeholder="Any"
                           class="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mb-blue text-sm">
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 class="font-bold text-mb-dark mb-3 flex items-center gap-2">
                <i class="fas fa-calendar text-mb-blue"></i> Date Posted
              </h3>
              <div class="space-y-2">
                <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                  <input type="radio"
                         name="postedWithin"
                         [value]="undefined"
                         [(ngModel)]="postedWithin"
                         class="w-4 h-4 text-mb-blue">
                  <span class="text-sm">Any time</span>
                </label>
                @for (opt of postedOptions; track opt.value) {
                  <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                    <input type="radio"
                           name="postedWithin"
                           [value]="opt.value"
                           [(ngModel)]="postedWithin"
                           class="w-4 h-4 text-mb-blue">
                    <span class="text-sm">{{ opt.label }}</span>
                  </label>
                }
              </div>
            </section>

            <section>
              <h3 class="font-bold text-mb-dark mb-3 flex items-center gap-2">
                <i class="fas fa-image text-mb-blue"></i> Listing Details
              </h3>
              <label class="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                <input type="checkbox"
                       [(ngModel)]="hasImage"
                       class="w-4 h-4 text-mb-blue rounded">
                <span class="text-sm">Has photos</span>
              </label>
            </section>

            <section>
              <h3 class="font-bold text-mb-dark mb-3 flex items-center gap-2">
                <i class="fas fa-info-circle text-mb-blue"></i> Active Filters
              </h3>
              <div class="text-sm text-gray-600 space-y-1 bg-gray-50 rounded-lg p-3">
                @if (filters.category) { <p>Category: <strong>{{ filters.category }}</strong></p> }
                @if (filters.city) { <p>State: <strong>{{ placeLabel() }}</strong></p> }
                @if (filters.q) { <p>Search: <strong>"{{ filters.q }}"</strong></p> }
                @if (!filters.category && !filters.city && !filters.q) {
                  <p class="text-gray-400 italic">No category, city or search query applied</p>
                }
              </div>
            </section>
          </div>

          <footer class="border-t border-gray-200 p-4 flex gap-3 bg-white">
            <button (click)="reset()"
                    class="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition">
              Reset
            </button>
            <button (click)="apply()"
                    class="flex-1 px-4 py-3 bg-mb-blue text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-md">
              Apply Filters
            </button>
          </footer>
        </aside>
      </div>
    }
  `
})
export class FilterDrawerComponent implements OnInit, OnChanges {
  @Input() open = false;
  @Input() filters: ListingFilters = {};
  /** Штаты: нужны, чтобы показать название вместо кода из двух букв. */
  @Input() states: { code: string; name: string }[] = [];

  /** Название штата для перечня применённого: «Arkansas» вместо «AR». */
  placeLabel = (): string => {
    const value = this.filters.city || '';
    return this.states.find(s => s.code === value)?.name || value;
  };
  @Output() close = new EventEmitter<void>();
  @Output() apply$ = new EventEmitter<ListingFilters>();

  private api = inject(ApiService);

  postedOptions = POSTED_WITHIN_OPTIONS;
  facets = signal<ListingFacets | null>(null);

  priceMin?: number;
  priceMax?: number;
  hasImage = false;
  postedWithin?: number;

  ngOnInit(): void {
    this.loadFacets();
  }

  ngOnChanges(): void {
    if (this.open) {
      this.priceMin = this.filters.price_min;
      this.priceMax = this.filters.price_max;
      this.hasImage = this.filters.has_image || false;
      this.postedWithin = this.filters.posted_within;
      this.loadFacets();
    }
  }

  loadFacets(): void {
    this.api.getFacets(this.filters.category, this.filters.city).subscribe({
      next: (data) => this.facets.set(data),
      error: () => this.facets.set(null)
    });
  }

  maxBucketCount(): number {
    const f = this.facets();
    if (!f || !f.price_buckets) return 1;
    return Math.max(...f.price_buckets.map(b => b.count), 1);
  }

  setPriceRange(min: number, max: number): void {
    this.priceMin = Math.floor(min);
    this.priceMax = Math.ceil(max);
  }

  apply(): void {
    const newFilters: ListingFilters = {
      ...this.filters,
      price_min: this.priceMin && this.priceMin > 0 ? this.priceMin : undefined,
      price_max: this.priceMax && this.priceMax > 0 ? this.priceMax : undefined,
      has_image: this.hasImage,
      posted_within: this.postedWithin
    };
    this.apply$.emit(newFilters);
    this.close.emit();
  }

  reset(): void {
    this.priceMin = undefined;
    this.priceMax = undefined;
    this.hasImage = false;
    this.postedWithin = undefined;
  }
}
