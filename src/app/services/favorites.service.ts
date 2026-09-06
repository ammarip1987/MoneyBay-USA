import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

/**
 * Опознания избранных объявлений, общие на всё приложение.
 *
 * Прежде каждая карточка держала своё состояние и брала его из поля
 * is_favorited в ответе о списке. Поля этого сервер не отдаёт, поэтому звезда
 * всегда рисовалась пустой: нажатие уходило в базу, но после перехода по
 * страницам или перезагрузки отметка пропадала с виду.
 *
 * Здесь список опознаний хранится один раз и запрашивается один раз за вход.
 * Карточки читают его, а не собственное поле.
 */
@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  private readonly ids = signal<Set<number>>(new Set());
  private loaded = false;

  constructor() {
    // Выход из учётной записи: отметки прежнего посетителя показывать нельзя,
    // а вход под другим именем требует запросить список заново
    effect(() => {
      if (!this.auth.isAuthenticated()) {
        this.ids.set(new Set());
        this.loaded = false;
      }
    });
  }

  /** Опознания избранного. Пусто, пока список не пришёл. */
  readonly favoriteIds = computed(() => this.ids());

  /** Избрано ли объявление. */
  isFavorite(listingId: number): boolean {
    return this.ids().has(listingId);
  }

  /**
   * Список избранного с сервера. Вызывается при первом появлении карточек;
   * повторные вызовы ничего не делают, чтобы не запрашивать на каждой странице.
   */
  load(): void {
    if (this.loaded || !this.auth.isAuthenticated()) return;
    this.loaded = true;
    this.api.getFavorites().subscribe({
      next: (list) => this.ids.set(new Set((list || []).map(l => l.id))),
      // Отказ оставляет список пустым: звёзды пустые, нажатие по-прежнему работает
      error: () => { this.loaded = false; }
    });
  }

  /** Отметка после ответа сервера. */
  set(listingId: number, favorited: boolean): void {
    this.ids.update(prev => {
      const next = new Set(prev);
      if (favorited) {
        next.add(listingId);
      } else {
        next.delete(listingId);
      }
      return next;
    });
  }
}
