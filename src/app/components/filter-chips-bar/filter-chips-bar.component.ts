import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListingFilters, SORT_OPTIONS } from '../../models/listing-filters.model';

@Component({
  selector: 'app-filter-chips-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex items-center gap-2 flex-wrap py-3 border-b border-gray-100">
      <button (click)="openDrawer.emit()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:border-mb-blue transition shadow-sm">
        <i class="fas fa-sliders"></i>
        Filters
        @if (activeFilterCount() > 0) {
          <span class="bg-mb-blue text-white text-xs rounded-full px-2 py-0.5">{{ activeFilterCount() }}</span>
        }
      </button>

      @if (filters.price_min !== undefined || filters.price_max !== undefined) {
        <button (click)="clearPrice()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-mb-blue text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
          \${{ filters.price_min || 0 }} - \${{ filters.price_max || '∞' }}
          <i class="fas fa-times text-xs"></i>
        </button>
      } @else {
        <button (click)="openDrawer.emit()"
                class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:border-mb-blue transition">
          Price
        </button>
      }

      @if (filters.has_image) {
        <button (click)="toggleHasImage()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-mb-blue text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
          Has image
          <i class="fas fa-times text-xs"></i>
        </button>
      } @else {
        <button (click)="toggleHasImage()"
                class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:border-mb-blue transition">
          Has image
        </button>
      }

      @if (filters.posted_within) {
        <button (click)="clearPostedWithin()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-mb-blue text-white rounded-full text-sm font-medium hover:bg-blue-700 transition">
          {{ getPostedLabel() }}
          <i class="fas fa-times text-xs"></i>
        </button>
      } @else {
        <button (click)="openDrawer.emit()"
                class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:border-mb-blue transition">
          Date posted
        </button>
      }

      @if (activeFilterCount() > 0) {
        <button (click)="clearAll()"
                class="ml-2 text-sm text-red-600 hover:text-red-700 hover:underline">
          Clear all
        </button>
      }

      <div class="flex-1"></div>

      <select [(ngModel)]="currentSort"
              (ngModelChange)="onSortChange($event)"
              class="px-3 py-2 bg-white border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-mb-blue cursor-pointer">
        @for (opt of sortOptions; track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
    </div>
  `
})
export class FilterChipsBarComponent {
  @Input() filters: ListingFilters = {};
  @Output() filtersChange = new EventEmitter<ListingFilters>();
  @Output() openDrawer = new EventEmitter<void>();

  sortOptions = SORT_OPTIONS;
  currentSort = 'newest';

  ngOnChanges(): void {
    this.currentSort = this.filters.sort || 'newest';
  }

  activeFilterCount(): number {
    let count = 0;
    if (this.filters.price_min !== undefined || this.filters.price_max !== undefined) count++;
    if (this.filters.has_image) count++;
    if (this.filters.posted_within) count++;
    return count;
  }

  getPostedLabel(): string {
    const days = this.filters.posted_within;
    if (days === 1) return 'Today';
    if (days === 3) return 'Last 3 days';
    if (days === 7) return 'Last week';
    if (days === 30) return 'Last month';
    return `Last ${days} days`;
  }

  toggleHasImage(): void {
    this.filtersChange.emit({ ...this.filters, has_image: !this.filters.has_image });
  }

  clearPrice(): void {
    const { price_min, price_max, ...rest } = this.filters;
    this.filtersChange.emit(rest);
  }

  clearPostedWithin(): void {
    const { posted_within, ...rest } = this.filters;
    this.filtersChange.emit(rest);
  }

  clearAll(): void {
    this.filtersChange.emit({
      q: this.filters.q,
      city: this.filters.city,
      category: this.filters.category,
      sort: this.filters.sort
    });
  }

  onSortChange(sort: string): void {
    this.filtersChange.emit({ ...this.filters, sort: sort as any });
  }
}
