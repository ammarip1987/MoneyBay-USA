import { Component, OnDestroy, inject, signal, afterNextRender, effect } from '@angular/core';
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
    <!-- Место под рекламную полосу. Закрывается крестиком, выбор держится в
         браузере посетителя: закрыл — не показывается до очистки хранилища.
         Прокручивается вместе со страницей, шапка остаётся закреплённой -->
    @if (adVisible()) {
      <div class="bg-gray-100 text-gray-700 border-b border-gray-200 relative z-[60]">
        <div class="max-w-7xl mx-auto px-4 py-2 text-center text-sm tracking-wide">
          Advertising
        </div>
        <button (click)="closeAd()"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-2 cursor-pointer"
                aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    }

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
            @if (authReady() ? auth.isAuthenticated() : auth.authHint()) {
              <!-- Подача объявления — то, ради чего продавец приходит: рамка отделяет
                   её от прочих ссылок. Плюс убран, надпись говорит сама -->
              <a routerLink="/new-listing" class="px-4 py-2 border border-white/40 rounded hover:bg-white/10 hover:border-white transition">Post Ad</a>
              <a routerLink="/favorites" class="hover:text-mb-cyan transition flex items-center justify-center" aria-label="Favorites" title="Favorites">
                <span class="text-2xl select-none leading-none" style="color: #FFD700; font-family: system-ui, sans-serif;">★</span>
              </a>
              <a routerLink="/messages" class="hover:text-mb-cyan transition relative">
                Messages
                @if (unreadCount() > 0) {
                  <span class="absolute -top-1 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                    {{ unreadCount() > 99 ? '99+' : unreadCount() }}
                  </span>
                }
              </a>
                <!-- Кружок вместо надписи Profile: со снимком из Google или
                     Facebook, а без него — буква имени. Ширина одна и та же в
                     обоих случаях, поэтому соседние ссылки не сдвигаются, пока
                     снимок грузится -->
                <a routerLink="/profile" class="flex items-center" aria-label="Profile">
                  @if (auth.currentUser()?.avatarUrl && auth.currentUser()?.showAvatar !== false && !avatarFailed()) {
                    <img [src]="auth.currentUser()!.avatarUrl"
                         alt=""
                         class="w-8 h-8 rounded-full object-cover border-2 border-transparent hover:border-mb-cyan transition"
                         width="32" height="32" loading="lazy" decoding="async"
                         (error)="avatarFailed.set(true)">
                  } @else {
                    <span class="w-8 h-8 rounded-full bg-mb-blue text-white flex items-center justify-center text-sm font-semibold border-2 border-transparent hover:border-mb-cyan transition">
                      {{ initial() }}
                    </span>
                  }
                </a>
              @if (auth.currentUser()?.is_admin) {
                <a routerLink="/admin/chats" class="btn btn-primary text-sm">Admin</a>
              }
              <!-- Имя пользователя убрано из шапки: оно приходит асинхронно, и
                   его ширина сдвигала ссылки слева. Видно на странице Profile. -->
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
            @if (authReady() ? auth.isAuthenticated() : auth.authHint()) {
              <a routerLink="/new-listing" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2">Post Ad</a>
              <a routerLink="/my-listings" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2">My Ads</a>
              <a routerLink="/favorites" (click)="closeMobileMenu()" class="flex items-center gap-3 hover:text-mb-cyan transition py-2">
                <span class="text-2xl inline-block select-none" style="color: #FFD700; font-family: system-ui, sans-serif; line-height: 32px; height: 32px;">★</span>
                Favorites
              </a>
              <a routerLink="/messages" (click)="closeMobileMenu()" class="hover:text-mb-cyan transition py-2 flex items-center gap-2">
                Messages
                @if (unreadCount() > 0) {
                  <span class="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{{ unreadCount() > 99 ? '99+' : unreadCount() }}</span>
                }
              </a>
              <!-- В выдвижной панели надпись остаётся: список строк, кружок в
                   нём читался бы как отдельная кнопка. Снимок идёт слева -->
              <a routerLink="/profile" (click)="closeMobileMenu()" class="flex items-center gap-3 hover:text-mb-cyan transition py-2">
                @if (auth.currentUser()?.avatarUrl && auth.currentUser()?.showAvatar !== false && !avatarFailed()) {
                  <img [src]="auth.currentUser()!.avatarUrl" alt="" class="w-7 h-7 rounded-full object-cover" width="28" height="28" loading="lazy" decoding="async">
                } @else {
                  <span class="w-7 h-7 rounded-full bg-mb-blue text-white flex items-center justify-center text-xs font-semibold">{{ initial() }}</span>
                }
                Profile
              </a>
              @if (auth.currentUser()?.is_admin) {
                <a routerLink="/admin/chats" (click)="closeMobileMenu()" class="btn btn-primary text-sm self-start">Admin</a>
              }
              <button (click)="logout()" class="hover:text-mb-cyan transition py-2 text-left border-t border-gray-700 pt-4">Log out</button>
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

  /**
   * Рекламная полоса над шапкой. Закрытая не показывается вновь: выбор лежит
   * в браузере посетителя, к нам не приходит.
   *
   * Чтение обёрнуто: в закрытом окне и при запрете хранилища обращение само
   * бросает исключение, а не отдаёт пустоту.
   */

  /**
   * Первая буква имени для кружка без снимка. Берётся из имени, а при его
   * отсутствии — из почты: пустой кружок читается как сбой загрузки.
   */
  initial = (): string => {
    const u = this.auth.currentUser();
    const src = u?.username || u?.email || '';
    return src.charAt(0).toUpperCase() || '?';
  };

  /** Снимок не открылся — рисуется буква вместо пустого места. */
  avatarFailed = signal(false);
  adVisible = signal(this.readAdState());

  private readAdState(): boolean {
    try {
      return typeof localStorage === "undefined" || localStorage.getItem("ad-closed") !== "1";
    } catch {
      return true;
    }
  }

  closeAd(): void {
    this.adVisible.set(false);
    try {
      localStorage.setItem("ad-closed", "1");
    } catch {
      // хранилище недоступно — полоса вернётся при следующем заходе
    }
  }
  private router = inject(Router);

  unreadCount = signal(0);
  mobileOpen = signal(false);
  private pollTimer: any = null;
  private lastSeenCount = 0;

  /**
   * На сервере признак входа неизвестен — он в localStorage. Пока состояние
   * не установлено, гостевые ссылки не показываются: иначе «Log in» и
   * «Sign up» мелькают у вошедшего пользователя при обновлении страницы.
   */
  authReady = signal(false);

  private isBrowser = false;

  constructor() {
    afterNextRender(() => {
      this.isBrowser = true;
      this.authReady.set(true);
      this.syncPolling();
    });
    // Реагирует на login/logout в течение сессии, не только на первый рендер
    effect(() => {
      const authed = this.auth.isAuthenticated();
      if (!this.isBrowser) return;
      this.syncPolling(authed);
    });
  }

  private syncPolling(authed: boolean = this.auth.isAuthenticated()): void {
    if (authed && !this.pollTimer) {
      this.loadUnread();
      this.pollTimer = setInterval(() => this.loadUnread(), 20000);
    } else if (!authed && this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      this.unreadCount.set(0);
      this.lastSeenCount = 0;
    }
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
