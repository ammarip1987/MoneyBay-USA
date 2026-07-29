import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @switch (variant) {
      @case ('listing-card') {
        <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
          <div class="h-48 sm:h-64 bg-gray-200 animate-pulse"></div>
          <div class="p-4">
            <div class="h-4 bg-gray-200 rounded animate-pulse mb-3 w-3/4"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </div>
        </div>
      }

      @case ('listing-grid') {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          @for (i of repeat(count); track i) {
            <div class="bg-white rounded-xl shadow overflow-hidden border border-gray-100">
              <div class="h-48 sm:h-64 bg-gray-200 animate-pulse"></div>
              <div class="p-4">
                <div class="h-4 bg-gray-200 rounded animate-pulse mb-3 w-3/4"></div>
                <div class="h-3 bg-gray-200 rounded animate-pulse mb-2 w-1/2"></div>
                <div class="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
              </div>
            </div>
          }
        </div>
      }

      @case ('listing-detail') {
        <div class="max-w-6xl mx-auto px-4 py-8">
          <div class="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <div class="bg-gray-200 animate-pulse h-96 lg:h-[500px]"></div>
              <div class="p-8 space-y-4">
                <div class="h-8 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div class="h-12 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
                <div class="h-3 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div class="space-y-2 mt-6">
                  <div class="h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div class="h-3 bg-gray-200 rounded animate-pulse"></div>
                  <div class="h-3 bg-gray-200 rounded animate-pulse w-5/6"></div>
                  <div class="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
                </div>
                <div class="flex gap-3 mt-6">
                  <div class="h-10 bg-gray-200 rounded animate-pulse flex-1"></div>
                  <div class="h-10 bg-gray-200 rounded animate-pulse w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      @case ('text-lines') {
        <div class="space-y-2">
          @for (i of repeat(count); track i) {
            <div class="h-3 bg-gray-200 rounded animate-pulse" [class.w-3-4]="$last"></div>
          }
        </div>
      }

      @case ('avatar-card') {
        <div class="flex items-center gap-3 p-4">
          <div class="w-12 h-12 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
            <div class="h-3 bg-gray-200 rounded animate-pulse w-1/3"></div>
          </div>
        </div>
      }

      @case ('profile') {
        <div class="max-w-4xl mx-auto px-4 py-8">
          <div class="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div class="flex items-center gap-6">
              <div class="w-24 h-24 bg-gray-200 rounded-full animate-pulse flex-shrink-0"></div>
              <div class="flex-1 space-y-3">
                <div class="h-6 bg-gray-200 rounded animate-pulse w-1/3"></div>
                <div class="h-4 bg-gray-200 rounded animate-pulse w-1/4"></div>
                <div class="h-3 bg-gray-200 rounded animate-pulse w-1/5"></div>
              </div>
            </div>
          </div>
        </div>
      }

      @default {
        <div class="h-4 bg-gray-200 rounded animate-pulse" [style.width.%]="width"></div>
      }
    }
  `
})
export class SkeletonLoaderComponent {
  @Input() variant: 'listing-card' | 'listing-grid' | 'listing-detail' | 'text-lines' | 'avatar-card' | 'profile' | 'line' = 'line';
  @Input() count = 8;
  @Input() width = 100;

  repeat(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}
