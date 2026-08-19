import { Component } from '@angular/core';

@Component({
  selector: 'app-contact',
  standalone: true,
  template: `
    <div class="max-w-2xl mx-auto px-4 py-12 min-page">
      <h1 class="text-4xl font-bold text-mb-dark mb-8">Contact Us</h1>

      <div class="bg-white rounded-2xl shadow-lg p-8 space-y-4">
        <div class="flex items-center gap-3">
          <i class="fas fa-envelope text-mb-blue text-xl"></i>
          <a href="mailto:a.m.marip1987&#64;gmail.com" class="hover:underline">a.m.marip1987&#64;gmail.com</a>
        </div>
        <div class="flex items-center gap-3">
          <i class="fas fa-clock text-mb-blue text-xl"></i>
          <span>Response time: Within 24 hours</span>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {}
