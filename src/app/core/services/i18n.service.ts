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
    privacyTitle: 'Your data stays on your device', privacyText: 'Tool inputs are processed locally by default. AdManDock does not upload your content.',
    jsonEyebrow: 'DATA TOOL', jsonDescription: 'Format, validate and minify JSON locally in your browser.',
    jsonInput: 'Input JSON', jsonOutput: 'Formatted output', jsonPaste: 'Paste or type JSON here',
    jsonFormat: 'Format', jsonMinify: 'Minify', jsonClear: 'Clear',
    jsonCopy: 'Copy output', jsonValid: 'Valid JSON', jsonInvalid: 'Invalid JSON',
    jsonEmpty: 'Enter JSON to get started.', jsonEmptyOutput: 'Formatted JSON will appear here.',
    jsonPrivacy: 'Your input is processed in this browser and is never uploaded.',
    jsonErrorAt: 'Line', jsonColumn: 'column'
  },
  fr: {
    dashboard: 'Tableau de bord', workspace: 'Espace de travail', settings: 'Paramètres',
    dataTools: 'Données', diffTools: 'Comparaison', debugging: 'Diagnostic',
    security: 'Sécurité', developerTools: 'Outils développeur', favorites: 'Favoris',
    welcome: 'Votre espace de travail développeur', subtitle: 'Des outils pour inspecter, diagnostiquer et transformer vos données techniques.',
    search: 'Rechercher un outil...', local: 'Traitement local', comingSoon: 'Bientôt disponible',
    openTool: 'Ouvrir', quickAccess: 'Accès rapide', allTools: 'Tous les outils',
    privacyTitle: 'Vos données restent sur votre appareil', privacyText: 'Les contenus sont traités localement par défaut et ne sont pas envoyés par AdManDock.',
    jsonEyebrow: 'OUTIL DE DONNÉES', jsonDescription: 'Formatez, validez et réduisez du JSON localement dans votre navigateur.',
    jsonInput: 'JSON en entrée', jsonOutput: 'Résultat formaté', jsonPaste: 'Collez ou saisissez du JSON ici',
    jsonFormat: 'Formater', jsonMinify: 'Réduire', jsonClear: 'Effacer',
    jsonCopy: 'Copier le résultat', jsonValid: 'JSON valide', jsonInvalid: 'JSON invalide',
    jsonEmpty: 'Saisissez du JSON pour commencer.', jsonEmptyOutput: 'Le JSON formaté apparaîtra ici.',
    jsonPrivacy: 'Votre saisie est traitée dans ce navigateur et n’est jamais envoyée.',
    jsonErrorAt: 'Ligne', jsonColumn: 'colonne'
  }
} as const;

@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly preferences = inject(PreferencesService);
  readonly language = this.preferences.language;
  readonly messages = computed(() => messages[this.language()]);
  t(key: keyof typeof messages.en): string { return this.messages()[key]; }
}
