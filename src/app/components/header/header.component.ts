import { Component, OnDestroy, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { CityContextService } from '../../services/city-context.service';
import { NotificationsService } from '../../services/notifications.service';
// TODO: Restore ThemeToggleComponent import if dark mode toggle is needed
// import { ThemeToggleComponent } from '../theme-toggle/theme-toggle.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <header class="bg-mb-dark text-white sticky top-0 z-50 shadow-md">
      <nav class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <a routerLink="/" class="text-2xl font-bold flex items-center gap-2" (click)="closeMobileMenu()">
            <img src="icons/icons8-m-50.png" alt="" class="w-8 h-8" width="32" height="32" loading="eager" decoding="async">
            <span>oneyBay</span>
            @if (cityCtx.currentCity()) {
              <span class="text-sm font-normal text-mb-cyan ml-2 hidden sm:inline">{{ cityCtx.currentCity()!.name }}</span>
            }
          </a>

          <div class="hidden md:flex items-center gap-4 flex-wrap justify-end">
            @if (auth.isAuthenticated()) {
              <a routerLink="/new-listing" class="hover:text-mb-cyan transition">+ Post Ad</a>
              <a routerLink="/my-listings" class="hover:text-mb-cyan transition">My Ads</a>
              <a routerLink="/messages" class="hover:text-mb-cyan transition relative">
                Messages
                @if (unreadCount() > 0) {
                  <span class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {{ unreadCount() > 99 ? '99+' : unreadCount() }}
                  </span>
                }
              </a>
              <a routerLink="/profile" class="hover:text-mb-cyan transition">Profile</a>
              @if (auth.currentUser()?.is_admin) {
                <a routerLink="/admin/chats" class="btn btn-primary text-sm">Admin</a>
              }
              <span class="text-gray-300">{{ auth.currentUser()?.username }}</span>
              <button (click)="logout()" class="hover:text-mb-cyan transition">Log out</button>
            } @else {
              <a routerLink="/login" class="hover:text-mb-cyan transition">Log in</a>
              <a routerLink="/register" class="btn btn-primary">Sign up</a>
            }
          </div>

          <button class="md:hidden text-2xl p-2 hover:text-mb-cyan transition"
                  (click)="toggleMobileMenu()"
                  [attr.aria-label]="mobileOpen() ? 'Close menu' : 'Open menu'">
            <i class="fas" [class.fa-bars]="!mobileOpen()" [class.fa-times]="mobileOpen()"></i>
          </button>
        </div>

        @if (mobileOpen()) {
          <div class="md:hidden mt-4 pb-2 border-t border-gray-700 pt-4 flex flex-col gap-3">
            @if (auth.isAuthenticated()) {
              <a routerLink="/new-listing" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2">+ Post Ad</a>
              <a routerLink="/my-listings" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2">My Ads</a>
              <a routerLink="/messages" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2 flex items-center gap-2">
                Messages
                @if (unreadCount() > 0) {
                  <span class="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
                }
              </a>
              <a routerLink="/profile" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2">Profile</a>
              @if (auth.currentUser()?.is_admin) {
                <a routerLink="/admin/chats" (click)="closeMobileMenu()" class="btn btn-primary text-sm self-start">Admin</a>
              }
              <span class="text-gray-300 py-2 border-t border-gray-700">{{ auth.currentUser()?.username }}</span>
              <button (click)="logout()" class="hover:text-mb-cyan transition py-2 text-left">Log out</button>
            } @else {
              <a routerLink="/login" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2">Log in</a>
              <a routerLink="/register" (click)="closeMobileMenu()" class="btn btn-primary self-start">Sign up</a>
            }
          </div>
        }
      </nav>
    </header>
  `
})
export class HeaderComponent implements OnDestroy {
  auth = inject(AuthService);
  cityCtx = inject(CityContextService);
  notifications = inject(NotificationsService);
  private api = inject(ApiService);
  private router = inject(Router);

  unreadCount = signal(0);
  mobileOpen = signal(false);
  private pollTimer: any = null;
  private lastSeenCount = 0;

  constructor() {
    afterNextRender(() => {
      if (this.auth.isAuthenticated()) {
        this.loadUnread();
        this.pollTimer = setInterval(() => this.loadUnread(), 5000);
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
  }

  async requestNotifications(): Promise<void> {
    await this.notifications.request();
  }

  loadUnread(): void {
    this.api.getUnreadCount().subscribe({
      next: (res) => {
        const prevCount = this.lastSeenCount;
        this.unreadCount.set(res.count);
        if (res.count > prevCount && this.notifications.enabled() && prevCount > 0) {
          this.notifications.notify('New unread messages', {
            body: `You have ${res.count} unread message${res.count > 1 ? 's' : ''}`,
            tag: 'unread-count',
            url: '/messages'
          });
        }
        this.lastSeenCount = res.count;
      },
      error: () => this.unreadCount.set(0)
    });
  }

  toggleMobileMenu(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.router.navigate(['/']);
  }
}
