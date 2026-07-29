import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const RESERVED = new Set(['www', 'api', 'admin', 'localhost']);

export const cityContextInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  if (!isPlatformBrowser(platformId)) return next(req);

  const host = window.location.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return next(req);
  }

  const parts = host.split('.');
  if (parts.length < 2) return next(req);

  const candidate = parts[0];
  if (RESERVED.has(candidate)) return next(req);

  return next(req.clone({ setHeaders: { 'X-City-Subdomain': candidate } }));
};
