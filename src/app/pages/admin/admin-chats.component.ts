import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface AdminChat {
  id: number;
  user1: string;
  user2: string;
  listing_title?: string;
  last_message: string;
  updated_at: string;
  message_count: number;
}

@Component({
  selector: 'app-admin-chats',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-mb-dark">Admin: All Chats</h1>
        <div class="flex gap-2">
          <a routerLink="/admin/support" class="btn btn-secondary">Support Chats</a>
          <a routerLink="/admin/users" class="btn btn-secondary">Users</a>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-3 font-bold">ID</th>
              <th class="px-4 py-3 font-bold">Participants</th>
              <th class="px-4 py-3 font-bold">Listing</th>
              <th class="px-4 py-3 font-bold">Last Message</th>
              <th class="px-4 py-3 font-bold">Date</th>
              <th class="px-4 py-3 font-bold">Messages</th>
              <th class="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let chat of chats()" class="hover:bg-gray-50">
              <td class="px-4 py-3">{{ chat.id }}</td>
              <td class="px-4 py-3">{{ chat.user1 }} ↔ {{ chat.user2 }}</td>
              <td class="px-4 py-3 text-gray-600">{{ chat.listing_title || '-' }}</td>
              <td class="px-4 py-3 text-gray-600 truncate max-w-xs">{{ chat.last_message }}</td>
              <td class="px-4 py-3 text-gray-500">{{ chat.updated_at | date:'short' }}</td>
              <td class="px-4 py-3">{{ chat.message_count }}</td>
              <td class="px-4 py-3">
                <a [routerLink]="['/admin/chat', chat.id]" class="text-mb-blue hover:underline">View</a>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="chats().length === 0" class="p-12 text-center text-gray-500">
          No chats found.
        </div>
      </div>
    </div>
  `
})
export class AdminChatsComponent implements OnInit {
  chats = signal<AdminChat[]>([]);

  ngOnInit(): void {
    // TODO: load all chats from API
  }
}
