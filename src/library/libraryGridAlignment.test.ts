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

  it('places tag positions for MCB and RCD protections to the left of the manual trip box without overlap', async () => {
    const { getTagPosition } = await import('../editor/Renderer');
    const targetIds = [
      'rcd_differential_1p_n',
      'rcd_differential_3p',
      'rcd_differential_3p_n',
      'mcb_magnetothermal_1p',
      'mcb_magnetothermal_1p_n',
      'mcb_magnetothermal_2p',
      'mcb_magnetothermal_3p',
      'mcb_magnetothermal_3p_n',
    ];

    for (const id of targetIds) {
      const def = STANDARD_LIBRARY.find((c) => c.id === id);
      expect(def).toBeDefined();
      if (!def) continue;

      const tagPos = getTagPosition(def);
      expect(tagPos.textAnchor).toBe('end');

      // Find the leftmost mechanism box
      let minBoxX = Infinity;
      for (const prim of def.symbol) {
        if (prim.t === 'rect') minBoxX = Math.min(minBoxX, prim.x);
      }

      // Tag anchor (where right-aligned text ends) must be to the left of the box with margin
      expect(tagPos.x).toBeLessThanOrEqual(minBoxX - 5);
    }
  });
  it('motor_dc_pm has CADe_SIMU standard orientation with magnet bar on top and non-overlapping labels', async () => {
    const { getTagPosition } = await import('../editor/Renderer');
    const motor = STANDARD_LIBRARY.find((c) => c.id === 'motor_dc_pm');
    expect(motor).toBeDefined();

    // Terminals: A1 on left (-30, 0), A2 on right (30, 0), PE at bottom (0, 30)
    const tA1 = motor?.terminals.find((t) => t.id === 'A1');
    const tA2 = motor?.terminals.find((t) => t.id === 'A2');
    const tPE = motor?.terminals.find((t) => t.id === 'PE');
    expect(tA1).toEqual({ id: 'A1', x: -30, y: 0, label: 'A1' });
    expect(tA2).toEqual({ id: 'A2', x: 30, y: 0, label: 'A2' });
    expect(tPE).toEqual({ id: 'PE', x: 0, y: 30, label: 'PE' });

    // Permanent magnet bar at top (y < -18) detached from circle (r = 18)
    const magnetPath = motor?.symbol.find((s) => s.t === 'path' && s.d.includes('-25'));
    expect(magnetPath).toBeDefined();

    // Tag position must be in lower-left clear of A1 (-30, 0) and PE (0, 30)
    const tagPos = getTagPosition(motor!);
    expect(tagPos.y).toBeGreaterThan(15);
    expect(tagPos.x).toBeLessThan(0);
    expect(tagPos.textAnchor).toBe('end');
  });
});
