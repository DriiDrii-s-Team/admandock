import { Injectable, computed, inject } from '@angular/core';
import { PreferencesService } from './preferences.service';

const messages = {
  en: {
    dashboard: 'Dashboard', workspace: 'Workspace', settings: 'Settings',
    dataTools: 'Data tools', diffTools: 'Diff tools', debugging: 'Debugging',
    security: 'Security', developerTools: 'Developer tools', favorites: 'Favorites',
    welcome: 'Your developer workspace', subtitle: 'A focused collection of tools to inspect, debug and transform technical data.',
    search: 'Search tools...', local: 'Local processing', comingSoon: 'Coming soon',
    openTool: 'Open tool', quickAccess: 'Quick access', allTools: 'All tools',
    privacyTitle: 'Your data stays on your device', privacyText: 'Tool inputs are processed locally by default. DebugDock does not upload your content.'
  },
  fr: {
    dashboard: 'Tableau de bord', workspace: 'Espace de travail', settings: 'Paramètres',
    dataTools: 'Données', diffTools: 'Comparaison', debugging: 'Diagnostic',
    security: 'Sécurité', developerTools: 'Outils développeur', favorites: 'Favoris',
    welcome: 'Votre espace de travail développeur', subtitle: 'Des outils pour inspecter, diagnostiquer et transformer vos données techniques.',
    search: 'Rechercher un outil...', local: 'Traitement local', comingSoon: 'Bientôt disponible',
    openTool: 'Ouvrir', quickAccess: 'Accès rapide', allTools: 'Tous les outils',
    privacyTitle: 'Vos données restent sur votre appareil', privacyText: 'Les contenus sont traités localement par défaut et ne sont pas envoyés par DebugDock.'
  }
} as const;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly preferences = inject(PreferencesService);
  readonly language = this.preferences.language;
  readonly messages = computed(() => messages[this.language()]);
  t(key: keyof typeof messages.en): string { return this.messages()[key]; }
}
