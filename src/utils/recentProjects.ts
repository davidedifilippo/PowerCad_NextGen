import { Doc } from '../model/types';
import { getDocPages } from './pageUtils';

export interface RecentProjectItem {
  id: string;
  fileName: string;
  title: string;
  savedAt: string; // ISO date string
  timestamp: number;
  sheetCount: number;
  elementCount: number;
  doc: Doc;
}

const STORAGE_KEY = 'powercad_recent_projects_v1';
const MAX_RECENTS = 12;

let inMemoryStore: Record<string, string> = {};

function getStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // ignore access denied in sandboxed iframe
  }
  return {
    getItem: (k: string) => inMemoryStore[k] || null,
    setItem: (k: string, v: string) => {
      inMemoryStore[k] = v;
    },
    removeItem: (k: string) => {
      delete inMemoryStore[k];
    },
    clear: () => {
      inMemoryStore = {};
    },
  };
}

/**
 * Retrieves the list of recent projects from localStorage
 */
export function getRecentProjects(): RecentProjectItem[] {
  try {
    const storage = getStorage();
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: RecentProjectItem[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => b.timestamp - a.timestamp) : [];
  } catch (err) {
    console.warn('Errore lettura progetti recenti da localStorage:', err);
    return [];
  }
}

/**
 * Adds or updates a project in the recents list
 */
export function addRecentProject(doc: Doc, fileName: string): RecentProjectItem[] {
  try {
    const storage = getStorage();
    const existing = getRecentProjects();
    const pages = getDocPages(doc);
    const title = doc.sheet?.title || fileName.replace(/\.[^/.]+$/, '') || 'Schema Senza Titolo';
    const timestamp = Date.now();
    const savedAt = new Date().toISOString();

    const newItem: RecentProjectItem = {
      id: `proj_${timestamp}_${Math.random().toString(36).substring(2, 7)}`,
      fileName,
      title,
      savedAt,
      timestamp,
      sheetCount: pages.length,
      elementCount: doc.elements?.length || 0,
      doc,
    };

    // Remove duplicate entry with the same fileName
    const filtered = existing.filter(
      (item) => item.fileName.toLowerCase() !== fileName.toLowerCase()
    );

    const updated = [newItem, ...filtered].slice(0, MAX_RECENTS);
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Errore salvataggio progetto recente:', err);
    return getRecentProjects();
  }
}

/**
 * Removes a project from recents by ID
 */
export function removeRecentProject(id: string): RecentProjectItem[] {
  try {
    const storage = getStorage();
    const existing = getRecentProjects();
    const updated = existing.filter((item) => item.id !== id);
    storage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('Errore rimozione progetto recente:', err);
    return getRecentProjects();
  }
}

/**
 * Clears all recent projects
 */
export function clearRecentProjects(): void {
  try {
    const storage = getStorage();
    storage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Errore cancellazione progetti recenti:', err);
  }
}
