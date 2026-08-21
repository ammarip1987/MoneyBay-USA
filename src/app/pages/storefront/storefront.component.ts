import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Storefront } from '../../models/storefront.model';

/**
 * My Storefront — витрина продавца.
 *
 * Делится надвое: открытая часть, которую видят покупатели, и Business Profile
 * с проверкой Stripe. Правовые сведения — налоговый номер, юридический адрес,
 * банковский счёт — собирает Stripe на своей стороне; здесь показывается лишь
 * состояние проверки.
 */
@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8 min-page">
      <div class="flex items-center justify-between mb-8 gap-4 flex-wrap">
        <h1 class="text-3xl font-bold text-mb-dark">My Storefront</h1>
        <a routerLink="/profile" class="btn btn-secondary text-sm">← Back to profile</a>
      </div>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{{ error() }}</div>
      }

      @if (loading()) {
        <div class="flex items-center justify-center" style="min-height: 340px;">
          <span class="relative inline-flex items-center justify-center w-16 h-16">
            <span class="absolute inset-0 border-4 border-mb-blue border-t-transparent rounded-full animate-spin"></span>
            <span class="text-2xl font-bold text-mb-blue select-none">M</span>
          </span>
        </div>
      } @else if (!store()) {
        <!-- Витрины ещё нет -->
        <div class="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div class="text-5xl mb-4">🏪</div>
          <h2 class="text-2xl font-bold text-mb-dark mb-2">Open your storefront</h2>
          <p class="text-gray-600 mb-6 max-w-lg mx-auto">
            A storefront gives your listings a shared page with your logo, description
            and contact details — buyers see everything you sell in one place.
          </p>
          <div class="max-w-sm mx-auto space-y-3">
            <input type="text" [(ngModel)]="newName" name="newName" class="form-input"
                   placeholder="Store name" maxlength="60">
            <button (click)="createStore()" class="btn btn-primary w-full" [disabled]="busy()">
              {{ busy() ? 'Creating...' : 'Create storefront' }}
            </button>
          </div>
        </div>
      } @else {
        <!-- Обложка и логотип -->
        <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
          <!-- Store Billboard: обложка магазина. Загружается по нажатию,
               наведение показывает подпись -->
          <div class="h-40 bg-gradient-to-r from-mb-blue to-mb-cyan relative group">
            @if (store()!.bannerUrl) {
              <img [src]="api.imageUrl(store()!.bannerUrl)" alt="" class="w-full h-full object-cover">
            }
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                   #bannerInput (change)="uploadImage('banner', $event)">
            <button type="button" (click)="bannerInput.click()" [disabled]="busy()"
                    class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-sm font-medium">
              <i class="fas fa-camera mr-2"></i>
              {{ store()!.bannerUrl ? 'Change cover' : 'Add cover image' }}
            </button>
          </div>
          <div class="px-8 pb-6">
            <div class="flex items-end gap-5 -mt-12 mb-4 flex-wrap relative z-10">
              <div class="w-24 h-24 rounded-2xl bg-white p-1 shadow-md flex-shrink-0 group relative">
                <div class="w-full h-full rounded-xl overflow-hidden bg-gradient-to-br from-mb-blue to-mb-cyan flex items-center justify-center">
                  @if (store()!.logoUrl) {
                    <img [src]="api.imageUrl(store()!.logoUrl)" alt="" class="w-full h-full object-cover">
                  } @else {
                    <span class="text-white text-3xl font-bold">{{ store()!.name[0].toUpperCase() }}</span>
                  }
                </div>
                <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                       #logoInput (change)="uploadImage('logo', $event)">
                <button type="button" (click)="logoInput.click()" [disabled]="busy()"
                        class="absolute inset-1 rounded-xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs">
                  <i class="fas fa-camera"></i>
                </button>
              </div>
              <div class="flex-1 pb-1">
                <h2 class="text-2xl font-bold text-mb-dark">{{ store()!.name }}</h2>
                <p class="text-sm text-gray-500">moneybay.us/shop/{{ store()!.slug }}</p>
              </div>
              <div class="flex gap-2 pb-1 flex-wrap">
                @if (store()!.published) {
                  <a [routerLink]="['/shop', store()!.slug]" class="btn btn-secondary text-sm">
                    View Public Storefront
                  </a>
                }
              </div>
            </div>

            <!-- Состояние: опубликована или нет -->
            <div class="flex items-center gap-3 pt-4 border-t border-gray-100">
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="published" name="published"
                       (change)="save({ published })" class="w-4 h-4 accent-mb-blue">
                <span class="text-sm text-gray-700">
                  {{ published ? 'Visible to buyers' : 'Hidden — only you can see it' }}
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Edit Storefront -->
        <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h3 class="text-lg font-bold text-mb-dark mb-6 flex items-center">
            <i class="fas fa-store text-mb-blue mr-2"></i> Edit Storefront
          </h3>

          <div class="space-y-5">
            <div class="form-group">
              <label class="form-label">Store Name</label>
              <input type="text" [(ngModel)]="name" name="name" class="form-input" maxlength="60">
            </div>

            <div class="form-group">
              <label class="form-label">About the Business</label>
              <textarea [(ngModel)]="about" name="about" class="form-input" rows="4"
                        maxlength="2000" placeholder="What you sell, how long you have been doing it"></textarea>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="form-group">
                <label class="form-label">Location</label>
                <input type="text" [(ngModel)]="location" name="location" class="form-input"
                       placeholder="Seattle, WA">
                <p class="text-xs text-gray-500 mt-1">City and state only — never a street address.</p>
              </div>

              <div class="form-group">
                <label class="form-label">Business Hours</label>
                <input type="text" [(ngModel)]="hours" name="hours" class="form-input"
                       placeholder="Mon-Fri 9am-6pm">
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div class="form-group">
                <label class="form-label">Customer Support Phone</label>
                <input type="text" [(ngModel)]="phones" name="phones" class="form-input"
                       placeholder="+1 555 000 0000">
                <p class="text-xs text-gray-500 mt-1">Hidden behind a button — buyers tap to reveal it.</p>
              </div>

              <div class="form-group">
                <label class="form-label">Website</label>
                <input type="url" [(ngModel)]="website" name="website" class="form-input"
                       placeholder="https://example.com">
              </div>
            </div>

            <div class="pt-4 border-t border-gray-100">
              <button (click)="saveAll()" class="btn btn-primary" [disabled]="busy()">
                {{ busy() ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Business Profile: проверка Stripe -->
        <div class="bg-white rounded-2xl shadow-lg p-8">
          <h3 class="text-lg font-bold text-mb-dark mb-2 flex items-center">
            <i class="fas fa-shield-halved text-mb-blue mr-2"></i> Business Profile
          </h3>
          <p class="text-sm text-gray-600 mb-6">
            Required before you can be paid through MoneyBay. Your tax number, legal
            address and bank details are collected by Stripe and never stored here.
          </p>

          <div class="flex items-center gap-4 flex-wrap">
            @switch (store()!.verificationStatus) {
              @case ('VERIFIED') {
                <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium">
                  <i class="fas fa-circle-check"></i> Verified
                </span>
                <span class="text-sm text-gray-600">Payouts are enabled.</span>
              }
              @case ('PENDING') {
                <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 text-sm font-medium">
                  <i class="fas fa-hourglass-half"></i> Under review
                </span>
                <span class="text-sm text-gray-600">Stripe is checking your documents. This usually takes a day.</span>
              }
              @case ('REJECTED') {
                <span class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 text-red-700 text-sm font-medium">
                  <i class="fas fa-circle-xmark"></i> Not verified
                </span>
                <span class="text-sm text-gray-600">Something did not match. Start again with corrected details.</span>
              }
              @default {
                <button class="btn btn-primary" disabled>
                  Activate Business Account
                </button>
                <span class="text-sm text-gray-500">Available once payments go live.</span>
              }
            }
          </div>
        </div>
      }
    </div>
  `
})
export class StorefrontComponent implements OnInit {
  api = inject(ApiService);

  store = signal<Storefront | null>(null);
  loading = signal(true);
  busy = signal(false);
  error = signal<string | null>(null);

  newName = '';
  name = '';
  about = '';
  location = '';
  phones = '';
  website = '';
  hours = '';
  published = false;

  ngOnInit(): void {
    this.api.getMyStorefront().subscribe({
      next: (s) => {
        this.apply(s);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private apply(s: Storefront | null): void {
    this.store.set(s);
    if (!s) return;
    this.name = s.name || '';
    this.about = s.about || '';
    this.location = s.location || '';
    this.phones = s.phones || '';
    this.website = s.website || '';
    this.hours = s.hours || '';
    this.published = s.published;
  }

  createStore(): void {
    const name = this.newName.trim();
    if (name.length < 3) {
      this.error.set('Store name is too short');
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    this.api.createStorefront(name).subscribe({
      next: (s) => {
        this.apply(s);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not create the storefront');
        this.busy.set(false);
      }
    });
  }

  /** Логотип или обложка. Уменьшается в браузере, чтобы не слать мегабайты. */
  async uploadImage(kind: 'logo' | 'banner', event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.busy.set(true);
    this.error.set(null);

    try {
      // Логотип квадратный, обложка широкая — отсюда разные размеры
      const resized = kind === 'logo'
        ? await this.resize(file, 512, 512, true)
        : await this.resize(file, 1600, 400, false);

      this.api.uploadStorefrontImage(kind, resized).subscribe({
        next: (s) => {
          this.apply(s);
          this.busy.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Could not upload the image');
          this.busy.set(false);
        }
      });
    } catch {
      this.error.set('Could not read the image');
      this.busy.set(false);
    } finally {
      input.value = '';
    }
  }

  /** Уменьшение с обрезкой по центру: square — до квадрата, иначе по ширине. */
  private resize(file: File, w: number, h: number, square: boolean): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));

        if (square) {
          const side = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2,
                        side, side, 0, 0, w, h);
        } else {
          // Обложка: берётся полоса нужного соотношения из середины снимка
          const ratio = w / h;
          let sw = img.width;
          let sh = sw / ratio;
          if (sh > img.height) {
            sh = img.height;
            sw = sh * ratio;
          }
          ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2,
                        sw, sh, 0, 0, w, h);
        }

        URL.revokeObjectURL(img.src);
        canvas.toBlob(
          blob => blob
            ? resolve(new File([blob], 'image.webp', { type: 'image/webp' }))
            : reject(new Error('no blob')),
          'image/webp',
          0.85
        );
      };
      img.onerror = () => reject(new Error('bad image'));
      img.src = URL.createObjectURL(file);
    });
  }

  saveAll(): void {
    this.save({
      name: this.name,
      about: this.about,
      location: this.location,
      phones: this.phones,
      website: this.website,
      hours: this.hours
    });
  }

  save(data: Partial<Storefront>): void {
    this.busy.set(true);
    this.error.set(null);
    this.api.updateStorefront(data).subscribe({
      next: (s) => {
        this.apply(s);
        this.busy.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Could not save');
        this.busy.set(false);
      }
    });
  }
}
