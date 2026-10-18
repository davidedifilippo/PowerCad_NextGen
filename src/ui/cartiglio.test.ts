import { describe, it, expect } from 'vitest';
import { CARTIGLIO_LIMITS } from './CartiglioModal';
import { Sheet } from '../model/types';

describe('Cartiglio (Title Block) Configuration & Limits', () => {
  it('defines realistic character limits that fit within cartiglio cell widths', () => {
    expect(CARTIGLIO_LIMITS.title).toBe(48); // Full row 420px
    expect(CARTIGLIO_LIMITS.project).toBe(36); // Row 1 left 270px
    expect(CARTIGLIO_LIMITS.author).toBe(18); // Row 3 col 1 120px
    expect(CARTIGLIO_LIMITS.date).toBe(12); // Row 3 col 2 90px
    expect(CARTIGLIO_LIMITS.revision).toBe(10); // Row 3 col 3 85px
    expect(CARTIGLIO_LIMITS.sheetNo).toBe(8); // Row 1 col 3 60px
    expect(CARTIGLIO_LIMITS.standard).toBe(18); // Row 3 col 4 125px
  });

  it('updates Sheet object cleanly with custom metadata', () => {
    const original: Sheet = {
      format: 'A3',
      orientation: 'landscape',
      project: 'Impianto Collaudo 2026',
      title: 'Quadro Distribuzione Potenza',
      author: 'Ing. Di Filippo',
      date: '2026-10-18',
      revision: 'Rev. 1.0',
      sheetNo: '1/1',
      standard: 'CEI / IEC 60617',
    };

    const updated: Sheet = {
      ...original,
      title: 'Circuito Ausiliario di Comando',
      revision: 'Rev. 2.0',
    };

    expect(updated.title).toBe('Circuito Ausiliario di Comando');
    expect(updated.revision).toBe('Rev. 2.0');
    expect(updated.project).toBe('Impianto Collaudo 2026');
    expect(updated.standard).toBe('CEI / IEC 60617');
  });
});
