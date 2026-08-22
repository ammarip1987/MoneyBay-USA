import { Component, Input, Output, EventEmitter, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Окно с причинами отклонения объявления.
 *
 * Показывается автору сразу после публикации, если проверка нашла недочёты.
 * Объявление при этом не удаляется — оно остаётся в «моих объявлениях», и после
 * правки проверка проходит заново.
 */
@Component({
  selector: 'app-moderation-notice',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (open()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
           (click)="dismiss.emit()">
        <div class="bg-white rounded-2xl max-w-lg w-full p-8 shadow-xl max-h-[85vh] overflow-y-auto"
             (click)="$event.stopPropagation()">
          <div class="flex justify-between items-start mb-4 gap-4">
            <h2 class="text-2xl font-bold text-mb-dark">Before it goes live</h2>
            <button (click)="dismiss.emit()" class="text-gray-400 hover:text-gray-700 text-2xl leading-none"
                    aria-label="Close">×</button>
          </div>

          <p class="text-gray-700 mb-5">
            Your listing needs a little more work before buyers can see it. Fixing these
            takes a minute and puts it in front of far more people:
          </p>

          <ul class="space-y-3 mb-8">
            @for (r of items(); track r) {
              <li class="flex items-start gap-3">
                <i class="fas fa-circle-exclamation text-amber-500 mt-1"></i>
                <span class="text-gray-700">{{ label(r) }}</span>
              </li>
            }
          </ul>

          <div class="flex flex-col gap-3">
            <button (click)="edit.emit()" class="btn btn-primary w-full">Edit listing</button>
            <button (click)="dismiss.emit()"
                    class="text-gray-600 hover:text-mb-blue text-sm underline mx-auto">
              Later
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ModerationNoticeComponent {
  /** Причины через запятую, как их отдаёт сервер. */
  @Input() set reasons(value: string | null | undefined) {
    this.raw.set(value || '');
  }

  @Output() edit = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  private raw = signal('');
  items = computed(() => this.raw().split(',').map(r => r.trim()).filter(Boolean));
  open = computed(() => this.items().length > 0);

  /** Пояснение к каждой причине: что именно поправить. */
  label(reason: string): string {
    switch (reason) {
      case 'MISSING_PHOTOS':
        return 'Add photos — listings without them are mostly skipped.';
      case 'SHORT_TITLE':
        return 'Give it a fuller title: what it is, the make, the condition.';
      case 'SHOUTING_TITLE':
        return 'Write the title in normal case — all capitals reads as shouting.';
      case 'SHORT_DESCRIPTION':
        return 'Describe the item properly: condition, age, why you are selling.';
      case 'MISSING_PRICE':
        return 'Set a price. Listings without one rarely get a reply.';
      case 'MISSING_LOCATION':
        return 'Add your city and state so buyers nearby can find it.';
      case 'CONTACTS_IN_TEXT':
        return 'Remove the phone number or email from the text — buyers message you through the site, which keeps a record if anything goes wrong.';
      default:
        return reason;
    }
  }
}
