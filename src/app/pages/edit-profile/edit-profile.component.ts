import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto px-4 py-8 min-page">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">Edit Profile</h1>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{{ error() }}</div>
      }

      <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <!-- Аватар: снимок уменьшается до 400x400 в браузере, поэтому на
             сервер уходит несколько десятков килобайт вместо мегабайтов -->
        <div class="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div class="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-mb-blue to-mb-cyan flex items-center justify-center">
            @if (avatarPreview()) {
              <img [src]="avatarPreview()" alt="Avatar" class="w-full h-full object-cover">
            } @else {
              <span class="text-white text-4xl font-bold">{{ initial() }}</span>
            }
          </div>
          <div>
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                   #avatarInput (change)="onAvatarPicked($event)">
            <button type="button" (click)="avatarInput.click()"
                    class="btn btn-secondary text-sm" [disabled]="avatarBusy()">
              {{ avatarBusy() ? 'Uploading...' : 'Change photo' }}
            </button>
            <p class="text-xs text-gray-500 mt-2">JPEG, PNG or WebP. Square crop, resized to 400×400.</p>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Username</label>
          <input type="text" [(ngModel)]="username" name="username" class="form-input" minlength="3">
        </div>

        <div class="form-group">
          <label class="form-label">Phone</label>
          <input type="tel" [(ngModel)]="phone" name="phone" class="form-input">
        </div>

        <div class="form-group">
          <label class="form-label">City</label>
          <input type="text" [(ngModel)]="city" name="city" class="form-input">
        </div>

        <div class="flex gap-3 pt-4 border-t border-gray-100">
          <button type="submit" class="btn btn-primary flex-1" [disabled]="loading()">
            {{ loading() ? 'Saving...' : 'Save Changes' }}
          </button>
          <button type="button" (click)="cancel()" class="btn btn-secondary">Cancel</button>
        </div>
      </form>
    </div>
  `
})
export class EditProfileComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private router = inject(Router);

  username = '';
  phone = '';
  city = '';
  loading = signal(false);
  error = signal<string | null>(null);

  avatarPreview = signal<string | null>(null);
  avatarBusy = signal(false);
  initial = () => (this.username || this.auth.currentUser()?.email || '?')[0].toUpperCase();

  /**
   * Снимок обрезается до квадрата по короткой стороне и уменьшается до 400x400
   * прямо в браузере: на сервер уходит несколько десятков килобайт вместо
   * мегабайтов, и аватар везде одного размера.
   */
  async onAvatarPicked(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.avatarBusy.set(true);
    this.error.set(null);

    try {
      const square = await this.toSquare(file, 400);
      // Показываем сразу, не дожидаясь ответа сервера
      this.avatarPreview.set(URL.createObjectURL(square));

      this.api.uploadAvatar(square).subscribe({
        next: (user) => {
          this.auth.currentUser.set(user);
          this.avatarBusy.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to upload avatar');
          this.avatarPreview.set(null);
          this.avatarBusy.set(false);
        }
      });
    } catch {
      this.error.set('Could not read the image');
      this.avatarBusy.set(false);
    } finally {
      input.value = '';
    }
  }

  /** Обрезка по центру до квадрата и уменьшение до заданной стороны. */
  private toSquare(file: File, size: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('no canvas'));

        ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
        URL.revokeObjectURL(img.src);

        canvas.toBlob(
          blob => blob
            ? resolve(new File([blob], 'avatar.webp', { type: 'image/webp' }))
            : reject(new Error('no blob')),
          'image/webp',
          0.85
        );
      };
      img.onerror = () => reject(new Error('bad image'));
      img.src = URL.createObjectURL(file);
    });
  }

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.username = user.username || '';
      this.phone = user.phone || '';
      this.city = user.city || '';
    }
    if (user?.avatarUrl) this.avatarPreview.set(this.api.imageUrl(user.avatarUrl));
    this.api.getProfile().subscribe({
      next: (data) => {
        this.username = data.username || '';
        this.phone = data.phone || '';
        this.city = data.city || '';
        if (data.avatarUrl) this.avatarPreview.set(this.api.imageUrl(data.avatarUrl));
      }
    });
  }

  onSubmit(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.updateProfile({
      username: this.username,
      phone: this.phone,
      city: this.city
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Failed to update profile');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/profile']);
  }
}
