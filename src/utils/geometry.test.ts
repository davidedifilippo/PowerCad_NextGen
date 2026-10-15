import { describe, it, expect } from 'vitest';
import { isElementInBox, isWireInBox, Box } from './geometry';

describe('Box Selection Geometry Helpers', () => {
  const box: Box = { x1: 50, y1: 50, x2: 200, y2: 200 };

  it('correctly detects elements inside or overlapping the selection box', () => {
    // Element clearly inside
    expect(isElementInBox({ x: 100, y: 100 }, box)).toBe(true);
    // Element clearly outside
    expect(isElementInBox({ x: 300, y: 300 }, box)).toBe(false);
    // Element near border (within radius)
    expect(isElementInBox({ x: 55, y: 55 }, box)).toBe(true);
  });

  it('correctly detects wires with points inside the box', () => {
    const wireInside = [{ x: 80, y: 80 }, { x: 120, y: 80 }];
    expect(isWireInBox(wireInside, box)).toBe(true);

    const wireOutside = [{ x: 300, y: 300 }, { x: 400, y: 300 }];
    expect(isWireInBox(wireOutside, box)).toBe(false);
  });

  it('correctly detects wires crossing through the box even if endpoints are outside', () => {
    // Horizontal wire passing completely across the box from x=0 to x=300 at y=100
    const crossingWire = [{ x: 0, y: 100 }, { x: 300, y: 100 }];
    expect(isWireInBox(crossingWire, box)).toBe(true);

    // Vertical wire passing completely across the box from y=0 to y=300 at x=100
    const verticalCrossing = [{ x: 100, y: 0 }, { x: 100, y: 300 }];
    expect(isWireInBox(verticalCrossing, box)).toBe(true);
  });
});
