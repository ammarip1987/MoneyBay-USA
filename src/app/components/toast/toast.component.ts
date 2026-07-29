import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm">
      @for (n of notification.notifications(); track n.id) {
        <div class="rounded-lg shadow-lg px-4 py-3 text-sm font-medium flex items-start gap-3 animate-slide-in"
             [class.bg-green-50]="n.type === 'success'"
             [class.text-green-800]="n.type === 'success'"
             [class.border-green-200]="n.type === 'success'"
             [class.bg-red-50]="n.type === 'error'"
             [class.text-red-800]="n.type === 'error'"
             [class.border-red-200]="n.type === 'error'"
             [class.bg-blue-50]="n.type === 'info'"
             [class.text-blue-800]="n.type === 'info'"
             [class.border-blue-200]="n.type === 'info'"
             [class.bg-yellow-50]="n.type === 'warning'"
             [class.text-yellow-800]="n.type === 'warning'"
             [class.border-yellow-200]="n.type === 'warning'"
             style="border-width: 1px;">
          <span class="text-lg leading-none">
            @if (n.type === 'success') { ✓ }
            @if (n.type === 'error') { ✕ }
            @if (n.type === 'info') { ℹ }
            @if (n.type === 'warning') { ⚠ }
          </span>
          <div class="flex-1">{{ n.message }}</div>
          <button (click)="notification.dismiss(n.id)" class="opacity-50 hover:opacity-100 leading-none">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slide-in {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in { animation: slide-in 0.3s ease-out; }
  `]
})
export class ToastComponent {
  notification = inject(NotificationService);
}
