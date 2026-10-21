import { describe, it, expect } from 'vitest';
import { sanitizeFileName } from './fileSystemUtils';

describe('fileSystemUtils', () => {
  it('sanitizes invalid characters in filenames', () => {
    const raw = 'Schema:Quadro/Motore*1?';
    const clean = sanitizeFileName(raw, '.json');
    expect(clean).toBe('Schema_Quadro_Motore_1_.json');
  });

  it('preserves existing supported extensions', () => {
    expect(sanitizeFileName('Progetto.json', '.json')).toBe('Progetto.json');
    expect(sanitizeFileName('Progetto.pwrcad', '.json')).toBe('Progetto.pwrcad');
  });

  it('appends fallback extension if missing', () => {
    expect(sanitizeFileName('Impianto_Luce', '.json')).toBe('Impianto_Luce.json');
    expect(sanitizeFileName('Impianto_Luce', '.pwrcad')).toBe('Impianto_Luce.pwrcad');
  });

  it('handles empty or whitespace strings', () => {
    expect(sanitizeFileName('   ', '.json')).toBe('Schema_senza_titolo.json');
  });
});
