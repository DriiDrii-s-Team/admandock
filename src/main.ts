import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AppComponent } from './app/app.component';
import { APP_ROUTES } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
    provideAnimations()
  ]
}).catch((error: unknown) => console.error('AdManDock bootstrap failed', error));
