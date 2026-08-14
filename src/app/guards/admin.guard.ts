import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const platformId = inject(PLATFORM_ID);

  // On server: allow access — actual auth check happens after hydration in browser
  if (!isPlatformBrowser(platformId)) return true;

  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated() && auth.currentUser()?.is_admin) return true;
  router.navigate(['/']);
  return false;
};
