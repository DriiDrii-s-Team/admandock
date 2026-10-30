import Dexie, { Table } from 'dexie';

export interface LocalFavorite { id: string; toolId: string; createdAt: number; }
export interface LocalRecent { id: string; toolId: string; usedAt: number; }
export interface LocalSnippet { id: string; name: string; language: string; content: string; createdAt: number; updatedAt: number; }

export class DebugDockDatabase extends Dexie {
  favorites!: Table<LocalFavorite, string>;
  recents!: Table<LocalRecent, string>;
  snippets!: Table<LocalSnippet, string>;

  constructor() {
    super('DebugDock');
    this.version(1).stores({
      favorites: 'id, toolId, createdAt',
      recents: 'id, toolId, usedAt',
      snippets: 'id, language, updatedAt'
    });
  }
}

export const debugDockDb = new DebugDockDatabase();
