import { describe, it, expect, beforeEach } from 'vitest';
import {
  getRecentProjects,
  addRecentProject,
  removeRecentProject,
  clearRecentProjects,
} from './recentProjects';
import { SAMPLE_DIRECT_START } from '../samples/directStart';

describe('recentProjects', () => {
  beforeEach(() => {
    clearRecentProjects();
  });

  it('initially returns an empty list', () => {
    expect(getRecentProjects()).toEqual([]);
  });

  it('adds and retrieves a project', () => {
    const doc = { ...SAMPLE_DIRECT_START, sheet: { ...SAMPLE_DIRECT_START.sheet, title: 'Test Quadro' } };
    const list = addRecentProject(doc, 'Quadro.json');
    expect(list.length).toBe(1);
    expect(list[0].fileName).toBe('Quadro.json');
    expect(list[0].title).toBe('Test Quadro');
    expect(list[0].elementCount).toBe(doc.elements.length);
  });

  it('removes a project by id', () => {
    const doc = { ...SAMPLE_DIRECT_START, sheet: { ...SAMPLE_DIRECT_START.sheet, title: 'P1' } };
    addRecentProject(doc, 'P1.json');
    const items = getRecentProjects();
    expect(items.length).toBe(1);

    const updated = removeRecentProject(items[0].id);
    expect(updated.length).toBe(0);
    expect(getRecentProjects().length).toBe(0);
  });

  it('clears all projects', () => {
    const doc = { ...SAMPLE_DIRECT_START };
    addRecentProject(doc, 'A.json');
    addRecentProject(doc, 'B.json');
    expect(getRecentProjects().length).toBe(2);

    clearRecentProjects();
    expect(getRecentProjects().length).toBe(0);
  });
});
