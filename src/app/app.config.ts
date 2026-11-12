import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptors } from './interceptors/auth.interceptors';
import { loadingInterceptors } from './interceptors/loading.interceptors';
import { errorInterceptors } from './interceptors/error.interceptors';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptors, loadingInterceptors, errorInterceptors]),
    ),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes)
  ]
};
