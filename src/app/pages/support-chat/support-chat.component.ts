import { Component, OnInit, ViewChild, ElementRef, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../services/auth.service';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';

interface SupportMessage {
  id: number;
  content: string;
  sender_id: number;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-support-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonLoaderComponent],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-8">
      <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div class="bg-mb-dark text-white p-4 flex items-center gap-3">
          <i class="fas fa-headset text-2xl"></i>
          <div>
            <h1 class="text-xl font-bold">MoneyBay Support</h1>
            <p class="text-sm text-gray-300">Get help from our team</p>
          </div>
        </div>

        <div #scrollContainer class="h-96 overflow-y-auto p-4 space-y-3 bg-gray-50">
          @if (loading()) {
            <app-skeleton-loader variant="avatar-card"></app-skeleton-loader>
            <app-skeleton-loader variant="avatar-card"></app-skeleton-loader>
          } @else if (messages().length === 0) {
            <div class="text-center py-12 text-gray-500">
              <i class="fas fa-comment-dots text-5xl mb-4 text-gray-300"></i>
              <p>No messages yet. Send your first message below.</p>
            </div>
          } @else {
            @for (msg of messages(); track msg.id) {
              <div class="flex" [class.justify-end]="!msg.is_admin">
                <div class="max-w-[75%] rounded-2xl px-4 py-2 shadow"
                     [class.bg-mb-blue]="!msg.is_admin"
                     [class.text-white]="!msg.is_admin"
                     [class.bg-white]="msg.is_admin"
                     [class.text-gray-800]="msg.is_admin">
                  <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                  <p class="text-xs mt-1"
                     [class.text-blue-100]="!msg.is_admin"
                     [class.text-gray-500]="msg.is_admin">
                    {{ msg.is_admin ? 'Support · ' : '' }}{{ msg.created_at | date:'short' }}
                  </p>
                </div>
              </div>
            }
          }
        </div>

        <form (ngSubmit)="send()" class="p-4 border-t border-gray-200 flex gap-2">
          <input type="text"
                 [(ngModel)]="newMessage"
                 name="content"
                 placeholder="Type your message..."
                 [disabled]="sending()"
                 class="form-input flex-1"
                 required>
          <button type="submit"
                  [disabled]="!newMessage.trim() || sending()"
                  class="btn btn-primary px-6">
            @if (sending()) {
              <i class="fas fa-spinner fa-spin"></i>
            } @else {
              <i class="fas fa-paper-plane mr-1"></i> Send
            }
          </button>
        </form>
      </div>
    </div>
  `
})
export class SupportChatComponent implements OnInit {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  private http = inject(HttpClient);
  auth = inject(AuthService);

  messages = signal<SupportMessage[]>([]);
  loading = signal(true);
  sending = signal(false);
  newMessage = '';

  constructor() {
    afterNextRender(() => {
      this.loadMessages();
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      setInterval(() => this.loadMessages(), 10000);
    }
  }

  loadMessages(): void {
    this.http.get<SupportMessage[]>(`${environment.apiUrl}/api/support/messages`).subscribe({
      next: (data) => {
        this.messages.set(data);
        this.loading.set(false);
        setTimeout(() => this.scrollBottom(), 50);
      },
      error: () => this.loading.set(false)
    });
  }

  send(): void {
    const content = this.newMessage.trim();
    if (!content) return;

    this.sending.set(true);
    this.http.post<SupportMessage>(`${environment.apiUrl}/api/support/messages`, { content }).subscribe({
      next: (msg) => {
        this.messages.update(list => [...list, msg]);
        this.newMessage = '';
        this.sending.set(false);
        setTimeout(() => this.scrollBottom(), 50);
      },
      error: () => this.sending.set(false)
    });
  }

  private scrollBottom(): void {
    if (this.scrollContainer?.nativeElement) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
