import { Component, OnInit, OnDestroy, inject, signal, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { SocketService } from '../../services/socket.service';
import { Message } from '../../models/listing.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <a routerLink="/messages" class="text-mb-blue hover:underline mb-4 inline-block">← Back to messages</a>

      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col" style="height: 70vh;">
        <div class="border-b border-gray-100 px-6 py-4 flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br from-mb-blue to-mb-cyan rounded-full flex items-center justify-center text-white font-bold">
            {{ otherUser().charAt(0).toUpperCase() }}
          </div>
          <h2 class="font-bold text-mb-dark">{{ otherUser() || 'User' }}</h2>
          <span class="ml-auto text-xs" [class.text-green-600]="connected()" [class.text-gray-400]="!connected()">
            {{ connected() ? '● Online' : '○ Offline' }}
          </span>
        </div>

        <div #messageContainer class="flex-1 overflow-y-auto p-6 space-y-3">
          @for (msg of messages(); track msg.id) {
            <div class="flex" [class.justify-end]="msg.sender_id === currentUserId()">
              <div [class.bg-mb-blue]="msg.sender_id === currentUserId()"
                   [class.text-white]="msg.sender_id === currentUserId()"
                   [class.bg-gray-100]="msg.sender_id !== currentUserId()"
                   [class.text-gray-800]="msg.sender_id !== currentUserId()"
                   class="rounded-2xl px-4 py-2 max-w-md">
                <p>{{ msg.content }}</p>
                <p class="text-xs mt-1 opacity-70">{{ msg.created_at | date:'shortTime' }}</p>
              </div>
            </div>
          }
          @if (messages().length === 0 && !loading()) {
            <p class="text-center text-gray-400 py-8">No messages yet. Start the conversation!</p>
          }
        </div>

        <form (ngSubmit)="sendMessage()" class="border-t border-gray-100 p-4 flex gap-2">
          <input #fileInput type="file" accept="image/*" style="display: none;" (change)="onPhotoSelected($event)">
          <button type="button" class="btn btn-secondary px-4" (click)="fileInput.click()" [disabled]="sending()" title="Attach photo">
            <i class="fas fa-image"></i>
          </button>
          <input type="text"
                 [(ngModel)]="newMessage"
                 name="message"
                 placeholder="Type a message..."
                 class="flex-1 form-input"
                 [disabled]="sending()">
          <button type="submit" class="btn btn-primary px-6" [disabled]="!newMessage.trim() || sending()">
            {{ sending() ? '...' : 'Send' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messageContainer') private messageContainer!: ElementRef;

  private api = inject(ApiService);
  private auth = inject(AuthService);
  private socket = inject(SocketService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private subscriptions: Subscription[] = [];

  messages = signal<Message[]>([]);
  otherUser = signal('User');
  loading = signal(false);
  sending = signal(false);
  connected = signal(false);
  newMessage = '';
  otherUserId = 0;

  currentUserId = () => this.auth.currentUser()?.id || 0;

  ngOnInit(): void {
    this.otherUserId = Number(this.route.snapshot.paramMap.get('id'));
    if (!this.otherUserId || this.otherUserId <= 0) {
      this.router.navigate(['/messages']);
      return;
    }
    this.loadMessages();

    this.socket.connect();
    this.subscriptions.push(
      this.socket.connected$.subscribe(c => this.connected.set(c)),
      this.socket.messages$.subscribe(msg => {
        if (msg.sender_id === this.otherUserId || msg.receiver_id === this.otherUserId) {
          this.messages.update(list => {
            if (list.find(m => m.id === msg.id)) return list;
            return [...list, msg as any];
          });
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

  loadMessages(): void {
    if (!this.otherUserId) return;
    this.loading.set(true);
    this.api.getChatMessages(this.otherUserId).subscribe({
      next: (data) => {
        this.messages.set(data || []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  scrollToBottom(): void {
    try {
      this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    } catch {}
  }

  sendMessage(): void {
    if (!this.newMessage.trim() || !this.otherUserId) return;
    const content = this.newMessage;
    this.sending.set(true);

    if (this.connected()) {
      this.socket.sendMessage(this.otherUserId, content);
      this.newMessage = '';
      this.sending.set(false);
    } else {
      this.api.sendMessage(this.otherUserId, content).subscribe({
        next: (msg) => {
          this.messages.update(list => [...list, msg]);
          this.newMessage = '';
          this.sending.set(false);
        },
        error: () => this.sending.set(false)
      });
    }
  }

  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0 || !this.otherUserId) return;

    const file = files[0];
    this.sending.set(true);

    this.api.uploadChatPhoto(file).subscribe({
      next: (photoUrl: string) => {
        const message = `Photo: ${photoUrl}`;
        if (this.connected()) {
          this.socket.sendMessage(this.otherUserId, message);
        } else {
          this.api.sendMessage(this.otherUserId, message).subscribe({
            next: (msg) => this.messages.update(list => [...list, msg]),
            error: () => this.sending.set(false)
          });
        }
        this.sending.set(false);
        input.value = '';
      },
      error: () => this.sending.set(false)
    });
  }
}
