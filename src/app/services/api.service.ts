import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Listing, Category, City, User, Message, PaginatedListings } from '../models/listing.model';

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
  similar_price: Listing[];
  from_seller: Listing[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

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
    return this.http.get<PaginatedListings>(`${this.baseUrl}/api/listings`, { params: httpParams });
  }

  getFacets(category?: string, city?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (category) httpParams = httpParams.set('category', category);
    if (city) httpParams = httpParams.set('city', city);
    return this.http.get<any>(`${this.baseUrl}/api/listings/facets`, { params: httpParams });
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
    return this.http.post<Listing>(`${this.baseUrl}/api/listings`, data);
  }

  updateListing(id: number, data: FormData): Observable<Listing> {
    return this.http.put<Listing>(`${this.baseUrl}/api/listings/${id}`, data);
  }

  deleteListing(id: number): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/api/listings/${id}`);
  }

  getMyListings(): Observable<Listing[]> {
    return this.http.get<Listing[]>(`${this.baseUrl}/api/my-listings`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/api/categories`);
  }

  getCities(): Observable<City[]> {
    return this.http.get<City[]>(`${this.baseUrl}/api/cities`);
  }

  getSubcategories(categorySlug: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/subcategories/category/${categorySlug}`);
  }

  getSubcategoryChildren(subcategoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/subcategories/${subcategoryId}/children`);
  }

  /** 51 штат плюс DC для выпадающего списка State. */
  getStates(): Observable<UsState[]> {
    return this.http.get<UsState[]>(`${this.baseUrl}/api/states`);
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

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/api/unread-messages-count`);
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/conversations`);
  }

  getChatMessages(otherUserId: number): Observable<Message[]> {
    return this.http.get<Message[]>(`${this.baseUrl}/api/chats/${otherUserId}/messages`);
  }

  sendMessage(otherUserId: number, content: string): Observable<Message> {
    return this.http.post<Message>(`${this.baseUrl}/api/chats/${otherUserId}/messages`, { content });
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
    return this.http.get<Listing[]>(`${this.baseUrl}/api/favorites`);
  }

  toggleFavorite(listingId: number): Observable<{ success: boolean; liked: boolean }> {
    return this.http.post<{ success: boolean; liked: boolean }>(
      `${this.baseUrl}/listing/${listingId}/like`,
      {},
      { headers: { 'X-Requested-With': 'XMLHttpRequest' } }
    );
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
