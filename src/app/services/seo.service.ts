import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoMetadata {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
}

const DEFAULT_TITLE = 'MoneyBay — Buy & Sell in 50 US States';
const DEFAULT_DESCRIPTION = 'MoneyBay is a free classifieds marketplace for buying and selling items, services, jobs, and real estate across 51 cities in the United States.';
const DEFAULT_IMAGE = '/icons/icons8-m-50.png';
const SITE_NAME = 'MoneyBay';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);

  update(metadata: SeoMetadata): void {
    const title = metadata.title
      ? `${metadata.title} | ${SITE_NAME}`
      : DEFAULT_TITLE;
    const description = metadata.description || DEFAULT_DESCRIPTION;
    const image = metadata.image || DEFAULT_IMAGE;
    const url = metadata.url || (typeof window !== 'undefined' ? window.location.href : '');
    const type = metadata.type || 'website';

    this.title.setTitle(title);

    this.setTag('description', description);
    if (metadata.keywords) this.setTag('keywords', metadata.keywords);

    this.setProperty('og:title', title);
    this.setProperty('og:description', description);
    this.setProperty('og:image', image);
    this.setProperty('og:url', url);
    this.setProperty('og:type', type);
    this.setProperty('og:site_name', SITE_NAME);

    this.setTag('twitter:card', 'summary_large_image');
    this.setTag('twitter:title', title);
    this.setTag('twitter:description', description);
    this.setTag('twitter:image', image);

    if (metadata.noindex) {
      this.setTag('robots', 'noindex, nofollow');
    } else {
      this.setTag('robots', 'index, follow');
    }

    if (typeof document !== 'undefined') {
      const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonical) {
        canonical.href = url;
      } else if (url) {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = url;
        document.head.appendChild(link);
      }
    }
  }

  reset(): void {
    this.update({});
  }

  private setTag(name: string, content: string): void {
    if (this.meta.getTag(`name="${name}"`)) {
      this.meta.updateTag({ name, content });
    } else {
      this.meta.addTag({ name, content });
    }
  }

  private setProperty(property: string, content: string): void {
    if (this.meta.getTag(`property="${property}"`)) {
      this.meta.updateTag({ property, content });
    } else {
      this.meta.addTag({ property, content });
    }
  }
}
