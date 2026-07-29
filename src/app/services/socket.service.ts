import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private auth = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private client: any = null;

  messages$ = new Subject<ChatMessage>();
  connected$ = new Subject<boolean>();

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  async connect(): Promise<void> {
    if (!this.isBrowser()) return;
    if (this.client?.connected) return;

    const token = this.auth.getToken();
    if (!token) return;

    const { Client } = await import('@stomp/stompjs');
    const SockJS = ((await import('sockjs-client')) as any).default;

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl) as any,
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected$.next(true);
        const user = this.auth.currentUser();
        if (user && this.client) {
          this.client.subscribe(`/user/${user.email}/queue/messages`, (msg: any) => {
            try {
              const data = JSON.parse(msg.body) as ChatMessage;
              this.messages$.next(data);
            } catch (e) {
              console.error('Failed to parse message', e);
            }
          });
        }
      },
      onStompError: (frame: any) => console.error('STOMP error', frame),
      onWebSocketClose: () => this.connected$.next(false)
    });

    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.connected$.next(false);
  }

  sendMessage(receiverId: number, content: string): void {
    if (!this.client?.connected) return;
    this.client.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({ receiver_id: receiverId, content })
    });
  }
}
