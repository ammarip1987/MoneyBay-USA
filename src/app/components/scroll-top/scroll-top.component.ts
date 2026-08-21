import { Component, signal, afterNextRender, OnDestroy } from '@angular/core';

/**
 * Кнопка возврата наверх. Появляется после прокрутки на пару экранов — при
 * шестидесяти объявлениях на странице путь назад длинный.
 */
@Component({
  selector: 'app-scroll-top',
  standalone: true,
  template: `
    @if (visible()) {
      <button (click)="toTop()"
              class="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-mb-blue text-white shadow-lg
                     flex items-center justify-center hover:bg-blue-700 transition"
              aria-label="Back to top">
        <i class="fas fa-chevron-up"></i>
      </button>
    }
  `
})
export class ScrollTopComponent implements OnDestroy {
  visible = signal(false);
  private onScroll = () => this.visible.set(window.scrollY > 1200);

  constructor() {
    afterNextRender(() => {
      window.addEventListener('scroll', this.onScroll, { passive: true });
      this.onScroll();
    });
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('scroll', this.onScroll);
    }
  }

  toTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
