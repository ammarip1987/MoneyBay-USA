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
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">Edit Profile</h1>

      @if (error()) {
        <div class="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">{{ error() }}</div>
      }

      <form (ngSubmit)="onSubmit()" class="bg-white rounded-2xl shadow-lg p-8 space-y-6">
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

  ngOnInit(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.username = user.username || '';
      this.phone = user.phone || '';
      this.city = user.city || '';
    }
    this.api.getProfile().subscribe({
      next: (data) => {
        this.username = data.username || '';
        this.phone = data.phone || '';
        this.city = data.city || '';
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
