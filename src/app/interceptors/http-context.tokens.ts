import { HttpContextToken } from '@angular/common/http';

/**
 * When true, the error interceptor skips the automatic
 * "session expired" handling (logout + redirect to /login) for this request.
 * Used by the silent session-validation call on app start.
 */
export const SKIP_SESSION_EXPIRED = new HttpContextToken<boolean>(() => false);
