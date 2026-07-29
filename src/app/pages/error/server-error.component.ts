import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
      <div class="max-w-md text-center">
        <div class="text-9xl font-bold text-orange-500 mb-4 select-none">500</div>
        <h1 class="text-3xl font-bold text-mb-dark mb-3">Server Error</h1>
        <p class="text-gray-500 mb-2">Something went wrong on our end.</p>
        <p class="text-gray-500 mb-8">We've logged the error and will investigate.</p>

        @if (errorRef()) {
          <div class="bg-gray-100 rounded-lg p-3 mb-6 text-xs text-gray-600 font-mono">
            Error reference: {{ errorRef() }}
          </div>
        }

        <div class="flex flex-col sm:flex-row gap-3 justify-center">
          <button (click)="retry()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i> Try Again
          </button>
          <a routerLink="/" class="btn btn-secondary">
            <i class="fas fa-home mr-2"></i> Home
          </a>
          <a routerLink="/contact" class="btn btn-secondary">
            <i class="fas fa-headset mr-2"></i> Report Issue
          </a>
        </div>
      </div>
    </div>
  `
})
export class ServerErrorComponent implements OnInit {
  private seo = inject(SeoService);
  errorRef = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.update({
      title: 'Server Error',
      description: 'A server error has occurred',
      noindex: true
    });
    this.errorRef.set(this.generateRef());
  }

  retry(): void {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }

  private generateRef(): string {
    const now = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `ERR-${now}-${rand}`;
  }
}
