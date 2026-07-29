import { Injectable, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type NotificationPermission = 'default' | 'granted' | 'denied' | 'unsupported';

export interface NotifyOptions {
  body?: string;
  icon?: string;
  tag?: string;
  url?: string;
  requireInteraction?: boolean;
  silent?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private platformId = inject(PLATFORM_ID);
  private readonly enabledKey = 'mb_notifications_enabled';

  permission = signal<NotificationPermission>('default');
  enabled = signal<boolean>(false);

  constructor() {
    if (this.isBrowser()) {
      this.refreshPermission();
      const saved = localStorage.getItem(this.enabledKey);
      this.enabled.set(saved === 'true' && this.permission() === 'granted');
    }
  }

  isSupported(): boolean {
    return this.isBrowser() && 'Notification' in window;
  }

  refreshPermission(): void {
    if (!this.isSupported()) {
      this.permission.set('unsupported');
      return;
    }
    this.permission.set(Notification.permission as NotificationPermission);
  }

  async request(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      this.permission.set('unsupported');
      return 'unsupported';
    }
    try {
      const result = await Notification.requestPermission();
      this.permission.set(result as NotificationPermission);
      if (result === 'granted') {
        this.enable();
      }
      return result as NotificationPermission;
    } catch {
      this.permission.set('denied');
      return 'denied';
    }
  }

  enable(): void {
    if (!this.isBrowser()) return;
    if (this.permission() !== 'granted') return;
    localStorage.setItem(this.enabledKey, 'true');
    this.enabled.set(true);
  }

  disable(): void {
    if (!this.isBrowser()) return;
    localStorage.setItem(this.enabledKey, 'false');
    this.enabled.set(false);
  }

  notify(title: string, options: NotifyOptions = {}): Notification | null {
    if (!this.canNotify()) return null;
    if (this.isPageVisible()) return null;

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/icons/icons8-m-50.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      if (options.url) {
        notification.onclick = () => {
          window.focus();
          window.location.href = options.url!;
          notification.close();
        };
      }
      return notification;
    } catch {
      return null;
    }
  }

  notifyNewMessage(senderUsername: string, preview: string, conversationId: number): void {
    this.notify(`New message from ${senderUsername}`, {
      body: preview.substring(0, 120),
      tag: `msg-${conversationId}`,
      url: `/chat/${conversationId}`,
      icon: '/icons/icons8-m-50.png'
    });
  }

  notifyListingActivity(title: string, message: string, listingId: number): void {
    this.notify(title, {
      body: message,
      tag: `listing-${listingId}`,
      url: `/listing/${listingId}`
    });
  }

  private canNotify(): boolean {
    return this.isSupported() && this.permission() === 'granted' && this.enabled();
  }

  private isPageVisible(): boolean {
    if (!this.isBrowser()) return true;
    return document.visibilityState === 'visible' && document.hasFocus();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
