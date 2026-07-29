import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { swRegistrationTrigger$ } from './sw-registration-trigger';

export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface CityDistance {
  name: string;
  distance: number;
}

const US_CITIES_GEO: Record<string, [number, number]> = {
  'New York, NY': [40.7128, -74.0060],
  'Los Angeles, CA': [34.0522, -118.2437],
  'Chicago, IL': [41.8781, -87.6298],
  'Houston, TX': [29.7604, -95.3698],
  'Phoenix, AZ': [33.4484, -112.0740],
  'Philadelphia, PA': [39.9526, -75.1652],
  'San Antonio, TX': [29.4241, -98.4936],
  'San Diego, CA': [32.7157, -117.1611],
  'Dallas, TX': [32.7767, -96.7970],
  'San Jose, CA': [37.3382, -121.8863],
  'Austin, TX': [30.2672, -97.7431],
  'Jacksonville, FL': [30.3322, -81.6557],
  'Fort Worth, TX': [32.7555, -97.3308],
  'Columbus, OH': [39.9612, -82.9988],
  'Indianapolis, IN': [39.7684, -86.1581],
  'Charlotte, NC': [35.2271, -80.8431],
  'Seattle, WA': [47.6062, -122.3321],
  'Denver, CO': [39.7392, -104.9903],
  'Washington, DC': [38.9072, -77.0369],
  'Boston, MA': [42.3601, -71.0589],
  'Nashville, TN': [36.1627, -86.7816],
  'Detroit, MI': [42.3314, -83.0458],
  'Portland, OR': [45.5152, -122.6784],
  'Las Vegas, NV': [36.1699, -115.1398],
  'Memphis, TN': [35.1495, -90.0490],
  'Louisville, KY': [38.2527, -85.7585],
  'Baltimore, MD': [39.2904, -76.6122],
  'Milwaukee, WI': [43.0389, -87.9065],
  'Albuquerque, NM': [35.0844, -106.6504],
  'Sacramento, CA': [38.5816, -121.4944],
  'Kansas City, MO': [39.0997, -94.5786],
  'Atlanta, GA': [33.7490, -84.3880],
  'New Orleans, LA': [29.9511, -90.0715],
  'Cleveland, OH': [41.4993, -81.6944],
  'Oakland, CA': [37.8044, -122.2712],
  'Miami, FL': [25.7617, -80.1918],
  'Tulsa, OK': [36.1540, -95.9928],
  'Tampa, FL': [27.9506, -82.4572],
  'San Francisco, CA': [37.7749, -122.4194],
  'Asheville, NC': [35.5951, -82.5515]
};

@Injectable({ providedIn: 'root' })
export class GeolocationService {
  private platformId = inject(PLATFORM_ID);

  position = signal<GeoPosition | null>(null);
  nearestCity = signal<string | null>(null);
  status = signal<'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable'>('idle');

  isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async requestLocation(fromUserGesture = false): Promise<GeoPosition | null> {
    if (!this.isBrowser() || !navigator.geolocation) {
      this.status.set('unavailable');
      return null;
    }

    // Never trigger the browser permission prompt without a real user gesture
    // (click on "Find listings near me"). Any accidental programmatic call
    // while the page is loading is silently ignored instead of prompting.
    const userActivation = (navigator as { userActivation?: { isActive: boolean } }).userActivation;
    if (!fromUserGesture && userActivation && !userActivation.isActive) {
      return null;
    }

    // Genuine user action — allow the service worker to register now
    swRegistrationTrigger$.next();

    this.status.set('requesting');

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const result: GeoPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy
          };
          this.position.set(result);
          this.status.set('granted');
          this.nearestCity.set(this.findNearestCity(result.latitude, result.longitude));
          resolve(result);
        },
        (err) => {
          this.status.set(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
          resolve(null);
        },
        { timeout: 10000, maximumAge: 300000, enableHighAccuracy: false }
      );
    });
  }

  findNearestCity(lat: number, lng: number): string {
    let nearest = '';
    let minDist = Infinity;
    for (const [city, [cityLat, cityLng]] of Object.entries(US_CITIES_GEO)) {
      const d = this.haversine(lat, lng, cityLat, cityLng);
      if (d < minDist) {
        minDist = d;
        nearest = city;
      }
    }
    return nearest;
  }

  nearbyCity(lat: number, lng: number, maxKm = 200): CityDistance[] {
    return Object.entries(US_CITIES_GEO)
      .map(([name, [cLat, cLng]]) => ({
        name,
        distance: this.haversine(lat, lng, cLat, cLng)
      }))
      .filter(c => c.distance <= maxKm)
      .sort((a, b) => a.distance - b.distance);
  }

  private haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2))
      * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * Math.PI / 180;
  }
}
