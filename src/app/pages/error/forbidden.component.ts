import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="max-w-md text-center">
        <div class="text-9xl font-bold text-red-500 mb-4 select-none">403</div>
        <h1 class="text-3xl font-bold text-mb-dark mb-3">Access Forbidden</h1>
        <p class="text-gray-500 mb-2">You don't have permission to view this page.</p>
        @if (!auth.isAuthenticated()) {
          <p class="text-gray-500 mb-8">Try logging in with the correct account.</p>
        } @else {
          <p class="text-gray-500 mb-8">Contact support if you think this is a mistake.</p>
        }
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          @if (!auth.isAuthenticated()) {
            <a routerLink="/login" class="btn btn-primary">
              <i class="fas fa-sign-in-alt mr-2"></i> Log In
            </a>
          }
          <a routerLink="/" class="btn btn-secondary">
            <i class="fas fa-home mr-2"></i> Home
          </a>
          <a routerLink="/contact" class="btn btn-secondary">
            <i class="fas fa-envelope mr-2"></i> Contact Support
          </a>
        </div>
      </div>
    </div>
  `
})
export class ForbiddenComponent implements OnInit {
  private seo = inject(SeoService);
  auth = inject(AuthService);

  ngOnInit(): void {
    this.seo.update({
      title: 'Access Forbidden',
      description: 'You do not have permission to access this resource',
      noindex: true
    });
  }
}
