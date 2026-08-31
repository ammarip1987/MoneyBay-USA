import { Component, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OAuthService, OAuthProvider } from '../../services/oauth.service';

/**
 * Кнопки входа через соцсети. Список приходит с backend:
 * провайдер без заданных credentials не отдаётся и кнопку не получает,
 * поэтому она не ведёт на страницу ошибки провайдера.
 */
@Component({
  selector: 'app-oauth-buttons',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Место под кнопки отведено с самого начала: список служб приходит с
         сервера, и без заданной высоты форма прыгала вниз, когда он доходил.
         Две службы по 50 в высоту плюс промежуток — 112 -->
    <div class="mb-6" style="min-height: 112px;">
      @if (providers().length > 0) {
        <div class="space-y-3">
          @for (p of providers(); track p.provider) {
            <button type="button" (click)="oauth.start(p)" [disabled]="disabled"
                    class="w-full py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center justify-center gap-3 text-sm font-medium text-gray-800 disabled:opacity-50">
              <i [class]="iconOf(p.provider)"></i>
              {{ oauth.label(p.provider) }}
            </button>
          }
        </div>
      }
    </div>
  `
})
export class OAuthButtonsComponent {
  @Input() disabled = false;

  oauth = inject(OAuthService);
  providers = signal<OAuthProvider[]>([]);

  private readonly icons: Record<string, string> = {
    google: 'fab fa-google text-[#4285F4]',
    facebook: 'fab fa-facebook text-[#1877F2]',
    apple: 'fab fa-apple text-black'
  };

  constructor() {
    this.oauth.providers$.subscribe(list => this.providers.set(list));
  }

  iconOf(provider: string): string {
    return this.icons[provider] || 'fas fa-right-to-bracket';
  }
}
