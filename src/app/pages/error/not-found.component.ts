import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="max-w-md text-center">
        <div class="text-9xl font-bold text-mb-blue mb-4 select-none">404</div>
        <h1 class="text-3xl font-bold text-mb-dark mb-3">Page Not Found</h1>
        <p class="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <a routerLink="/" class="btn btn-primary">
            <i class="fas fa-home mr-2"></i> Go Home
          </a>
          <button (click)="goBack()" class="btn btn-secondary">
            <i class="fas fa-arrow-left mr-2"></i> Go Back
          </button>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent implements OnInit {
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.seo.update({
      title: 'Page Not Found',
      description: 'The requested page does not exist',
      noindex: true
    });
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  }
}
