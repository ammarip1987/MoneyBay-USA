import { Injectable, inject, PLATFORM_ID, signal, effect } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private readonly storageKey = 'mb_theme';

  mode = signal<ThemeMode>('system');
  isDark = signal<boolean>(false);

  private mediaQuery?: MediaQueryList;

  constructor() {
    if (this.isBrowser()) {
      const saved = localStorage.getItem(this.storageKey) as ThemeMode | null;
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        this.mode.set(saved);
      }

      this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.mediaQuery.addEventListener('change', () => {
        if (this.mode() === 'system') {
          this.applyTheme();
        }
      });

      this.applyTheme();

      effect(() => {
        const m = this.mode();
        if (this.isBrowser()) {
          localStorage.setItem(this.storageKey, m);
          this.applyTheme();
        }
      });
    }
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
  }

  toggle(): void {
    const current = this.mode();
    if (current === 'light') this.mode.set('dark');
    else if (current === 'dark') this.mode.set('system');
    else this.mode.set('light');
  }

  private applyTheme(): void {
    if (!this.isBrowser()) return;
    const html = this.document.documentElement;
    const dark = this.mode() === 'dark'
      || (this.mode() === 'system' && this.mediaQuery?.matches === true);

    if (dark) {
      html.classList.add('dark');
      this.isDark.set(true);
    } else {
      html.classList.remove('dark');
      this.isDark.set(false);
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
