import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="max-w-4xl mx-auto px-4 py-12">
      <!-- Hero -->
      <div class="text-center mb-16">
        <h1 class="text-4xl font-bold text-mb-dark mb-4 flex items-center justify-center gap-2">
          <img src="icons/icons8-m-50.png" alt="" class="w-12 h-12">oneyBay
        </h1>
        <p class="text-xl text-gray-600">Modern Marketplace for the USA</p>
      </div>

      <!-- About Content -->
      <div class="prose max-w-none space-y-4 text-gray-700">
        <h2 class="text-2xl font-bold text-mb-dark">Our Mission</h2>
        <p>MoneyBay is a modern, fast, and user-friendly marketplace designed for the American market. We empower buyers and sellers to connect directly, simplifying the process of buying and selling goods online.</p>
        <p>Unlike legacy platforms, MoneyBay combines:</p>
        <ul class="list-disc pl-6 space-y-1">
          <li><strong>Clean Design:</strong> Modern, intuitive interface that works on desktop and mobile</li>
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
          <li>🌍 <strong>Reach:</strong> Available across 53 US cities</li>
        </ul>
      </div>

      <!-- Testimonials -->
      <div class="mt-16 mb-16">
        <div class="text-center mb-12">
          <h2 class="text-3xl font-bold text-mb-dark mb-4">What Users Say</h2>
          <p class="text-gray-600">Join thousands of satisfied buyers and sellers</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-mb-blue rounded-full flex items-center justify-center text-white font-bold">JS</div>
              <div>
                <p class="font-bold text-mb-dark">John Smith</p>
                <p class="text-sm text-gray-500">Los Angeles, CA</p>
              </div>
            </div>
            <div class="flex mb-3 text-yellow-400">★★★★★</div>
            <p class="text-gray-700">"Sold my vintage camera in 3 days! The interface is so clean and the real-time chat made communication super easy. Highly recommend MoneyBay!"</p>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-mb-cyan rounded-full flex items-center justify-center text-white font-bold">MJ</div>
              <div>
                <p class="font-bold text-mb-dark">Maria Johnson</p>
                <p class="text-sm text-gray-500">Austin, TX</p>
              </div>
            </div>
            <div class="flex mb-3 text-yellow-400">★★★★★</div>
            <p class="text-gray-700">"Found the perfect apartment listing. The search filters work great and the pricing is transparent. No hidden fees, just honest buying and selling."</p>
          </div>

          <div class="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-12 h-12 bg-mb-green rounded-full flex items-center justify-center text-white font-bold">RC</div>
              <div>
                <p class="font-bold text-mb-dark">Robert Chen</p>
                <p class="text-sm text-gray-500">Seattle, WA</p>
              </div>
            </div>
            <div class="flex mb-3 text-yellow-400">★★★★★</div>
            <p class="text-gray-700">"As a seller, MoneyBay's boost feature actually works. Got 10x more views with the 48-hour plan. Worth every penny!"</p>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="bg-gradient-to-r from-mb-dark to-mb-blue rounded-2xl p-12 text-white mb-16">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <p class="text-4xl font-bold">10K+</p>
            <p class="text-blue-100 mt-2">Active Listings</p>
          </div>
          <div>
            <p class="text-4xl font-bold">5K+</p>
            <p class="text-blue-100 mt-2">Happy Users</p>
          </div>
          <div>
            <p class="text-4xl font-bold">$2M+</p>
            <p class="text-blue-100 mt-2">Transaction Value</p>
          </div>
        </div>
      </div>

      <div class="prose max-w-none space-y-4 text-gray-700">
        <h2 class="text-2xl font-bold text-mb-dark">Trust & Safety</h2>
        <p>Your safety is our priority:</p>
        <ul class="list-disc pl-6 space-y-1">
          <li>End-to-end encrypted messaging</li>
          <li>AI-powered content moderation</li>
          <li>SSL/TLS encryption for all connections</li>
          <li>Secure payment processing via Stripe</li>
          <li>Account verification system</li>
          <li>Spam and fraud detection</li>
        </ul>

        <h2 class="text-2xl font-bold text-mb-dark mt-8">Contact & Support</h2>
        <ul class="list-disc pl-6 space-y-1">
          <li>📧 Email: <a href="mailto:a.m.marip1987&#64;gmail.com" class="text-mb-blue hover:underline">a.m.marip1987&#64;gmail.com</a></li>
          <li>⏱️ Response time: Within 24 hours</li>
        </ul>
      </div>

      <div class="mt-16 text-center">
        <a routerLink="/" class="inline-block px-8 py-4 bg-mb-blue hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition">
          Start Browsing →
        </a>
      </div>
    </div>
  `
})
export class AboutComponent {}
