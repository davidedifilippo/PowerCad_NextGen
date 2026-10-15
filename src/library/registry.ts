import { ComponentDef, Library } from '../model/types';
import { STANDARD_LIBRARY } from './standard';

class ComponentRegistry {
  private defs = new Map<string, ComponentDef>();
  private listeners: (() => void)[] = [];

  constructor() {
    this.registerAll(STANDARD_LIBRARY);
  }

  register(def: ComponentDef) {
    this.defs.set(def.id, def);
    this.notify();
  }

  registerAll(defs: ComponentDef[]) {
    for (const def of defs) {
      this.defs.set(def.id, def);
    }
    this.notify();
  }

  get(id: string): ComponentDef | undefined {
    return this.defs.get(id);
  }

  getAll(): ComponentDef[] {
    return Array.from(this.defs.values());
  }

  getCategories(): string[] {
    const set = new Set<string>();
    for (const d of this.defs.values()) {
      set.add(d.category);
    }
    return Array.from(set);
  }

  getByCategory(category: string): ComponentDef[] {
    return this.getAll().filter((d) => d.category === category);
  }

  /** Export whole library or custom parts as JSON string */
  exportToJson(): string {
    const lib: Library = {
      name: 'Custom CADe_SIMU Library',
      version: 1,
      components: this.getAll(),
    };
    return JSON.stringify(lib, null, 2);
  }

  /** Import components from a JSON string */
  importFromJson(jsonStr: string): { count: number; error?: string } {
    try {
      const data = JSON.parse(jsonStr);
      const components: ComponentDef[] = Array.isArray(data)
        ? data
        : Array.isArray(data.components)
        ? data.components
        : [];
      if (!components.length) {
        return { count: 0, error: 'Nessun componente valido trovato nel JSON' };
      }
      this.registerAll(components);
      return { count: components.length };
    } catch (e: any) {
      return { count: 0, error: e.message || 'JSON non valido' };
    }
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    for (const l of this.listeners) l();
  }
}

export const registry = new ComponentRegistry();
