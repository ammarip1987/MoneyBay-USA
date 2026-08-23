import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Listing, Category, City, User, Message, PaginatedListings } from '../models/listing.model';
import { Storefront, PublicStorefront } from '../models/storefront.model';

export interface ListingSuggestion {
  id: number;
  title: string;
  price: number;
  location: string;
  image: string | null;
}

export interface UsCitySuggestion {
  name: string;
  state_code: string;
  /** "Chicago, IL" — формат, в котором город хранится в listings.location */
  display_name: string;
  population: number;
}

export interface UsState {
  code: string;
  name: string;
}

export interface SimilarListings {
  same_location: Listing[];
  /** Тот же раздел по всей площадке, за вычетом города объявления. */
  anywhere: Listing[];
  similar_price: Listing[];
  from_seller: Listing[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Кэш для запросов, которые повторяются при возврате из объявления: лента,
   * фасеты, справочники.
   *
   * Двухступенчатый. До cacheTtlMs ответ считается свежим и отдаётся как есть.
   * Дальше и до staleTtlMs — отдаётся сразу же, а запрос уходит в фоне и
   * обновляет значение к следующему разу. Возврат на главную поэтому мгновенный
   * при любой давности, а не только в первые секунды: запрос ленты идёт около
   * полусекунды, и всё это время под плитками висели бы заглушки.
   */
  private readonly cache = new Map<string, { at: number; value: unknown }>();
  private readonly cacheTtlMs = 20_000;
  private readonly staleTtlMs = 5 * 60_000;
  private readonly refreshing = new Set<string>();

  private cached<T>(key: string, request: () => Observable<T>): Observable<T> {
    const hit = this.cache.get(key);
    const age = hit ? Date.now() - hit.at : Infinity;

    if (hit && age < this.cacheTtlMs) {
      return of(hit.value as T);
    }

    if (hit && age < this.staleTtlMs) {
      // Один фоновый запрос на ключ: без этого частые переходы туда-обратно
      // порождают их пачками
      if (!this.refreshing.has(key)) {
        this.refreshing.add(key);
        request().subscribe({
          next: value => this.cache.set(key, { at: Date.now(), value }),
          error: () => {},
          complete: () => this.refreshing.delete(key)
        });
      }
      return of(hit.value as T);
    }

    return request().pipe(tap(value => this.cache.set(key, { at: Date.now(), value })));
  }

  /** Сбрасывает кэш: вызывается после создания, правки или удаления объявления. */
  invalidateListingsCache(): void {
    this.cache.clear();
  }

  /**
   * Лежит ли ответ в кэше. Попадание отдаётся синхронно, поэтому вызывающему
   * не нужно поднимать флаг загрузки: скелет иначе вставляется и убирается в
   * пределах одного тика и виден как мельк.
   */
  hasCachedListings(params: Record<string, unknown> = {}): boolean {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    const hit = this.cache.get(`listings?${httpParams.toString()}`);
    return !!hit && Date.now() - hit.at < this.staleTtlMs;
  }

  getListings(params: {
    page?: number;
    q?: string;
    category?: string;
    city?: string;
    sort?: string;
    price_min?: number;
    price_max?: number;
    has_image?: boolean;
    posted_within?: number;
  } = {}): Observable<PaginatedListings> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false && value !== null) {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.cached(`listings?${httpParams.toString()}`, () =>
      this.http.get<PaginatedListings>(`${this.baseUrl}/api/listings`, { params: httpParams }));
  }

  getFacets(category?: string, city?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (category) httpParams = httpParams.set('category', category);
    if (city) httpParams = httpParams.set('city', city);
    return this.cached(`facets?${httpParams.toString()}`, () =>
      this.http.get<any>(`${this.baseUrl}/api/listings/facets`, { params: httpParams }));
  }

  getListing(id: number): Observable<Listing> {
    return this.http.get<Listing>(`${this.baseUrl}/api/listings/${id}`);
  }

  suggestListings(q: string, city?: string, limit = 8): Observable<ListingSuggestion[]> {
    let httpParams = new HttpParams().set('q', q).set('limit', String(limit));
    if (city) httpParams = httpParams.set('city', city);
    return this.http.get<ListingSuggestion[]>(`${this.baseUrl}/api/listings/suggest`, { params: httpParams });
  }

  getSimilarListings(id: number): Observable<SimilarListings> {
    return this.http.get<SimilarListings>(`${this.baseUrl}/api/listings/${id}/similar`);
  }

  createListing(data: FormData): Observable<Listing> {
    this.invalidateListingsCache();
    return this.http.post<Listing>(`${this.baseUrl}/api/listings`, data);
  }

  updateListing(id: number, data: FormData): Observable<Listing> {
    this.invalidateListingsCache();
    return this.http.put<Listing>(`${this.baseUrl}/api/listings/${id}`, data);
  }

  deleteListing(id: number): Observable<{ success: boolean }> {
    this.invalidateListingsCache();
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/api/listings/${id}`);
  }

  getMyListings(): Observable<Listing[]> {
    return this.cached('my-listings', () =>
      this.http.get<Listing[]>(`${this.baseUrl}/api/my-listings`));
  }

  hasCached(key: string): boolean {
    const hit = this.cache.get(key);
    return !!hit && Date.now() - hit.at < this.staleTtlMs;
  }

  /**
   * Категории живут в сервисе, а не в компоненте: главная уничтожается при
   * уходе и создаётся заново при возврате, поэтому её поле каждый раз
   * стартовало пустым и плитки перерисовывались. Сервис переживает переходы,
   * значит список уже на месте к первому кадру.
   */
  readonly categories = signal<Category[]>([]);

  getCategories(): Observable<Category[]> {
    // Запись в сигнал внутри запроса, а не после cached: фоновое обновление
    // подписывается на запрос напрямую и внешний tap не выполнило бы
    return this.cached('categories', () =>
      this.http.get<Category[]>(`${this.baseUrl}/api/categories`)
        .pipe(tap(list => this.categories.set(list)))
    ).pipe(tap(list => this.categories.set(list)));
  }

  getCities(): Observable<City[]> {
    return this.cached('cities', () =>
      this.http.get<City[]>(`${this.baseUrl}/api/cities`));
  }

  getSubcategories(categorySlug: string): Observable<any[]> {
    return this.cached(`subcategories/${categorySlug}`, () =>
      this.http.get<any[]>(`${this.baseUrl}/api/subcategories/category/${categorySlug}`));
  }

  getSubcategoryChildren(subcategoryId: number): Observable<any[]> {
    return this.cached(`subcategory-children/${subcategoryId}`, () =>
      this.http.get<any[]>(`${this.baseUrl}/api/subcategories/${subcategoryId}/children`));
  }

  /** 51 штат плюс DC для выпадающего списка State. */
  getStates(): Observable<UsState[]> {
    return this.cached('states', () =>
      this.http.get<UsState[]>(`${this.baseUrl}/api/states`));
  }

  /** Города выбранного штата для автоподстановки в поле City / Area. */
  suggestUsCities(state: string, q = '', limit = 10): Observable<UsCitySuggestion[]> {
    const params = new HttpParams()
      .set('state', state)
      .set('q', q)
      .set('limit', String(limit));
    return this.http.get<UsCitySuggestion[]>(`${this.baseUrl}/api/us-cities`, { params });
  }

  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/api/profile`);
  }

  updateProfile(data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/api/profile`, data);
  }

  /**
   * Закрыть учётную запись. Объявления скрываются сразу, данные стираются через
   * месяц — до тех пор закрытие можно отменить.
   */
  deleteAccount(password: string): Observable<{ success: boolean; deletion_scheduled_at: string }> {
    return this.http.post<{ success: boolean; deletion_scheduled_at: string }>(
      `${this.baseUrl}/api/profile/delete`, { password });
  }

  cancelAccountDeletion(): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(
      `${this.baseUrl}/api/profile/delete/cancel`, {});
  }

  // --- Витрина продавца ---

  /** Витрина текущего пользователя; null, если не заведена. */
  getMyStorefront(): Observable<Storefront | null> {
    return this.http.get<Storefront | null>(`${this.baseUrl}/api/storefront/mine`);
  }

  createStorefront(name: string): Observable<Storefront> {
    return this.http.post<Storefront>(`${this.baseUrl}/api/storefront`, { name });
  }

  updateStorefront(data: Partial<Storefront>): Observable<Storefront> {
    return this.http.put<Storefront>(`${this.baseUrl}/api/storefront`, data);
  }

  /** Логотип или обложка магазина. */
  uploadStorefrontImage(kind: 'logo' | 'banner', file: File): Observable<Storefront> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<Storefront>(`${this.baseUrl}/api/storefront/image/${kind}`, form);
  }

  /** Открытая страница магазина по адресу. */
  getPublicStorefront(slug: string): Observable<PublicStorefront> {
    return this.http.get<PublicStorefront>(`${this.baseUrl}/api/storefront/${slug}`);
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/api/unread-messages-count`);
  }

  getConversations(): Observable<any[]> {
    return this.cached('conversations', () =>
      this.http.get<any[]>(`${this.baseUrl}/api/conversations`));
  }

  /** Лежит ли список переписок в кэше — см. hasCachedListings. */
  hasCachedConversations(): boolean {
    const hit = this.cache.get('conversations');
    return !!hit && Date.now() - hit.at < this.staleTtlMs;
  }

  /** Сбрасывает список переписок: новое сообщение меняет порядок и счётчики. */
  invalidateConversationsCache(): void {
    this.cache.delete('conversations');
  }

  getChatMessages(otherUserId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/api/chats/${otherUserId}/messages`);
  }

  sendMessage(otherUserId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/api/chats/${otherUserId}/messages`, { content }).pipe(
      // Отправка меняет порядок переписок и последнее сообщение в списке
      tap(() => this.invalidateConversationsCache())
    );
  }

  uploadChatPhoto(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    // Backend returns a plain-text URL, not JSON
    return this.http.post(`${this.baseUrl}/api/photos/upload`, formData, { responseType: 'text' });
  }

  /**
   * Единая точка построения URL изображений.
   * Хранимые значения: абсолютные URL, пути вида /api/photos/<file> (R2)
   * или голые имена файлов из старого /api/uploads.
   */
  imageUrl(image: string | null | undefined): string {
    if (!image) return '';
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    if (image.startsWith('/')) return `${this.baseUrl}${image}`;
    return `${this.baseUrl}/api/uploads/${image}`;
  }

  getFavorites(): Observable<Listing[]> {
    return this.cached('favorites', () =>
      this.http.get<Listing[]>(`${this.baseUrl}/api/favorites`));
  }

  toggleFavorite(listingId: number): Observable<{ success: boolean; liked: boolean }> {
    return this.http.post<{ success: boolean; liked: boolean }>(
      `${this.baseUrl}/listing/${listingId}/like`,
      {},
      { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
      // Список избранного меняется сразу же
    ).pipe(tap(() => this.cache.delete('favorites')));
  }

  createBoostCheckout(listingId: number, hours: number): Observable<{ checkout_url: string }> {
    return this.http.post<{ checkout_url: string }>(`${this.baseUrl}/api/boost/checkout`, {
      listing_id: listingId,
      hours
    });
  }

  forgotPassword(email: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/api/auth/reset-password`, { token, password });
  }

  flagListing(listingId: number, reason: string, description: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('reason', reason);
    if (description) {
      params = params.set('description', description);
    }
    return this.http.post<any>(`${this.baseUrl}/api/listings/${listingId}/flag`, {}, { params });
  }
}
