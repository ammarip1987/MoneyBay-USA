import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="bg-mb-dark text-white mt-20">
      <div class="max-w-7xl mx-auto px-4 py-16">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <a routerLink="/" class="text-2xl font-bold flex items-center gap-2 mb-4">
              <img src="icons/icons8-m-50.png" alt="" class="w-8 h-8" width="32" height="32" loading="lazy" decoding="async">
              <span>oneyBay</span>
            </a>
            <p class="text-sm text-gray-400 mb-4">Modern marketplace across 50 US states.</p>
            <div class="flex gap-3">
              <a href="#" class="w-9 h-9 bg-gray-700 hover:bg-mb-blue rounded-full flex items-center justify-center transition">
                <i class="fab fa-facebook-f"></i>
              </a>
              <a href="#" class="w-9 h-9 bg-gray-700 hover:bg-mb-blue rounded-full flex items-center justify-center transition">
                <i class="fab fa-twitter"></i>
              </a>
              <a href="#" class="w-9 h-9 bg-gray-700 hover:bg-mb-blue rounded-full flex items-center justify-center transition">
                <i class="fab fa-instagram"></i>
              </a>
            </div>
          </div>
          <div>
            <h4 class="font-bold mb-4 uppercase text-sm tracking-wider">Marketplace</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/" class="hover:text-mb-cyan transition">Browse listings</a></li>
              @if (auth.isAuthenticated()) {
                <li><a routerLink="/new-listing" class="hover:text-mb-cyan transition">Post an ad</a></li>
                <li><a routerLink="/my-listings" class="hover:text-mb-cyan transition">My listings</a></li>
              } @else {
                <li><a routerLink="/register" class="hover:text-mb-cyan transition">Sign up</a></li>
                <li><a routerLink="/login" class="hover:text-mb-cyan transition">Log in</a></li>
              }
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4 uppercase text-sm tracking-wider">Company</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/about" class="hover:text-mb-cyan transition">About</a></li>
              <li><a routerLink="/contact" class="hover:text-mb-cyan transition">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 class="font-bold mb-4 uppercase text-sm tracking-wider">Legal</h4>
            <ul class="space-y-2 text-sm text-gray-400">
              <li><a routerLink="/terms" class="hover:text-mb-cyan transition">Terms of Service</a></li>
              <li><a routerLink="/privacy" class="hover:text-mb-cyan transition">Privacy Policy</a></li>
              <li><a routerLink="/refund" class="hover:text-mb-cyan transition">Refund Policy</a></li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-700 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
          <p>&copy; 2026 MoneyBay. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `
})
export class FooterComponent {
  auth = inject(AuthService);
}
