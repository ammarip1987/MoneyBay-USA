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
              <!-- Подсказка стоит одна, без надписи об отсутствии снимка: пустое
                   место и так видно, а две строки об одном читаются как укор -->
              <p class="text-sm text-gray-600">
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

      <!-- Закрытие учётной записи стоит отдельно и последним: рядом с обычными
           настройками на него нажимают по ошибке -->
      <div class="mt-8 border border-red-200 rounded-2xl p-6 bg-red-50/40">
        @if (deletionScheduled()) {
          <h2 class="text-lg font-bold text-red-800 mb-2">Account closing</h2>
          <p class="text-sm text-gray-700 mb-4">
            Your account and everything in it will be erased on
            <strong>{{ deletionScheduled() | date:'MMMM d, yyyy' }}</strong>.
            Your listings are hidden until then. You can still change your mind.
          </p>
          <button type="button" (click)="cancelDeletion()"
                  class="btn btn-primary" [disabled]="deleting()">
            {{ deleting() ? 'Working...' : 'Keep my account' }}
          </button>
        } @else {
          <h2 class="text-lg font-bold text-red-800 mb-2">Delete account</h2>
          <p class="text-sm text-gray-700 mb-4">
            Your listings come down straight away. Everything else is kept for 30 days
            in case you change your mind, then erased for good.
          </p>
          <button type="button" (click)="askToDelete()" class="btn bg-red-600 text-white hover:bg-red-700">
            Delete my account
          </button>
        }
      </div>

      <!-- Пароль спрашивается здесь же: без него хватило бы чужого доступа к
           открытой вкладке, чтобы закрыть учётную запись одним нажатием -->
      @if (confirmOpen()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
             (click)="confirmOpen.set(false)">
          <div class="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl" (click)="$event.stopPropagation()">
            <h2 class="text-xl font-bold text-mb-dark mb-3">Delete your account?</h2>
            <p class="text-sm text-gray-700 mb-5">
              Your listings will be hidden now and erased after 30 days, along with your
              messages and saved items. Enter your password to confirm.
            </p>

            @if (deleteError()) {
              <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                {{ deleteError() }}
              </div>
            }

            <input type="password" [(ngModel)]="confirmPassword" name="confirmPassword"
                   class="form-input mb-5" placeholder="Your password" autocomplete="current-password">

            <div class="flex gap-3">
              <button type="button" (click)="confirmDelete()"
                      class="btn bg-red-600 text-white hover:bg-red-700 flex-1"
                      [disabled]="deleting() || !confirmPassword">
                {{ deleting() ? 'Working...' : 'Delete account' }}
              </button>
              <button type="button" (click)="confirmOpen.set(false)" class="btn btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      }
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

  /** Срок стирания, если учётная запись закрыта. */
  deletionScheduled = signal<string | null>(null);
  confirmOpen = signal(false);
  confirmPassword = '';
  deleting = signal(false);
  deleteError = signal<string | null>(null);

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
  askToDelete(): void {
    this.confirmPassword = '';
    this.deleteError.set(null);
    this.confirmOpen.set(true);
  }

  confirmDelete(): void {
    this.deleting.set(true);
    this.deleteError.set(null);
    this.api.deleteAccount(this.confirmPassword).subscribe({
      next: (res) => {
        this.deleting.set(false);
        this.confirmOpen.set(false);
        this.confirmPassword = '';
        this.deletionScheduled.set(res.deletion_scheduled_at);
      },
      error: (err) => {
        this.deleting.set(false);
        this.deleteError.set(
          err?.status === 403 ? 'Password is incorrect' : 'Could not delete the account'
        );
      }
    });
  }

  cancelDeletion(): void {
    this.deleting.set(true);
    this.api.cancelAccountDeletion().subscribe({
      next: () => {
        this.deleting.set(false);
        this.deletionScheduled.set(null);
      },
      error: () => {
        this.deleting.set(false);
        this.error.set('Could not restore the account');
      }
    });
  }

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
        // Закрытая учётная запись показывает срок стирания и предложение вернуться
        this.deletionScheduled.set((data as any).deletionScheduledAt || null);
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
