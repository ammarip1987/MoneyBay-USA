import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { City } from '../models/listing.model';

const RESERVED = new Set(['www', 'api', 'admin', 'localhost']);

@Injectable({ providedIn: 'root' })
export class CityContextService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);

  currentCity = signal<City | null>(null);
  subdomain = signal<string | null>(null);

  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const sub = this.detectSubdomain();
    this.subdomain.set(sub);
    if (!sub) return;

    this.http.get<City>(`${environment.apiUrl}/api/cities/current`, {
      headers: { 'X-City-Subdomain': sub }
    }).subscribe({
      next: (city) => this.currentCity.set(city),
      error: () => this.currentCity.set(null)
    });
  }

  private detectSubdomain(): string | null {
    const host = window.location.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || this.isIp(host)) return null;
    const parts = host.split('.');
    if (parts.length < 2) return null;
    const candidate = parts[0];
    if (RESERVED.has(candidate)) return null;
    return candidate;
  }

  private isIp(host: string): boolean {
    return /^\d{1,3}(\.\d{1,3}){3}$/.test(host);
  }
}
