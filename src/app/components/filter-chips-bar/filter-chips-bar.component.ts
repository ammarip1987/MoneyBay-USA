import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ListingFilters, SORT_OPTIONS } from '../../models/listing-filters.model';

@Component({
  selector: 'app-filter-chips-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Верхняя строка: чем отбирать. Ниже — отдельной полосой то, что уже
         отобрано. Прежде применённое и неприменённое стояло вперемешку, и
         разобрать, что действует, а что лишь открывает панель, было нельзя -->
    <div class="flex items-center gap-2 flex-wrap py-3">
      <button (click)="openDrawer.emit()"
              class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:border-mb-blue transition shadow-sm">
        <i class="fas fa-sliders"></i>
        Filters
        @if (activeFilterCount() > 0) {
          <span class="bg-mb-blue text-white text-xs rounded-full px-2 py-0.5">{{ activeFilterCount() }}</span>
        }
      </button>

      <!-- Отбор идёт штатом, а не городом: «Los Angeles, CA» отсекал бы
           объявления из Delano и Corona, тоже калифорнийских. Точное место
           ищут строкой поиска -->
      <div class="relative">
        <select [ngModel]="selectedState"
                (ngModelChange)="onStateChange($event)"
                name="stateChip"
                class="appearance-none w-52 pl-4 pr-9 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-0 transition cursor-pointer truncate">
          <option value="">Choose state</option>
          @for (s of states; track s.code) {
            <option [value]="s.code">{{ s.name }}, {{ s.code }}</option>
          }
        </select>
        <i class="fas fa-chevron-down text-xs text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
      </div>

        <!-- Место: города того штата, что выбран выше. Без штата список был
             бы на двадцать тысяч имён, и выбрать в нём нечего -->
        @if (selectedState) {
          <div class="relative">
            <i class="fas fa-map-marker-alt text-mb-blue text-xs absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"></i>
            <select [ngModel]="cityValue()"
                    (ngModelChange)="onCityChange($event)"
                    name="cityChip"
                    class="appearance-none w-52 pl-9 pr-9 py-2 bg-white border border-gray-300 rounded-full text-sm font-medium hover:border-gray-300 focus:border-gray-300 focus:outline-none focus:ring-0 transition cursor-pointer truncate">
              <option value="">All of {{ stateLabel() }}</option>
              @for (c of cities; track c.name) {
                <option [value]="c.name">{{ c.name }} ({{ c.count }})</option>
              }
            </select>
            <i class="fas fa-chevron-down text-xs text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"></i>
          </div>
        }

      <!-- Без подсветки: применённое видно в полосе ниже. Прежде здесь
           переключался text-white, а bg-white из общего перечня перебивал
           bg-mb-blue — надпись пропадала на белом -->
      <button (click)="toggleHasImage()"
              [class.border-mb-blue]="filters.has_image"
              class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:border-mb-blue transition">
        Has image
      </button>

      <button (click)="openDrawer.emit()"
              class="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm hover:border-mb-blue transition">
        Date posted
      </button>

      <div class="flex-1"></div>

      <select [(ngModel)]="currentSort"
              (ngModelChange)="onSortChange($event)"
              class="px-3 py-2 bg-white border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-mb-blue cursor-pointer">
        @for (opt of sortOptions; track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
    </div>

    <!-- Что отобрано: рамка появляется, только когда есть чему в ней быть -->
    @if (appliedCount() > 0) {
      <div class="flex items-center gap-2 flex-wrap px-4 py-3 mb-3 border border-mb-blue rounded-lg bg-white">
        <!-- Надпись одна и та же, пока идёт подсчёт: меняются только числа,
             когда придут. Прежде здесь стояло «Filtered by:», сменявшееся на
             «Selected …» через несколько секунд, и полоса мигала при каждой
             правке отбора -->
        <span class="text-sm text-gray-700">
          Selected
          @if (matchCount) {
            <!-- Число проступает плавно: подсчёт идёт секунды, и появление
                 рывком читается как подмена -->
            <strong class="count-appear">{{ matchCount.count | number }}</strong> products
            from {{ matchCount.total | number }}:
          } @else {
            <span class="inline-block w-10 h-3 bg-gray-200 rounded animate-pulse align-middle"></span>
            products:
          }
        </span>

        @if (selectedState) {
          <button (click)="clearCity()"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition">
            {{ stateLabel() }}
            <i class="fas fa-times text-xs text-gray-500"></i>
          </button>
        }

          <!-- Город отдельной кнопкой: снимается он один, штат остаётся -->
          @if (cityValue()) {
            <button (click)="onCityChange('')"
                    class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition">
              <i class="fas fa-map-marker-alt text-xs text-mb-blue"></i>
              {{ cityValue() }}
              <i class="fas fa-times text-xs text-gray-500"></i>
            </button>
          }

        @if (filters.price_min !== undefined || filters.price_max !== undefined) {
          <button (click)="clearPrice()"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition">
            \${{ filters.price_min || 0 }} – \${{ filters.price_max || '∞' }}
            <i class="fas fa-times text-xs text-gray-500"></i>
          </button>
        }

        @if (filters.has_image) {
          <button (click)="toggleHasImage()"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition">
            Has image
            <i class="fas fa-times text-xs text-gray-500"></i>
          </button>
        }

        @if (filters.posted_within) {
          <button (click)="clearPostedWithin()"
                  class="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded text-sm hover:bg-gray-200 transition">
            {{ getPostedLabel() }}
            <i class="fas fa-times text-xs text-gray-500"></i>
          </button>
        }

        <!-- Сразу за кнопками отбора, а не у правого края: читается как их
             продолжение — снять то, что перечислено слева -->
        <button (click)="clearAll()"
                class="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition">
          Clean
          <i class="fas fa-times text-xs"></i>
        </button>
      </div>
    }
  `,
  styles: [`
    /* Число проступает и слегка приподнимается: подсчёт идёт секунды, и
       появление рывком читается как подмена значения */
    .count-appear {
      animation: count-in 260ms ease-out;
    }
    @keyframes count-in {
      from { opacity: 0; transform: translateY(3px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class FilterChipsBarComponent {
  @Input() filters: ListingFilters = {};
  /** Штаты: код и название. */
  @Input() states: { code: string; name: string }[] = [];
  /** Сколько подошло и сколько всего. Приходит позже ленты. */
  @Input() matchCount: { count: number; total: number } | null = null;
  @Output() stateChange = new EventEmitter<string>();
  /** Города выбранного штата: приходят от страницы после выбора штата. */
  @Input() cities: { name: string; count: number }[] = [];

  /** Выбранный штат: код из двух букв. */
  selectedState = '';

  /** Название выбранного штата для кнопки: «California, CA». */
  stateLabel = (): string => {
    const found = this.states.find(s => s.code === this.selectedState);
    return found ? `${found.name}, ${found.code}` : this.selectedState;
  };
  @Output() filtersChange = new EventEmitter<ListingFilters>();
  @Output() openDrawer = new EventEmitter<void>();

  sortOptions = SORT_OPTIONS;
  currentSort = 'newest';

  ngOnChanges(): void {
    this.currentSort = this.filters.sort || 'newest';
    // Выбор восстанавливается из отбора: при перезагрузке страницы поле пустое,
    // хотя штат стоит в адресе, и кнопка не показывалась бы
    const city = this.filters.city || '';
    this.selectedState = /^[A-Z]{2}$/.test(city) ? city : '';
  }

  /**
   * Сколько отборов применено — вместе со штатом.
   *
   * Отличается от activeFilterCount: тот считает только то, что скрыто за
   * кнопкой Filters, и показывается на ней числом. Этот решает, показывать ли
   * полосу применённого.
   */
  appliedCount(): number {
    return this.activeFilterCount() + (this.selectedState ? 1 : 0) + (this.cityValue() ? 1 : 0);
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

  /** Выбран штат: отбор ставится на его код, отсюда же он и снимается. */
  onStateChange(code: string): void {
    this.selectedState = code;

    if (!code) {
      this.clearCity();
      return;
    }
    this.stateChange.emit(code);
    this.filtersChange.emit({ ...this.filters, city: code });
  }

  /**
   * Что показать в поле города. В filters.city лежит либо код штата, либо
   * город: код означает «весь штат», и поле должно быть пустым.
   */
  cityValue = (): string => {
    const v = this.filters.city || '';
    return v === this.selectedState ? '' : v;
  };

  /**
   * Выбор города внутри штата. Пустое значение возвращает отбор к штату
   * целиком: на сервере `CA` и `Delano, CA` разбираются одним и тем же
   * resolveCity.
   */
  onCityChange(city: string): void {
    this.filtersChange.emit({
      ...this.filters,
      city: city || this.selectedState
    });
  }

  /** Снять отбор по месту. */
  clearCity(): void {
    this.selectedState = '';
    const { city, ...rest } = this.filters;
    this.filtersChange.emit(rest);
  }

  clearPrice(): void {
    const { price_min, price_max, ...rest } = this.filters;
    this.filtersChange.emit(rest);
  }

  clearPostedWithin(): void {
    const { posted_within, ...rest } = this.filters;
    this.filtersChange.emit(rest);
  }

  /**
   * Снять всё, что показано в полосе применённого — штат в том числе.
   *
   * Раздел и слово поиска остаются: их выбирают не здесь, и Clear all под ними
   * не подписан.
   */
  clearAll(): void {
    this.selectedState = '';
    this.filtersChange.emit({
      q: this.filters.q,
      category: this.filters.category,
      sort: this.filters.sort
    });
  }

  onSortChange(sort: string): void {
    this.filtersChange.emit({ ...this.filters, sort: sort as any });
  }
}
