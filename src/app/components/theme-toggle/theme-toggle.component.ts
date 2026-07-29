import { Component, inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-theme-toggle',
  standalone: true,
  template: `
    <button (click)="theme.toggle()"
            class="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center transition"
            [attr.aria-label]="ariaLabel()"
            [title]="ariaLabel()">
      @switch (theme.mode()) {
        @case ('light') {
          <i class="fas fa-sun text-yellow-400"></i>
        }
        @case ('dark') {
          <i class="fas fa-moon text-blue-300"></i>
        }
        @case ('system') {
          <i class="fas fa-desktop text-gray-300"></i>
        }
      }
    </button>
  `
})
export class ThemeToggleComponent {
  theme = inject(ThemeService);

  ariaLabel(): string {
    switch (this.theme.mode()) {
      case 'light': return 'Light mode (click for dark)';
      case 'dark': return 'Dark mode (click for system)';
      case 'system': return 'System mode (click for light)';
    }
  }
}
