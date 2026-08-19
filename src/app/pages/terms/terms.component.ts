import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12 min-page">
      <h1 class="text-4xl font-bold mb-8">Terms of Service</h1>
      <div class="prose max-w-none space-y-6">
        <section>
          <h2>1. Disclaimer of Liability</h2>
          <p>MoneyBay is a platform connecting buyers and sellers. We are NOT responsible for:</p>
          <ul>
            <li>Quality or authenticity of products/services listed</li>
            <li>Disputes between buyers and sellers</li>
            <li>Non-delivery or fraudulent transactions</li>
            <li>Injury or damages resulting from transactions</li>
            <li>User conduct or violations of law</li>
          </ul>
          <p>Buyers and sellers transact at their own risk.</p>
        </section>

        <section>
          <h2>2. User Responsibilities</h2>
          <p>You agree to:</p>
          <ul>
            <li>Provide accurate information</li>
            <li>Follow all local laws and regulations</li>
            <li>Not list prohibited items (weapons, drugs, stolen goods)</li>
            <li>Not engage in fraud, scams, or harassment</li>
            <li>Settle disputes directly with other users</li>
          </ul>
        </section>

        <section>
          <h2>3. Prohibited Content</h2>
          <p>You cannot list:</p>
          <ul>
            <li>Illegal items or services</li>
            <li>Counterfeit or stolen goods</li>
            <li>Weapons, explosives, drugs</li>
            <li>Hate speech or discriminatory content</li>
            <li>Adult content or services</li>
          </ul>
        </section>

        <section>
          <h2>4. Platform Rights</h2>
          <p>MoneyBay reserves the right to:</p>
          <ul>
            <li>Remove listings that violate these terms</li>
            <li>Suspend or ban users</li>
            <li>Modify platform features</li>
            <li>Collect usage data for improvement</li>
          </ul>
        </section>

        <section>
          <h2>5. Dispute Resolution</h2>
          <p>Disputes must be resolved between users directly. MoneyBay may mediate but is not liable for outcomes.</p>
        </section>

        <section>
          <h2>6. Trust & Safety - Flagging System</h2>
          <p>MoneyBay maintains community safety through a user-driven flagging system:</p>
          <ul>
            <li><strong>Flag a Listing:</strong> Click the "Flag" button on any listing to report spam, prohibited items, fraud, offensive content, or other violations</li>
            <li><strong>Automatic Action:</strong> When a listing receives 20 or more flags from different users, it is automatically hidden from the platform</li>
            <li><strong>Review Process:</strong> Our team reviews flagged listings and may take additional action including permanent removal and user suspension</li>
            <li><strong>False Flags:</strong> Repeatedly flagging listings in bad faith may result in account suspension</li>
            <li><strong>Community Responsibility:</strong> Help keep MoneyBay safe by flagging violations, but do not abuse the system</li>
          </ul>
        </section>

        <section>
          <h2>7. Contact</h2>
          <p>Email: support@moneybay.us</p>
        </section>
      </div>
    </div>
  `
})
export class TermsComponent {}
