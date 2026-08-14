import {
  Component, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output,
  ElementRef, ViewChild, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { ApiService, UsCitySuggestion } from '../../services/api.service';

/**
 * Поле City / Area с автоподстановкой городов выбранного штата.
 * Пока штат не выбран, поле заблокировано: список городов зависит от штата.
 */
@Component({
  selector: 'app-city-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative" #wrapper>
      <input
        type="text"
        [(ngModel)]="value"
        (ngModelChange)="onInput($event)"
        (focus)="onFocus()"
        (keydown)="onKey($event)"
        [disabled]="!state"
        [placeholder]="state ? placeholder : 'Select a state first'"
        autocomplete="off"
        class="form-input disabled:bg-gray-100 disabled:cursor-not-allowed">

      @if (open() && (loading() || suggestions().length > 0)) {
        <div class="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-40 max-h-72 overflow-y-auto">
          @if (loading()) {
            <div class="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
              <span class="inline-block w-4 h-4 border-2 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
              Searching...
            </div>
          } @else {
            @for (c of suggestions(); track c.name + c.state_code; let i = $index) {
              <button type="button" (click)="pick(c)"
                      [class.bg-blue-50]="i === highlighted()"
                      class="w-full text-left px-4 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 flex items-center justify-between gap-2">
                <span class="font-medium text-gray-900">{{ c.name }}</span>
                <span class="text-xs text-gray-500">{{ c.state_code }}</span>
              </button>
            }
          }
        </div>
      }
    </div>
  `
})
export class CityAutocompleteComponent implements OnInit, OnDestroy {
  /** Полное название штата, например "California". */
  @Input() state = '';
  @Input() value = '';
  @Input() placeholder = 'Start typing a city';
  @Output() valueChange = new EventEmitter<string>();

  @ViewChild('wrapper') wrapper!: ElementRef;

  private api = inject(ApiService);

  open = signal(false);
  loading = signal(false);
  suggestions = signal<UsCitySuggestion[]>([]);
  highlighted = signal(-1);

  private input$ = new Subject<string>();
  private sub?: Subscription;

  ngOnInit(): void {
    this.sub = this.input$.pipe(
      debounceTime(200),
      distinctUntilChanged(),
      switchMap((q) => {
        if (!this.state) return of([]);
        this.loading.set(true);
        return this.api.suggestUsCities(this.state, q, 10).pipe(catchError(() => of([])));
      })
    ).subscribe((list) => {
      this.suggestions.set(list);
      this.loading.set(false);
      this.highlighted.set(-1);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  onInput(v: string): void {
    this.valueChange.emit(v);
    if (!this.state) return;
    this.open.set(true);
    this.input$.next(v);
  }

  /** До ввода показываются крупнейшие города штата — пустой запрос. */
  onFocus(): void {
    if (!this.state) return;
    this.open.set(true);
    this.input$.next(this.value || '');
  }

  pick(c: UsCitySuggestion): void {
    this.value = c.name;
    this.valueChange.emit(c.name);
    this.open.set(false);
    this.highlighted.set(-1);
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
      const i = this.highlighted();
      if (i >= 0 && i < items.length) {
        event.preventDefault();
        this.pick(items[i]);
      }
    } else if (event.key === 'Escape') {
      this.open.set(false);
      this.highlighted.set(-1);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.wrapper && !this.wrapper.nativeElement.contains(event.target)) {
      this.open.set(false);
    }
  }
}
