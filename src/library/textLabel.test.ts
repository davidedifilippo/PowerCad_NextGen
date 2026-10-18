import { describe, it, expect } from 'vitest';
import { registry } from './registry';
import { getComponentBounds } from '../editor/Renderer';

describe('Text Label Component and Bounds', () => {
  it('registers text_label in the component registry under category Testo', () => {
    const textDef = registry.get('text_label');
    expect(textDef).toBeDefined();
    expect(textDef?.category).toBe('Testo');
    expect(textDef?.terminals).toHaveLength(0);
    expect(textDef?.behavior.type).toBe('none');
  });

  it('computes accurate bounds for text_label based on text length and font size', () => {
    const textDef = registry.get('text_label')!;

    // Standard 14px text
    const bounds14 = getComponentBounds(textDef, { text: 'Circuito di comando', size: 14 });
    expect(bounds14.w).toBeGreaterThan(100);
    expect(bounds14.h).toBeGreaterThanOrEqual(20);

    // Large title text
    const boundsTitle = getComponentBounds(textDef, { text: 'Circuito di potenza trifase', size: 24 });
    expect(boundsTitle.w).toBeGreaterThan(bounds14.w);
    expect(boundsTitle.h).toBeGreaterThan(bounds14.h);
  });
});
