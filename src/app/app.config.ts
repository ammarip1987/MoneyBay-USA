import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { swRegistrationTrigger$ } from './services/sw-registration-trigger';
import { authInterceptor } from './interceptors/auth.interceptor';
import { cityContextInterceptor } from './interceptors/city-context.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // Возврат из объявления возвращает ленту на прежнее место, а не наверх
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'enabled',
      anchorScrolling: 'enabled'
    })),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, cityContextInterceptor, errorInterceptor])),
    provideClientHydration(withEventReplay()),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      // No automatic registration on page load: the SW registers only when
      // swRegistrationTrigger$ emits (user clicks "Find listings near me")
      registrationStrategy: () => swRegistrationTrigger$
    })
  ]
};
