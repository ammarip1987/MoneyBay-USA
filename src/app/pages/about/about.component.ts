import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12 min-page">
      <!-- Hero -->
      <div class="text-center mb-16">
        <h1 class="text-4xl font-bold text-mb-dark mb-4 flex items-center justify-center gap-2">
          <img src="icons/icons8-m-50.png" alt="" class="w-12 h-12" />oneyBay
        </h1>
        <p class="text-xl text-gray-600">Modern Marketplace for the USA</p>
      </div>

      <!-- About Content -->
      <div class="prose max-w-none space-y-4 text-gray-700">
        <h2 class="text-2xl font-bold text-mb-dark">Our Mission</h2>
        <p>
          MoneyBay is a modern, fast, and user-friendly marketplace designed for the American
          market. We empower buyers and sellers to connect directly, simplifying the process of
          buying and selling goods online.
        </p>
        <p>Unlike legacy platforms, MoneyBay combines:</p>
        <ul class="list-disc pl-6 space-y-1">
          <li>
            <strong>Clean Design:</strong> Modern, intuitive interface that works on desktop and
            mobile
          </li>
          <li><strong>Real-time Chat:</strong> Direct communication between buyers and sellers</li>
          <li><strong>Secure Payments:</strong> Stripe integration for safe transactions</li>
          <li><strong>Smart Boost:</strong> Featured listings to maximize visibility</li>
          <li><strong>Content Moderation:</strong> AI-powered safety checks</li>
        </ul>

        <h2 class="text-2xl font-bold text-mb-dark mt-8">Why Choose MoneyBay?</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>🚀 <strong>Speed:</strong> Lightning-fast search and browsing</li>
          <li>🔒 <strong>Safety:</strong> Verified accounts and secure messaging</li>
          <li>💳 <strong>Payment:</strong> Stripe-powered payment processing</li>
          <li>📱 <strong>Mobile:</strong> Fully responsive design works everywhere</li>
          <li>🌍 <strong>Reach:</strong> Available across 50 US states</li>
        </ul>
      </div>

      <div class="prose max-w-none space-y-4 text-gray-700">
        <h2 class="text-2xl font-bold text-mb-dark">Trust & Safety</h2>
        <p>Your safety is our priority:</p>
        <ul class="list-disc pl-6 space-y-1">
          <li>Community flagging — listings hidden once enough people report them</li>
          <li>Keyword filters for spam and prohibited items</li>
          <li>Email verification on every account</li>
          <li>TLS encryption on all connections</li>
          <li>Payments handled by Stripe, card details never touch our servers</li>
          <li>Phone numbers hidden behind a button, never listed openly</li>
        </ul>

        <h2 class="text-2xl font-bold text-mb-dark mt-8">Contact & Support</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>
            📧 Email:
            <a href="mailto:a.m.marip1987&#64;gmail.com" class="text-mb-blue hover:underline"
              >a.m.marip1987&#64;gmail.com</a
            >
          </li>
          <li>⏱️ Response time: Within 24 hours</li>
        </ul>
      </div>

      <div class="mt-16 text-center">
        <a
          routerLink="/"
          class="inline-block px-8 py-4 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition"
        >
          Start Browsing →
        </a>
      </div>

      <!-- Angular Material на пробу: та же страница, другой набор.
           Поставлено рядом с кнопкой выше, чтобы разница была видна на одном
           экране. Убрать вместе с зависимостью, если не подойдёт -->
      <div class="mt-16 border-t border-gray-200 pt-10">
        <p class="text-center text-sm text-gray-400 mb-6">Angular Material — на пробу</p>

        <div class="flex flex-wrap items-center justify-center gap-3 mb-8">
          <button mat-flat-button color="primary">Start Browsing</button>
          <button mat-stroked-button>Secondary</button>
          <button mat-button>Plain</button>
          <button mat-icon-button aria-label="Favourite">
            <mat-icon>star</mat-icon>
          </button>
        </div>

        <mat-card class="max-w-md mx-auto">
          <mat-card-header>
            <mat-card-title>Listing card</mat-card-title>
            <mat-card-subtitle>Cranberry Township, PA</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p class="mt-3">Как выглядит карточка в наборе Material рядом с нынешней.</p>
            <mat-form-field appearance="outline" class="w-full mt-4">
              <mat-label>Search</mat-label>
              <input matInput placeholder="What are you looking for?" />
            </mat-form-field>
          </mat-card-content>
          <mat-card-actions>
            <button mat-button>Save</button>
            <button mat-button>Flag</button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
})
export class AboutComponent {}
