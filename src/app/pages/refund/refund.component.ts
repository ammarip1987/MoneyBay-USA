import { Component } from '@angular/core';

@Component({
  selector: 'app-refund',
  standalone: true,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12 min-page">
      <h1 class="text-4xl font-bold text-mb-dark mb-8">Refund Policy</h1>
      <div class="prose max-w-none space-y-4 text-gray-700">
        <p>Last updated: January 1, 2026</p>
        <h2 class="text-2xl font-bold mt-6">Premium Boost Refunds</h2>
        <p>Boost services are non-refundable once activated. The boost begins immediately upon successful payment.</p>
        <h2 class="text-2xl font-bold mt-6">Failed Payments</h2>
        <p>If a payment fails or is duplicated, contact support within 7 days for a full refund.</p>
        <h2 class="text-2xl font-bold mt-6">Account Termination</h2>
        <p>If your account is terminated due to violation of our terms, paid services are non-refundable.</p>
        <h2 class="text-2xl font-bold mt-6">Contact</h2>
        <p>For refund requests: a.m.marip1987&#64;gmail.com</p>
      </div>
    </div>
  `
})
export class RefundComponent {}
