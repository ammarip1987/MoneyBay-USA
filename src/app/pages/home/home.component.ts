import { Component, OnInit, OnDestroy, inject, signal, effect, ViewChild, ElementRef, AfterViewInit, PLATFORM_ID, afterNextRender } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ApiService, UsState } from '../../services/api.service';
import { CityContextService } from '../../services/city-context.service';
import { GeolocationService } from '../../services/geolocation.service';
import { SeoService } from '../../services/seo.service';
import { Listing, Category, City } from '../../models/listing.model';
import { ListingCardComponent } from '../../components/listing-card/listing-card.component';
import { SearchAutocompleteComponent } from '../../components/search-autocomplete/search-autocomplete.component';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';
import { FilterChipsBarComponent } from '../../components/filter-chips-bar/filter-chips-bar.component';
import { FilterDrawerComponent } from '../../components/filter-drawer/filter-drawer.component';
import { ListingFilters } from '../../models/listing-filters.model';
import { environment } from '../../../environments/environment';

interface Subcategory {
  id: number;
  slug: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ListingCardComponent, SearchAutocompleteComponent, SkeletonLoaderComponent, FilterChipsBarComponent, FilterDrawerComponent],
  template: `
    <div class="min-page">
    <!-- Hero Section (only on main page) -->
    @if (!selectedCategory()) {
      <div class="relative overflow-hidden rounded-2xl mb-8 -mx-4 sm:mx-0">
        <div class="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-cyan-50"></div>
        <div class="relative px-4 py-8 sm:py-12 text-center">
          <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-2 flex flex-col sm:flex-row gap-2 border border-gray-100">
            <div class="flex-1">
              <app-search-autocomplete
                placeholder="Search listings..."
                [initialQuery]="searchQuery"
                (search)="onAutocompleteSearch($event)"></app-search-autocomplete>
            </div>
            <button (click)="search()" class="px-6 py-2 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-lg transition-all text-sm">
              Search
            </button>
          </div>
        </div>
      </div>
    } @else {
      <!-- Тот же вид, что на главной: строка не меняет расположения при переходе
           в раздел. Город ушёл в полосу фильтров, к цене и прочему -->
      <div class="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-2 flex flex-col sm:flex-row gap-2 border border-gray-100 mb-8">
        <div class="flex-1">
          <app-search-autocomplete
            placeholder="Search listings..."
            [initialQuery]="searchQuery"
            (search)="onAutocompleteSearch($event)"></app-search-autocomplete>
        </div>
        <button (click)="search()" class="px-6 py-2 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-lg transition">
          Search
        </button>
      </div>
    }

    <!-- Categories grid (only on main page) -->
    @if (!selectedCategory()) {
      <div class="mb-12">
        <!-- Место под плитки занято с первого кадра: без этого лента
             подпрыгивает, когда категории приходят -->
        @if (categories().length === 0) {
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            @for (i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 12, 13]; track i) {
              <div class="bg-gray-100 animate-pulse" style="height: 168px;"></div>
            }
          </div>
        }
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (cat of categories(); track cat.id) {
            <!-- Колонка: значок сверху, описание прижато книзу. Иначе длинное
                 название вытягивает плитку и содержимое соседних расходится по
                 высоте. -->
            <a [routerLink]="['/']"
               [queryParams]="{category: cat.slug}"
               class="card-hover p-6 text-center flex flex-col"
               [style.background-color]="cat.color + '33'"
               [style.border]="'2px solid ' + cat.color">
              <div class="text-4xl mb-3 text-mb-blue" [innerHTML]="cat.icon"></div>
              <h3 class="font-bold text-mb-dark mb-2 line-clamp-2">{{ cat.name }}</h3>
              <p class="text-sm text-gray-600 mt-auto line-clamp-2">{{ cat.description }}</p>
            </a>
          }
        </div>
      </div>
    }

    <!-- Category page header -->
    @if (selectedCategory() && currentCategory()) {
      <div class="rounded-lg p-8 mb-8 shadow-md"
           [style.background-color]="currentCategory()!.color">
        <div class="flex justify-between items-center flex-wrap gap-4">
          <h2 class="text-3xl font-bold text-mb-dark flex items-center gap-3">
            <span class="text-mb-blue" [innerHTML]="currentCategory()!.icon"></span>
            {{ currentCategory()!.name }}
            @if (currentSub()) {
              <span class="text-gray-600 text-2xl">/ {{ currentSub()!.name }}</span>
            }
            @if (currentSubSub()) {
              <span class="text-gray-600 text-2xl">/ {{ currentSubSub()!.name }}</span>
            }
          </h2>
          <div class="flex gap-2 flex-wrap">
            @if (currentSubSub()) {
              <a [routerLink]="['/']" [queryParams]="{category: selectedCategory(), sub: selectedSub()}" class="btn btn-secondary text-sm">← {{ currentSub()!.name }}</a>
            } @else if (currentSub()) {
              <a [routerLink]="['/']" [queryParams]="{category: selectedCategory()}" class="btn btn-secondary text-sm">← {{ currentCategory()!.name }}</a>
            } @else {
              <a routerLink="/" class="btn btn-secondary text-sm">← All listings</a>
            }
          </div>
        </div>
      </div>
    }

    <!-- Subcategories grid (when category selected, no sub) -->
    @if (selectedCategory() && !selectedSub() && subcategories().length > 0) {
      <div class="mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (sub of subcategories(); track sub.id) {
            <a [routerLink]="['/']"
               [queryParams]="{category: selectedCategory(), sub: sub.slug}"
               class="card-hover p-4"
               [style.background-color]="sub.color + '33'"
               [style.border]="'2px solid ' + sub.color">
              <div class="text-3xl mb-2 text-mb-blue" [innerHTML]="sub.icon"></div>
              <h3 class="font-bold text-mb-dark">{{ sub.name }}</h3>
              @if (sub.description) {
                <p class="text-sm text-gray-600">{{ sub.description }}</p>
              }
            </a>
          }
        </div>
      </div>
    }

    <!-- Sub-subcategories grid (when sub selected, has subsubs) -->
    @if (selectedSub() && !selectedSubSub() && subsubcategories().length > 0) {
      <div class="mb-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (ss of subsubcategories(); track ss.id) {
            <a [routerLink]="['/']"
               [queryParams]="{category: selectedCategory(), sub: selectedSub(), subsub: ss.slug}"
               class="card-hover p-4"
               [style.background-color]="ss.color + '33'"
               [style.border]="'2px solid ' + ss.color">
              <div class="text-3xl mb-2 text-mb-blue" [innerHTML]="ss.icon"></div>
              <h3 class="font-bold text-mb-dark">{{ ss.name }}</h3>
              @if (ss.description) {
                <p class="text-sm text-gray-600">{{ ss.description }}</p>
              }
            </a>
          }
        </div>
      </div>
    }

    <!-- Listings -->
    <!-- Якорь для перехода по страницам: список начинается отсюда, на главной,
         в категориях и в подкатегориях. Плитки разделов остаются выше. -->
    @if (!selectedCategory()) {
      <h2 class="text-2xl font-bold text-mb-dark mb-6">All Listings</h2>
    }
    <!-- Якорь перехода по страницам: ниже заголовка, перед геоблоком и
         фильтрами. Плитки разделов и поиск остаются выше и не листаются заново. -->
    <div #listingsAnchor></div>

    @if (!selectedCategory() && !cityFilter && geo.nearestCity()) {
      <div class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3">
          <i class="fas fa-location-arrow text-mb-blue text-xl"></i>
          <div>
            <p class="text-sm text-gray-700">Show listings near you in <strong>{{ geo.nearestCity() }}</strong>?</p>
            <p class="text-xs text-gray-500">Detected from your location</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button (click)="applyGeoCity()" class="btn btn-primary text-sm">Apply</button>
          <button (click)="dismissGeoSuggestion()" class="btn btn-secondary text-sm">Dismiss</button>
        </div>
      </div>
    }

    @if (!selectedCategory() && !cityFilter && !geo.nearestCity() && geo.status() === 'idle') {
      <div class="mb-6 text-center">
        <button (click)="requestGeo()" class="text-sm text-mb-blue hover:underline">
          <i class="fas fa-location-arrow mr-1"></i> Find listings near me
        </button>
      </div>
    }

    @if (selectedCategory()) {
      <app-filter-chips-bar
        [filters]="currentFilters()"
        [states]="states()"
        [cities]="citiesOfState()"
        (stateChange)="loadCitiesOfState($event)"
        (filtersChange)="onFiltersChange($event)"
        (openDrawer)="drawerOpen.set(true)">
      </app-filter-chips-bar>

      <app-filter-drawer
        [open]="drawerOpen()"
        [filters]="currentFilters()"
        (close)="drawerOpen.set(false)"
        (apply$)="onFiltersChange($event)">
      </app-filter-drawer>
    }

    @if (listings().length > 0) {
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6 mt-4">
        @for (listing of listings(); track listing.id) {
          <app-listing-card [listing]="listing"></app-listing-card>
        }
      </div>

      @if (totalPages() > 1) {
        <nav class="py-8 flex justify-center items-center gap-1 flex-wrap" aria-label="Pagination">
          <button (click)="goToPage(currentPage() - 1)"
                  [disabled]="currentPage() <= 1"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700"
                  aria-label="Previous page">
            <i class="fas fa-chevron-left"></i>
          </button>

          @for (p of pageNumbers(); track $index) {
            @if (p === 0) {
              <span class="px-2 text-gray-400">…</span>
            } @else {
              <button (click)="goToPage(p)"
                      class="min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition"
                      [class.bg-mb-blue]="p === currentPage()"
                      [class.text-white]="p === currentPage()"
                      [class.text-gray-700]="p !== currentPage()"
                      [class.hover:bg-gray-100]="p !== currentPage()"
                      [attr.aria-current]="p === currentPage() ? 'page' : null">
                {{ p }}
              </button>
            }
          }

          <button (click)="goToPage(currentPage() + 1)"
                  [disabled]="currentPage() >= totalPages()"
                  class="px-3 py-2 rounded-lg text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 text-gray-700"
                  aria-label="Next page">
            <i class="fas fa-chevron-right"></i>
          </button>
        </nav>
        @if (totalLabel()) {
          <p class="text-center text-sm text-gray-500 -mt-4 pb-8">{{ totalLabel() }}</p>
        }
      }
    }

    <!-- Первая загрузка — скелет: он показывает будущую раскладку. Переход
         между страницами — кружок: раскладка уже знакома, и восемь размытых
         карточек вместо неё выглядят хуже. -->
    @if (loading()) {
      @if (pagingNow()) {
        <div class="flex items-center justify-center" style="min-height: 520px;">
          <span class="relative inline-flex items-center justify-center w-16 h-16">
            <span class="absolute inset-0 border-4 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
            <span class="text-2xl font-bold text-mb-blue select-none">M</span>
          </span>
        </div>
      } @else {
        <app-skeleton-loader variant="listing-grid" [count]="10"></app-skeleton-loader>
      }
    }

    @if (!loading() && listings().length === 0) {
      <div class="text-center py-12"><p class="text-gray-500 text-lg">No listings found.</p></div>
    }
    </div>
  `
})
export class HomeComponent implements OnInit, OnDestroy {
  @ViewChild('listingsAnchor') listingsAnchor?: ElementRef<HTMLElement>;

  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private seo = inject(SeoService);
  private platformId = inject(PLATFORM_ID);

  private scrollObserver?: IntersectionObserver;
  private cityCtx = inject(CityContextService);
  geo = inject(GeolocationService);

  constructor() {
    effect(() => {
      const city = this.cityCtx.currentCity();
      if (city && !this.cityFilter) {
        this.cityFilter = city.name;
        this.loadListings();
      }
    });
  }

  listings = signal<Listing[]>([]);
  // Список из сервиса: переживает уничтожение компонента, поэтому при
  // возврате на главную плитки уже на месте и не перерисовываются
  categories = this.api.categories;
  cities = signal<City[]>([]);
  /** Штаты для отбора: 51 запись, включая округ Колумбия. */
  states = signal<UsState[]>([]);
  /** Города выбранного штата. Все четыре тысячи разом списком не окинуть. */
  citiesOfState = signal<string[]>([]);

  /** Запросить города штата. Вызывается, когда штат выбран в полосе фильтров. */
  loadCitiesOfState(code: string): void {
    if (!code) {
      this.citiesOfState.set([]);
      return;
    }
    this.api.getCitiesOfState(code).subscribe({
      next: (list) => this.citiesOfState.set(list),
      error: () => this.citiesOfState.set([])
    });
  }
  subcategories = signal<Subcategory[]>([]);
  subsubcategories = signal<Subcategory[]>([]);
  // Начинаем с true: иначе пустое состояние мелькает до первого запроса
  loading = signal(true);
  loadingMore = signal(false);
  hasMore = signal(true);
  currentPage = signal(1);
  totalPages = signal(1);
  totalListings = signal(0);

  /**
   * Номера для карусели: пять подряд вокруг текущей, первая слева. Ноль
   * означает пропуск и рисуется многоточием.
   *
   * Номера последней страницы здесь нет: при двадцати четырёх тысячах он
   * занимает полряда и ничего не говорит. Объём показан подписью под каруселью
   * числом объявлений — оно понятнее, чем номер страницы, до которой никто не
   * долистывает. Уйти вглубь по-прежнему можно стрелкой и адресом.
   */
  pageNumbers = (): number[] => {
    const total = this.totalPages();
    const cur = this.currentPage();
    const window = 5;

    if (total <= window + 2) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Окно держится в пять номеров и у краёв сдвигается внутрь, а не сжимается
    let from = Math.max(2, cur - Math.floor(window / 2));
    let to = Math.min(total, from + window - 1);
    if (to === total) from = Math.max(2, to - window + 1);

    const pages: number[] = [1];
    if (from > 2) pages.push(0);
    for (let p = from; p <= to; p++) pages.push(p);
    if (to < total) pages.push(0);
    return pages;
  };

  /** Объём подписью: 1.4M, 120K, 3,751. */
  totalLabel = (): string => {
    const n = this.totalListings();
    if (n <= 0) return '';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M listings`;
    if (n >= 1_000) return `${Math.round(n / 1_000)}K listings`;
    return `${n.toLocaleString('en-US')} listings`;
  };

  selectedCategory = signal<string | null>(null);
  selectedSub = signal<string | null>(null);
  selectedSubSub = signal<string | null>(null);

  currentCategory = signal<Category | null>(null);
  currentSub = signal<Subcategory | null>(null);
  currentSubSub = signal<Subcategory | null>(null);

  searchQuery = '';
  cityFilter = '';
  drawerOpen = signal(false);
  advancedFilters = signal<Partial<ListingFilters>>({});

  currentFilters(): ListingFilters {
    return {
      q: this.searchQuery || undefined,
      city: this.cityFilter || undefined,
      category: this.selectedCategory() || undefined,
      sort: (this.sortBy as any) || 'newest',
      ...this.advancedFilters()
    };
  }

  sortBy: string = 'newest';

  ngOnInit(): void {
    // Ответ сервис кладёт в свой сигнал сам, здесь только запуск запроса.
    // Порядок задаёт запрос к базе: сортировка по имени.
    this.api.getCategories().subscribe({ error: () => {} });
    this.api.getCities().subscribe({
      next: (data) => this.cities.set(data),
      error: () => this.cities.set([])
    });
    this.api.getStates().subscribe({
      next: (data) => this.states.set(data),
      error: () => this.states.set([])
    });

    this.route.queryParams.subscribe(params => {
      // Переход в категорию не меняет маршрут, только параметры запроса, и
      // компонент остаётся тем же. Без очистки объявления прежнего раздела
      // висят на экране, пока грузится новый: сначала пропадают плитки и hero,
      // потом сменяются карточки. Очищаем только при смене раздела и только
      // когда ответа нет в кэше — иначе возврат назад тоже начнёт мигать.
      const sectionChanged =
        (params['category'] || null) !== this.selectedCategory() ||
        (params['sub'] || null) !== this.selectedSub() ||
        (params['subsub'] || null) !== this.selectedSubSub();

      this.selectedCategory.set(params['category'] || null);
      this.selectedSub.set(params['sub'] || null);
      this.selectedSubSub.set(params['subsub'] || null);

      if (sectionChanged) {
        this.subcategories.set([]);
        this.subsubcategories.set([]);
        // Смена раздела внутри приложения — тот же случай, что перелистывание:
        // раскладка знакома, меняется только набор карточек, поэтому кружок, а
        // не скелет. При первой загрузке сюда не попадаем: страница приходит с
        // сервера уже с карточками.
        if (this.listings().length > 0) this.pagingNow.set(true);
      }
      this.searchQuery = params['q'] || '';
      this.cityFilter = params['city'] || '';
      this.sortBy = params['sort'] || 'newest';
      // Номер страницы из адреса: смена раздела или фильтра возвращает на первую
      this.currentPage.set(sectionChanged ? 1 : Math.max(1, Number(params['page']) || 1));

      const advanced: Partial<ListingFilters> = {};
      if (params['price_min']) advanced.price_min = Number(params['price_min']);
      if (params['price_max']) advanced.price_max = Number(params['price_max']);
      if (params['has_image']) advanced.has_image = params['has_image'] === 'true';
      if (params['posted_within']) advanced.posted_within = Number(params['posted_within']);
      this.advancedFilters.set(advanced);

      this.loadHierarchy();
      this.loadListings();
      this.updateSeo();
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private destroyed = false;

  onFiltersChange(filters: ListingFilters): void {
    const queryParams: any = {};
    if (filters.q) queryParams.q = filters.q;
    if (filters.city) queryParams.city = filters.city;
    if (filters.category) queryParams.category = filters.category;
    if (filters.sort && filters.sort !== 'newest') queryParams.sort = filters.sort;
    if (filters.price_min !== undefined) queryParams.price_min = filters.price_min;
    if (filters.price_max !== undefined) queryParams.price_max = filters.price_max;
    if (filters.has_image) queryParams.has_image = 'true';
    if (filters.posted_within) queryParams.posted_within = filters.posted_within;

    // Подкатегория сохраняется: без неё смена порядка или цены уводила из
    // раздела наверх, к плиткам, и выбранная ветка терялась
    if (this.selectedSub()) queryParams.sub = this.selectedSub();
    if (this.selectedSubSub()) queryParams.subsub = this.selectedSubSub();

    // Прокрутка к объявлениям, как при листании и поиске: человек менял порядок,
    // глядя на карточки, и должен остаться на них, а не оказаться у плиток
    this.pendingScroll = true;
    this.router.navigate(['/'], { queryParams });
  }

  private updateSeo(): void {
    const parts: string[] = [];
    const keywords: string[] = ['classifieds', 'marketplace', 'buy', 'sell'];

    if (this.currentSubSub()) {
      parts.push(this.currentSubSub()!.name);
      keywords.push(this.currentSubSub()!.name);
    }
    if (this.currentSub()) {
      parts.push(this.currentSub()!.name);
      keywords.push(this.currentSub()!.name);
    }
    if (this.currentCategory()) {
      parts.push(this.currentCategory()!.name);
      keywords.push(this.currentCategory()!.name);
    }
    if (this.cityFilter) {
      parts.push('in ' + this.cityFilter);
      keywords.push(this.cityFilter);
    }
    if (this.searchQuery) {
      parts.unshift('"' + this.searchQuery + '"');
      keywords.push(this.searchQuery);
    }

    const title = parts.length > 0 ? parts.join(' — ') : 'Buy & Sell in 50 US States';
    const description = parts.length > 0
      ? `Browse ${parts.join(', ')} listings on MoneyBay. Free classifieds across 50 US states.`
      : 'Free classifieds marketplace for buying and selling items, services, jobs, and real estate across 51 cities in the United States.';

    this.seo.update({
      title,
      description,
      keywords: keywords.join(', '),
      type: 'website'
    });
  }

  loadHierarchy(): void {
    if (this.selectedCategory()) {
      const cat = this.categories().find(c => c.slug === this.selectedCategory()) || null;
      this.currentCategory.set(cat);

      this.api.getSubcategories(this.selectedCategory()!).subscribe({
        next: (data) => {
          this.subcategories.set(data || []);
          if (this.selectedSub()) {
            const sub = data.find((s: Subcategory) => s.slug === this.selectedSub()) || null;
            this.currentSub.set(sub);
            if (sub) {
              // Load subsubcategories (через HttpClient: интерцепторы auth/city/error)
              this.api.getSubcategoryChildren(sub.id).subscribe({
                next: (children: Subcategory[]) => {
                  this.subsubcategories.set(children || []);
                  if (this.selectedSubSub()) {
                    const ss = (children || []).find(c => c.slug === this.selectedSubSub()) || null;
                    this.currentSubSub.set(ss);
                  } else {
                    this.currentSubSub.set(null);
                  }
                },
                error: () => this.subsubcategories.set([])
              });
            }
          } else {
            this.currentSub.set(null);
            this.currentSubSub.set(null);
            this.subsubcategories.set([]);
          }
        },
        error: () => this.subcategories.set([])
      });
    } else {
      this.subcategories.set([]);
      this.subsubcategories.set([]);
      this.currentCategory.set(null);
      this.currentSub.set(null);
      this.currentSubSub.set(null);
    }
  }

  loadListings(append = false): void {
    // Параметры считаются до флага загрузки: по ним видно, лежит ли ответ в
    // кэше. Возврат на главную отдаётся синхронно, и подъём флага вставил бы
    // скелет на один тик — он и виден как мельк.
    const params: any = { page: this.currentPage() };
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.selectedCategory()) params.category = this.selectedCategory();
    if (this.cityFilter) params.city = this.cityFilter;
    if (this.sortBy && this.sortBy !== 'newest') params.sort = this.sortBy;

    const adv = this.advancedFilters();
    if (adv.price_min !== undefined) params.price_min = adv.price_min;
    if (adv.price_max !== undefined) params.price_max = adv.price_max;
    if (adv.has_image) params.has_image = true;
    if (adv.posted_within) params.posted_within = adv.posted_within;

    if (!this.api.hasCachedListings(params)) {
      this.loading.set(true);
      // Объявления прежней страницы не должны висеть под заголовком новой:
      // на их месте показываются заглушки, пока идёт запрос
      this.listings.set([]);
    }

    this.api.getListings(params).subscribe({
      next: (data) => {
        this.listings.set(data.listings || []);
        this.loading.set(false);
        this.pagingNow.set(false);
        this.hasMore.set(data.has_next === true);
        this.totalPages.set(data.total_pages || 1);
        this.totalListings.set(data.total ?? 0);

        // Подстраховка: если высота заглушки не совпала со списком, положение
        // поправляется после его отрисовки. Прокрутка мгновенная, поэтому
        // повторный вызов не заметен.
        if (this.pendingScroll) {
          this.pendingScroll = false;
          requestAnimationFrame(() => this.scrollToListings());
        }
      },
      error: () => {
        this.pagingNow.set(false);
        if (append) {
          this.loadingMore.set(false);
        } else {
          this.listings.set([]);
          this.loading.set(false);
        }
        this.hasMore.set(false);
      }
    });
  }

  /**
   * Переход на страницу через адрес: номер попадает в queryParams, поэтому
   * ссылку можно сохранить, а возврат назад возвращает на прежнюю страницу.
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.currentPage()) return;

    this.pagingNow.set(true);
    this.pendingScroll = true;

    // Прокрутка после перехода, а не до: смена адреса включает восстановление
    // положения (scrollPositionRestoration), которое ставит страницу в начало и
    // перебивает вызов, сделанный раньше.
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge'
    }).then(() => {
      if (typeof window !== 'undefined') {
        // Заглушка уже на месте и занимает высоту списка, поэтому якорь стоит
        // там же, где встанет после прихода данных
        requestAnimationFrame(() => this.scrollToListings());
      }
    });
  }

  private pendingScroll = false;
  /** Идёт переход между страницами: показывается кружок, а не скелет. */
  pagingNow = signal(false);

  /** К началу списка: плитки разделов и поиск листать заново незачем. */
  private scrollToListings(): void {
    if (typeof window === 'undefined') return;
    const anchor = this.listingsAnchor?.nativeElement;
    if (!anchor) return;
    // Небольшой отступ под шапку. Больший подъём уводил выше якоря, на плитки
    // разделов.
    const top = anchor.getBoundingClientRect().top + window.scrollY - 16;
    // Без плавности: страница открывается сразу на объявлениях, а не проезжает
    // туда сверху на глазах у читающего.
    window.scrollTo({ top: Math.max(0, top), behavior: 'auto' });
  }

  onAutocompleteSearch(query: string): void {
    this.searchQuery = query;
    this.search();
  }

  search(): void {
    const params: any = {};
    if (this.searchQuery) params.q = this.searchQuery;
    if (this.cityFilter) params.city = this.cityFilter;
    if (this.selectedCategory()) params.category = this.selectedCategory();

    // Прокрутка к найденному, как при переходе между страницами: иначе человек
    // остаётся на плитке категорий и не видит, что поиск отработал
    this.pendingScroll = true;
    this.router.navigate(['/'], { queryParams: params });
  }

  requestGeo(): void {
    // Explicit user action — allowed to trigger the browser permission prompt
    this.geo.requestLocation(true);
  }

  applyGeoCity(): void {
    const city = this.geo.nearestCity();
    if (city) {
      this.cityFilter = city;
      this.router.navigate(['/'], { queryParams: { city } });
    }
  }

  dismissGeoSuggestion(): void {
    this.geo.nearestCity.set(null);
  }
}
