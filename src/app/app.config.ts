import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners, provideAppInitializer, inject } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withInterceptors, withFetch } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideServiceWorker } from '@angular/service-worker';

import { routes } from './app.routes';
import { swRegistrationTrigger$ } from './services/sw-registration-trigger';
import { AuthService } from './services/auth.service';
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
    }),
    // Служба входа поднимается при запуске, а не когда её впервые запросят:
    // без этого обновление токена по куке не шло вовсе, и после перезагрузки
    // страницы человек оказывался снаружи, хотя кука была цела
    provideAppInitializer(() => { inject(AuthService); })
  ]
};
