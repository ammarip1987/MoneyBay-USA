import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';

interface Conversation {
  id: number;
  other_user: string;
  last_message: string;
  unread_count: number;
  updated_at: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold text-mb-dark mb-8">Messages</h1>

      @if (conversations().length > 0) {
        <div class="bg-white rounded-2xl shadow border border-gray-100 divide-y divide-gray-100">
          @for (conv of conversations(); track conv.id) {
            <a [routerLink]="['/chat', conv.id]" class="block p-4 hover:bg-gray-50 transition">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-gradient-to-br from-mb-blue to-mb-cyan rounded-full flex items-center justify-center text-white font-bold">
                  {{ conv.other_user.charAt(0).toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-baseline">
                    <h3 class="font-bold text-mb-dark truncate">{{ conv.other_user }}</h3>
                    <span class="text-xs text-gray-500">{{ conv.updated_at | date:'short' }}</span>
                  </div>
                  <p class="text-sm text-gray-600 truncate">{{ conv.last_message }}</p>
                </div>
                @if (conv.unread_count > 0) {
                  <span class="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                    {{ conv.unread_count }}
                  </span>
                }
              </div>
            </a>
          }
        </div>
      } @else if (!loading()) {
        <div class="bg-white rounded-2xl shadow p-12 text-center border border-gray-100">
          <span class="text-6xl mb-4 block">💬</span>
          <h2 class="text-xl font-bold text-mb-dark mb-2">No messages yet</h2>
          <p class="text-gray-600">Browse listings and contact sellers to start a conversation.</p>
        </div>
      }
    </div>
  `
})
export class MessagesComponent implements OnInit {
  private api = inject(ApiService);

  conversations = signal<Conversation[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loading.set(true);
    this.api.getConversations().subscribe({
      next: (data) => {
        this.conversations.set(data || []);
        this.loading.set(false);
      },
      error: () => {
        this.conversations.set([]);
        this.loading.set(false);
      }
    });
  }
}
