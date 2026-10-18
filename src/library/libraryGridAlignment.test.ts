import { describe, it, expect } from 'vitest';
import { STANDARD_LIBRARY } from './standard';
import { GRID_SIZE } from '../utils/geometry';

describe('Standard Library Grid Alignment', () => {
  it('all component terminals are strictly aligned to the 10px grid', () => {
    const misaligned: { componentId: string; terminalId: string; x: number; y: number }[] = [];

    for (const comp of STANDARD_LIBRARY) {
      if (!comp.terminals) continue;
      for (const term of comp.terminals) {
        if (term.x % GRID_SIZE !== 0 || term.y % GRID_SIZE !== 0) {
          misaligned.push({
            componentId: comp.id,
            terminalId: term.id,
            x: term.x,
            y: term.y,
          });
        }
      }
    }

    expect(
      misaligned,
      `Found ${misaligned.length} misaligned terminals: ${JSON.stringify(misaligned, null, 2)}`
    ).toEqual([]);
  });

  it('rcd_differential_3p is present in standard library with aligned terminals', () => {
    const rcd3p = STANDARD_LIBRARY.find((c) => c.id === 'rcd_differential_3p');
    expect(rcd3p).toBeDefined();
    expect(rcd3p?.terminals.length).toBe(6);
    expect(rcd3p?.behavior.type).toBe('contact');
    expect((rcd3p?.behavior as any).isRCD).toBe(true);
  });
});
