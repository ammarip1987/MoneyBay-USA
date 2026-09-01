import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, filter } from 'rxjs/operators';
import { ApiService, ListingSuggestion } from '../../services/api.service';
import { CityContextService } from '../../services/city-context.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-search-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="relative w-full" #wrapper>
      <!-- Значок слева: кнопки Search больше нет, поиск идёт по Enter, и значок
           один показывает назначение поля -->
      <i class="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-mb-blue pointer-events-none"></i>
      <input
        #input
        type="text"
        [(ngModel)]="query"
        (ngModelChange)="onInput($event)"
        (focus)="onFocus()"
        (keydown)="onKey($event)"
        [placeholder]="placeholder"
        autocomplete="off"
        class="w-full pl-11 pr-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-0 text-gray-800 text-sm">

      @if (open() && (loading() || suggestions().length > 0 || (query.length >= 2 && !loading()))) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
          @if (loading()) {
            <div class="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <span class="inline-block w-4 h-4 border-2 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
              Searching...
            </div>
          } @else if (suggestions().length === 0 && query.length >= 2) {
            <div class="px-4 py-3 text-sm text-gray-500">
              No suggestions. Press Enter to search "<strong>{{ query }}</strong>".
            </div>
          } @else {
            @for (item of suggestions(); track item.id; let i = $index) {
              <a [routerLink]="['/listing', item.id]"
                 (click)="onSelect()"
                 [class.bg-blue-50]="i === highlighted()"
                 class="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0">
                @if (item.image) {
                  <img [src]="getImageUrl(item.image)" [alt]="item.title" class="w-12 h-12 object-cover rounded" width="48" height="48" loading="lazy" decoding="async">
                } @else {
                  <div class="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400">
                    <i class="fas fa-image"></i>
                  </div>
                }
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 truncate">{{ item.title }}</div>
                  <div class="text-xs text-gray-500 truncate">{{ item.location }}</div>
                </div>
                <div class="font-bold text-mb-blue text-sm whitespace-nowrap">\${{ item.price | number:'1.0-2' }}</div>
              </a>
            }
            <button (click)="onSubmit()" class="block w-full text-left px-4 py-2 text-sm text-mb-blue hover:bg-blue-50 font-medium border-t border-gray-200">
              See all results for "{{ query }}" →
            </button>
          }
        </div>
      }
    </div>
  `
})
export class SearchAutocompleteComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Search listings...';
  @Input() initialQuery = '';
  @Output() search = new EventEmitter<string>();

  @ViewChild('wrapper') wrapper!: ElementRef;
  @ViewChild('input') inputEl!: ElementRef<HTMLInputElement>;

  private api = inject(ApiService);
  private router = inject(Router);
  private cityCtx = inject(CityContextService);

  query = '';
  open = signal(false);
  loading = signal(false);
  suggestions = signal<ListingSuggestion[]>([]);
  highlighted = signal(-1);

  private input$ = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.query = this.initialQuery;
    this.sub = this.input$.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      filter((q) => q.length >= 2),
      switchMap((q) => {
        this.loading.set(true);
        const cityName = this.cityCtx.currentCity()?.name;
        return this.api.suggestListings(q, cityName, 8).pipe(
          catchError(() => of([]))
        );
      })
    ).subscribe((results) => {
      this.suggestions.set(results);
      this.loading.set(false);
      this.highlighted.set(-1);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(value: string): void {
    this.open.set(true);
    if (value.length < 2) {
      this.suggestions.set([]);
      this.loading.set(false);
    } else {
      this.input$.next(value);
    }
  }

  onFocus(): void {
    if (this.query.length >= 2) {
      this.open.set(true);
    }
  }

  onSelect(): void {
    this.open.set(false);
  }

  onSubmit(): void {
    this.open.set(false);
    if (this.query.trim()) {
      this.search.emit(this.query.trim());
    }
  }

  onKey(event: KeyboardEvent): void {
    const items = this.suggestions();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.highlighted.set(Math.min(this.highlighted() + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.highlighted.set(Math.max(this.highlighted() - 1, -1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const idx = this.highlighted();
      if (idx >= 0 && idx < items.length) {
        this.router.navigate(['/listing', items[idx].id]);
        this.open.set(false);
      } else {
        this.onSubmit();
      }
    } else if (event.key === 'Escape') {
      this.open.set(false);
      this.highlighted.set(-1);
    }
  }

  getImageUrl(image: string): string {
    return this.api.imageUrl(image);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.wrapper && !this.wrapper.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
