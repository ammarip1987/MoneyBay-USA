import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12">
      <h1 class="text-4xl font-bold mb-8">Privacy Policy</h1>
      <div class="prose max-w-none space-y-6">
        <section>
          <h2>1. Information We Collect</h2>
          <p>Email, name, phone, location, profile photos, listings.</p>
        </section>
        <section>
          <h2>2. How We Use</h2>
          <p>Account management, listings, buyer-seller communication, fraud prevention.</p>
        </section>
        <section>
          <h2>3. GDPR Compliance</h2>
          <p>EU users: encrypted storage, right to access/delete, no third-party sales.</p>
        </section>
        <section>
          <h2>4. Contact</h2>
          <p>Email: privacy@moneybay.us</p>
        </section>
      </div>
    </div>
  `
})
export class PrivacyComponent {}
