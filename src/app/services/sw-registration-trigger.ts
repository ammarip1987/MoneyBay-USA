import { Subject } from 'rxjs';

/**
 * Emits when the user explicitly opts in to enhanced features
 * (currently: clicks "Find listings near me").
 * Used as the Angular service worker registrationStrategy so the SW
 * is registered ONLY after a real user gesture — never on page load.
 */
export const swRegistrationTrigger$ = new Subject<void>();
