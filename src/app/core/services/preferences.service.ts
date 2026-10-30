import { Injectable, computed, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Language = 'en' | 'fr';

const THEME_KEY = 'debugdock.theme';
const LANGUAGE_KEY = 'debugdock.language';

@Injectable({ providedIn: 'root' })
export class PreferencesService {
  readonly theme = signal<ThemePreference>(this.readTheme());
  readonly language = signal<Language>(this.readLanguage());
  readonly resolvedTheme = computed(() => {
    const selected = this.theme();
    if (selected !== 'system') return selected;
    return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  setTheme(value: ThemePreference): void {
    this.theme.set(value);
    localStorage.setItem(THEME_KEY, value);
  }

  setLanguage(value: Language): void {
    this.language.set(value);
    localStorage.setItem(LANGUAGE_KEY, value);
  }

  private readTheme(): ThemePreference {
    try {
      const value = localStorage.getItem(THEME_KEY);
      return value === 'light' || value === 'dark' || value === 'system' ? value : 'dark';
    } catch { return 'dark'; }
  }

  private readLanguage(): Language {
    try { return localStorage.getItem(LANGUAGE_KEY) === 'fr' ? 'fr' : 'en'; }
    catch { return 'en'; }
  }
}
