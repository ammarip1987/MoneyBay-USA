import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SkeletonLoaderComponent } from '../../components/skeleton-loader/skeleton-loader.component';

interface ChatMessage {
  id: number;
  content: string;
  sender_id: number;
  receiver_id: number;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  buyer_id: number;
  buyer_username: string;
  messages: ChatMessage[];
}

interface ListingChats {
  listing_id: number;
  listing_title: string;
  seller_id: number;
  conversations: Conversation[];
}

@Component({
  selector: 'app-admin-listing-chat',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonLoaderComponent],
  template: `
    <div class="max-w-6xl mx-auto px-4 py-8">
      <a routerLink="/admin/chats" class="text-mb-blue hover:underline mb-4 inline-block">← Back to admin chats</a>

      @if (loading()) {
        <app-skeleton-loader variant="text-lines" [count]="5"></app-skeleton-loader>
      } @else if (data()) {
        <div class="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 class="text-2xl font-bold text-mb-dark mb-2">Chats for: {{ data()!.listing_title }}</h1>
          <p class="text-gray-500 text-sm">Listing ID: {{ data()!.listing_id }} · Seller ID: {{ data()!.seller_id }} · {{ data()!.conversations.length }} conversation{{ data()!.conversations.length !== 1 ? 's' : '' }}</p>
        </div>

        @if (data()!.conversations.length === 0) {
          <div class="text-center py-12 bg-white rounded-2xl shadow">
            <i class="fas fa-comments text-5xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-lg">No conversations yet for this listing</p>
          </div>
        } @else {
          <div class="space-y-6">
            @for (conv of data()!.conversations; track conv.buyer_id) {
              <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div class="bg-gray-50 border-b border-gray-200 p-4 flex justify-between items-center">
                  <div>
                    <h3 class="font-bold text-mb-dark">
                      <a [routerLink]="['/users', conv.buyer_id]" class="hover:underline">{{ conv.buyer_username }}</a>
                    </h3>
                    <p class="text-sm text-gray-500">Buyer ID: {{ conv.buyer_id }} · {{ conv.messages.length }} messages</p>
                  </div>
                  <button (click)="toggleExpand(conv.buyer_id)" class="btn btn-secondary text-sm">
                    {{ isExpanded(conv.buyer_id) ? 'Collapse' : 'Expand' }}
                  </button>
                </div>

                @if (isExpanded(conv.buyer_id)) {
                  <div class="p-4 space-y-3 bg-gray-50 max-h-96 overflow-y-auto">
                    @for (msg of conv.messages; track msg.id) {
                      <div class="flex" [class.justify-end]="msg.sender_id === data()!.seller_id">
                        <div class="max-w-[75%] rounded-2xl px-4 py-2 shadow"
                             [class.bg-mb-blue]="msg.sender_id === data()!.seller_id"
                             [class.text-white]="msg.sender_id === data()!.seller_id"
                             [class.bg-white]="msg.sender_id !== data()!.seller_id"
                             [class.text-gray-800]="msg.sender_id !== data()!.seller_id">
                          <p class="text-sm whitespace-pre-wrap">{{ msg.content }}</p>
                          <p class="text-xs mt-1"
                             [class.text-blue-100]="msg.sender_id === data()!.seller_id"
                             [class.text-gray-500]="msg.sender_id !== data()!.seller_id">
                            {{ msg.sender_id === data()!.seller_id ? 'Seller' : 'Buyer' }} · {{ msg.created_at | date:'short' }}
                            @if (msg.is_read) { · Read }
                          </p>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }
      } @else {
        <div class="text-center py-12">
          <p class="text-gray-500">Listing not found or no permission</p>
        </div>
      }
    </div>
  `
})
export class AdminListingChatComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);

  data = signal<ListingChats | null>(null);
  loading = signal(true);
  expandedConvs = signal<Set<number>>(new Set());

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) return;

    this.http.get<ListingChats>(`${environment.apiUrl}/api/admin/listings/${id}/chats`).subscribe({
      next: (resp) => {
        this.data.set(resp);
        this.loading.set(false);
      },
      error: () => {
        this.data.set(null);
        this.loading.set(false);
      }
    });
  }

  toggleExpand(buyerId: number): void {
    this.expandedConvs.update(set => {
      const newSet = new Set(set);
      if (newSet.has(buyerId)) {
        newSet.delete(buyerId);
      } else {
        newSet.add(buyerId);
      }
      return newSet;
    });
  }

  isExpanded(buyerId: number): boolean {
    return this.expandedConvs().has(buyerId);
  }
}
