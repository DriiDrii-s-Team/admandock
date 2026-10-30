import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppShellComponent } from './core/layout/app-shell.component';
import { PreferencesService } from './core/services/preferences.service';

@Component({
  selector: 'dd-root',
  standalone: true,
  imports: [RouterOutlet, AppShellComponent],
  template: `<dd-app-shell><router-outlet /></dd-app-shell>`
})
export class AppComponent {
  private readonly preferences = inject(PreferencesService);
  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.preferences.resolvedTheme();
      document.documentElement.lang = this.preferences.language();
    });
  }
}
