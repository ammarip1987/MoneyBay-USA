import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface SupportTicket {
  id: number;
  user: string;
  last_message: string;
  status: 'open' | 'closed';
  updated_at: string;
}

@Component({
  selector: 'app-admin-support',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8 min-page">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-mb-dark">Admin: Support Tickets</h1>
        <a routerLink="/admin/chats" class="btn btn-secondary">All Chats</a>
      </div>

      <div class="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-3 font-bold">ID</th>
              <th class="px-4 py-3 font-bold">User</th>
              <th class="px-4 py-3 font-bold">Last Message</th>
              <th class="px-4 py-3 font-bold">Status</th>
              <th class="px-4 py-3 font-bold">Updated</th>
              <th class="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let ticket of tickets()" class="hover:bg-gray-50">
              <td class="px-4 py-3">{{ ticket.id }}</td>
              <td class="px-4 py-3">{{ ticket.user }}</td>
              <td class="px-4 py-3 text-gray-600 truncate max-w-xs">{{ ticket.last_message }}</td>
              <td class="px-4 py-3">
                <span [class.bg-green-100]="ticket.status === 'open'"
                      [class.text-green-800]="ticket.status === 'open'"
                      [class.bg-gray-100]="ticket.status === 'closed'"
                      [class.text-gray-800]="ticket.status === 'closed'"
                      class="inline-block px-2 py-1 rounded-full text-xs font-bold">
                  {{ ticket.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-500">{{ ticket.updated_at | date:'short' }}</td>
              <td class="px-4 py-3">
                <a [routerLink]="['/admin/support', ticket.id]" class="text-mb-blue hover:underline">Open</a>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="tickets().length === 0" class="p-12 text-center text-gray-500">
          No support tickets.
        </div>
      </div>
    </div>
  `
})
export class AdminSupportComponent implements OnInit {
  tickets = signal<SupportTicket[]>([]);

  ngOnInit(): void {
    // TODO: load support tickets
  }
}
