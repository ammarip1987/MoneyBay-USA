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
        <!-- Фотография берётся из учётной записи Google или Facebook: своя
             не загружается, но показ можно отключить -->
        <div class="flex items-center gap-6 pb-6 border-b border-gray-100">
          <div class="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-mb-blue to-mb-cyan flex items-center justify-center">
            @if (avatarPreview()) {
              <img [src]="avatarPreview()" alt="Avatar" class="w-full h-full object-cover">
            } @else {
              <span class="text-white text-4xl font-bold">{{ initial() }}</span>
            }
          </div>
          <div class="flex-1">
            @if (hasSocialPhoto()) {
              <label class="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" [(ngModel)]="showAvatar" name="showAvatar"
                       (change)="onShowAvatarToggled()"
                       class="w-4 h-4 accent-mb-blue">
                <span class="text-sm text-gray-700">Show my social profile photo</span>
              </label>
              <p class="text-xs text-gray-500 mt-2">
                The picture comes from the account you signed in with. To change it,
                update the photo there and sign in again.
              </p>
            } @else {
              <p class="text-sm text-gray-700">No profile photo</p>
              <p class="text-xs text-gray-500 mt-2">
                Sign in with Google or Facebook to show your photo here.
              </p>
            }
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
  /** Есть ли фотография от Google или Facebook. */
  hasSocialPhoto = signal(false);
  /** Показывать ли её: снимается — профиль возвращается к букве. */
  showAvatar = true;
  initial = () => (this.username || this.auth.currentUser()?.email || '?')[0].toUpperCase();

  /**
   * Фотография берётся из учётной записи, через которую был вход. Загрузка
   * своей не предусмотрена: снимок из социальной сети уже подтверждён ею, а
   * произвольный файл пришлось бы проверять на недопустимое содержимое.
   */
  private applyAvatar(url?: string | null, show?: boolean): void {
    this.hasSocialPhoto.set(!!url);
    this.showAvatar = show !== false;
    this.avatarPreview.set(url && this.showAvatar ? this.api.imageUrl(url) : null);
  }

  onShowAvatarToggled(): void {
    this.api.updateProfile({ showAvatar: this.showAvatar } as any).subscribe({
      next: (user) => this.auth.currentUser.set(user),
      error: () => this.error.set('Could not save the setting')
    });
  }


  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.username = user.username || '';
      this.phone = user.phone || '';
      this.city = user.city || '';
    }
    this.applyAvatar(user?.avatarUrl, user?.showAvatar);
    this.api.getProfile().subscribe({
      next: (data) => {
        this.username = data.username || '';
        this.phone = data.phone || '';
        this.city = data.city || '';
        this.applyAvatar(data.avatarUrl, data.showAvatar);
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
