import { Component, OnDestroy, HostListener, inject, signal, afterNextRender, effect } from '@angular/core';
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
   <div>
    <!-- Полоса и шапка обёрнуты в один корень: при двух корнях восстановление
         страницы, пришедшей с сервера, привязывало только первый, и нажатие на
         крестик не доходило — полоса не закрывалась.
         Место под баннер: он кладётся в public/ads и подставляется ниже -->
    @if (adVisible()) {
      <div class="promo-strip bg-gray-100 text-gray-700 border-b border-gray-200 relative z-[60]">
        <a href="/promo/" class="block max-w-7xl mx-auto px-4 py-2 text-center text-sm tracking-wide">
          Advertising
        </a>
        <button (click)="closeAd()"
                class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-2 cursor-pointer"
                aria-label="Close">
          <i class="fas fa-times"></i>
        </button>
      </div>
    }

    <header class="bg-mb-dark text-white sticky top-0 z-50">
      <nav class="max-w-7xl mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <!-- Кнопка стоит перед именем площадки: так она первой попадает под
               взгляд, а имя остаётся якорем возврата на главную.
               Цвет — синий значков категорий, чтобы читалась как часть навигации -->
          <button type="button"
                  (click)="toggleCatalog()"
                  class="hidden md:flex items-center gap-2 mr-6 px-4 py-2 rounded-full border border-mb-blue text-mb-blue hover:bg-mb-blue hover:text-white transition font-medium shrink-0">
            <svg class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 3h6v6H3V3zm8 0h6v6h-6V3zM3 11h6v6H3v-6zm8 0h6v6h-6v-6z"/>
            </svg>
            <span>All Listings</span>
            <svg class="w-3 h-3 transition-transform" [class.rotate-180]="catalogOpen()"
                 viewBox="0 0 12 8" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="M1 1l5 5 5-5"/>
            </svg>
          </button>

          <a routerLink="/" class="text-2xl font-bold flex items-center gap-2 mr-auto" (click)="closeMobileMenu()">
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

      <!-- Панель вынута из потока: в потоке она толкала страницу вниз, и
           содержимое главной уезжало под неё. Опорой служит сама шапка —
           sticky задаёт систему координат, отдельный relative не нужен -->
      @if (catalogOpen()) {
        <div class="hidden md:block absolute left-0 right-0 top-full z-50 bg-white text-gray-800 border-t border-gray-200 shadow-xl">
          <div class="max-w-7xl mx-auto flex">
            <!-- Разделы. Выбранный подсвечен, наведение сразу меняет правую
                 часть: нажатие оставлено переходу в раздел -->
            <ul class="w-64 shrink-0 border-r border-gray-100 py-3 max-h-[70vh] overflow-y-auto">
              @for (cat of catalogCategories(); track cat.id) {
                <li>
                  <a [routerLink]="['/']" [queryParams]="{ category: cat.slug }"
                     (mouseenter)="hoverCategory(cat)"
                     (click)="closeCatalog()"
                     class="flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition"
                     [class.bg-gray-50]="activeCatalogCategory()?.id === cat.id"
                     [class.font-semibold]="activeCatalogCategory()?.id === cat.id">
                    <span class="w-5 text-center text-mb-dark" [innerHTML]="cat.icon"></span>
                    <span class="flex-1">{{ cat.name }}</span>
                    @if (cat.subcategoryCount) {
                      <span class="text-gray-400">&rsaquo;</span>
                    }
                  </a>
                </li>
              }
            </ul>

            <!-- Содержимое выбранного раздела -->
            <div class="flex-1 p-6 max-h-[70vh] overflow-y-auto">
              @if (activeCatalogCategory(); as cat) {
                <a [routerLink]="['/']" [queryParams]="{ category: cat.slug }"
                   (click)="closeCatalog()"
                   class="text-lg font-semibold text-mb-dark hover:underline">{{ cat.name }}</a>

                @if (catalogSubs().length) {
                  <!-- Столбцами: перечень в одну колонку заставлял бы прокручивать
                       панель, хотя места по ширине достаточно -->
                  <div class="mt-4 columns-2 lg:columns-3 gap-8">
                    @for (sub of catalogSubs(); track sub.id) {
                      <a [routerLink]="['/']"
                         [queryParams]="{ category: cat.slug, subcategory: sub.slug }"
                         (click)="closeCatalog()"
                         class="block py-1 text-sm text-gray-700 hover:text-mb-dark hover:underline break-inside-avoid">{{ sub.name }}</a>
                    }
                  </div>
                } @else if (catalogSubsLoading()) {
                  <p class="mt-4 text-sm text-gray-400">Loading…</p>
                } @else {
                  <!-- Подкатегории заведены не у всех разделов: вместо пустоты
                       предлагается перейти в сам раздел -->
                  <a [routerLink]="['/']" [queryParams]="{ category: cat.slug }"
                     (click)="closeCatalog()"
                     class="mt-4 inline-block text-sm text-mb-dark hover:underline">Browse all in {{ cat.name }} &rarr;</a>
                }
              }
            </div>
          </div>
        </div>
      }
    </header>
   </div>
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
  /**
   * Рекламная полоса. При создании всегда показана: на сервере хранилища
   * браузера нет, и чтение оттуда давало разметку, расходящуюся с той, что
   * потом строит браузер, — связь с сигналом рвалась и крестик не работал.
   * Настоящее состояние читается в afterNextRender.
   */
  adVisible = signal(true);

  private readAdState(): boolean {
    try {
      return localStorage.getItem('promo-closed') !== '1';
    } catch {
      return true;
    }
  }

  closeAd(): void {
    this.adVisible.set(false);
    try {
      localStorage.setItem("promo-closed", "1");
    } catch {
      // хранилище недоступно — полоса вернётся при следующем заходе
    }
  }
  private router = inject(Router);

  unreadCount = signal(0);
  mobileOpen = signal(false);

  /** Раскрыта ли панель разделов. */
  catalogOpen = signal(false);
  catalogCategories = signal<any[]>([]);
  activeCatalogCategory = signal<any | null>(null);
  catalogSubs = signal<any[]>([]);
  catalogSubsLoading = signal(false);

  /**
   * Подкатегории по разделам, уже загруженные. Наведение на раздел повторно
   * запроса не шлёт: без этого движение мыши по перечню давало бы залп.
   */
  private subsCache = new Map<string, any[]>();
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
      // Полоса скрывается, если её закрывали прежде. Читается здесь, а не при
      // создании: на сервере хранилища браузера нет
      if (!this.readAdState()) this.adVisible.set(false);
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
        this.unreadFailures = 0;
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
      error: () => {
        this.unreadCount.set(0);
        // Опрос прекращается после нескольких отказов подряд: при истёкшем
        // входе он бился по кругу — отказ вызывал обновление токена, то
        // тоже отказывало, и так десятками запросов в минуту
        this.unreadFailures++;
        if (this.unreadFailures >= 3 && this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
      }
    });
  }

  /** Сколько раз подряд не удалось получить счётчик. */
  private unreadFailures = 0;

  toggleMobileMenu(): void {
    this.mobileOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileOpen.set(false);
  }

  /**
   * Раскрыть или закрыть панель разделов.
   *
   * Разделы запрашиваются при первом раскрытии, а не при загрузке страницы:
   * панель открывают не все, и лишний запрос замедлял бы первый экран.
   */
  /**
   * Закрыть панель щелчком мимо неё.
   *
   * Повторное нажатие на кнопку для закрытия неочевидно: человек тычет в
   * страницу, ожидая что панель уйдёт. Щелчки внутри самой панели не в счёт —
   * иначе она закрывалась бы при выборе раздела раньше перехода.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.catalogOpen()) return;
    const target = event.target as HTMLElement;
    // Щелчки внутри шапки не в счёт: там и сама кнопка, и панель
    if (target.closest("header")) return;
    this.catalogOpen.set(false);
  }

  /** Escape закрывает панель: привычно и доступно с клавиатуры. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.catalogOpen()) this.catalogOpen.set(false);
  }

  toggleCatalog(): void {
    const opening = !this.catalogOpen();
    this.catalogOpen.set(opening);
    if (!opening) return;

    if (this.catalogCategories().length) return;
    this.api.getCategories().subscribe({
      next: (cats) => {
        this.catalogCategories.set(cats || []);
        const first = (cats || [])[0];
        if (first) this.hoverCategory(first);
      },
      error: () => this.catalogCategories.set([])
    });
  }

  closeCatalog(): void {
    this.catalogOpen.set(false);
  }

  /** Показать содержимое раздела, на который навели. */
  hoverCategory(cat: any): void {
    if (this.activeCatalogCategory()?.id === cat.id) return;
    this.activeCatalogCategory.set(cat);

    const cached = this.subsCache.get(cat.slug);
    if (cached) {
      this.catalogSubs.set(cached);
      this.catalogSubsLoading.set(false);
      return;
    }

    this.catalogSubs.set([]);
    this.catalogSubsLoading.set(true);
    this.api.getSubcategories(cat.slug).subscribe({
      next: (subs) => {
        const list = subs || [];
        this.subsCache.set(cat.slug, list);
        // Пока запрос шёл, могли навести на другой раздел — тогда ответ уже
        // не нужен, иначе в панели оказались бы чужие подкатегории
        if (this.activeCatalogCategory()?.slug === cat.slug) {
          this.catalogSubs.set(list);
          this.catalogSubsLoading.set(false);
        }
      },
      error: () => {
        this.subsCache.set(cat.slug, []);
        if (this.activeCatalogCategory()?.slug === cat.slug) {
          this.catalogSubs.set([]);
          this.catalogSubsLoading.set(false);
        }
      }
    });
  }

  logout(): void {
    this.closeMobileMenu();
    this.auth.logout();
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.router.navigate(['/']);
  }
}
