import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { User } from '../../models/listing.model';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-3xl font-bold text-mb-dark">Admin: Users</h1>
        <a routerLink="/admin/chats" class="btn btn-secondary">Chats</a>
      </div>

      <div class="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-left">
            <tr>
              <th class="px-4 py-3 font-bold">ID</th>
              <th class="px-4 py-3 font-bold">Email</th>
              <th class="px-4 py-3 font-bold">Username</th>
              <th class="px-4 py-3 font-bold">City</th>
              <th class="px-4 py-3 font-bold">Joined</th>
              <th class="px-4 py-3 font-bold">Admin</th>
              <th class="px-4 py-3 font-bold">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr *ngFor="let user of users()" class="hover:bg-gray-50">
              <td class="px-4 py-3">{{ user.id }}</td>
              <td class="px-4 py-3">{{ user.email }}</td>
              <td class="px-4 py-3">{{ user.username }}</td>
              <td class="px-4 py-3 text-gray-600">{{ user.city || '-' }}</td>
              <td class="px-4 py-3 text-gray-500">{{ user.created_at | date:'short' }}</td>
              <td class="px-4 py-3">
                <span *ngIf="user.is_admin" class="text-mb-blue font-bold">✓</span>
              </td>
              <td class="px-4 py-3 flex gap-2">
                <button (click)="toggleAdmin(user)" class="text-mb-blue hover:underline text-xs">Toggle admin</button>
                <button (click)="banUser(user)" class="text-red-600 hover:underline text-xs">Ban</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="users().length === 0" class="p-12 text-center text-gray-500">
          No users found.
        </div>
      </div>
    </div>
  `
})
export class AdminUsersComponent implements OnInit {
  users = signal<User[]>([]);

  ngOnInit(): void {
    // TODO: load users from API
  }

  toggleAdmin(user: User): void {
    console.log('Toggle admin', user.id);
  }

  banUser(user: User): void {
    if (confirm(`Ban user ${user.username}?`)) {
      console.log('Ban', user.id);
    }
  }
}
