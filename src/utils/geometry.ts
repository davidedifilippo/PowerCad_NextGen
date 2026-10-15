import { Pt, Rotation, SheetFormat } from '../model/types';

export const GRID_SIZE = 10;

export function snap(val: number, step = GRID_SIZE): number {
  return Math.round(val / step) * step;
}

export function snapPt(p: Pt, step = GRID_SIZE): Pt {
  return { x: snap(p.x, step), y: snap(p.y, step) };
}

/** Rotate a relative point around (0,0) by rotation angle */
export function rotatePt(p: Pt, rot: Rotation): Pt {
  switch (rot) {
    case 90:
      return { x: -p.y, y: p.x };
    case 180:
      return { x: -p.x, y: -p.y };
    case 270:
      return { x: p.y, y: -p.x };
    default:
      return { x: p.x, y: p.y };
  }
}

/** Transform local terminal point to absolute world coords */
export function localToWorld(elemX: number, elemY: number, local: Pt, rot: Rotation): Pt {
  const r = rotatePt(local, rot);
  return { x: elemX + r.x, y: elemY + r.y };
}

export function dist(a: Pt, b: Pt): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function ptKey(p: Pt): string {
  return `${snap(p.x)},${snap(p.y)}`;
}

/** Check if point P lies on line segment AB within a tolerance */
export function isPointOnSegment(p: Pt, a: Pt, b: Pt, tol = 3): boolean {
  const minX = Math.min(a.x, b.x) - tol;
  const maxX = Math.max(a.x, b.x) + tol;
  const minY = Math.min(a.y, b.y) - tol;
  const maxY = Math.max(a.y, b.y) + tol;

  if (p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
    return false;
  }

  const cross = Math.abs((b.y - a.y) * p.x - (b.x - a.x) * p.y + b.x * a.y - b.y * a.x);
  const len = dist(a, b);
  if (len < 1e-4) return dist(p, a) <= tol;
  return cross / len <= tol;
}

/** Sheet dimensions in canvas units (points/pixels, approx 3.78 px per mm at 96 dpi) */
export const SHEET_SIZES: Record<SheetFormat, { w: number; h: number }> = {
  A4: { w: 1120, h: 792 },   // ~ 297mm x 210mm
  A3: { w: 1584, h: 1120 },  // ~ 420mm x 297mm
  A2: { w: 2240, h: 1584 },
  A1: { w: 3168, h: 2240 },
};

export function getSheetDimensions(format: SheetFormat, orientation: 'landscape' | 'portrait') {
  const size = SHEET_SIZES[format] || SHEET_SIZES.A4;
  return orientation === 'landscape'
    ? { w: Math.max(size.w, size.h), h: Math.min(size.w, size.h) }
    : { w: Math.min(size.w, size.h), h: Math.max(size.w, size.h) };
}

/** 2D Bounding Box in world coordinates */
export interface Box {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export function normalizeBox(box: Box): { minX: number; minY: number; maxX: number; maxY: number } {
  return {
    minX: Math.min(box.x1, box.x2),
    minY: Math.min(box.y1, box.y2),
    maxX: Math.max(box.x1, box.x2),
    maxY: Math.max(box.y1, box.y2),
  };
}

export function isPointInBox(p: Pt, box: Box): boolean {
  const { minX, minY, maxX, maxY } = normalizeBox(box);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

export function isSegmentInBox(a: Pt, b: Pt, box: Box): boolean {
  const { minX, minY, maxX, maxY } = normalizeBox(box);
  if (isPointInBox(a, box) || isPointInBox(b, box)) return true;

  const segMinX = Math.min(a.x, b.x);
  const segMaxX = Math.max(a.x, b.x);
  const segMinY = Math.min(a.y, b.y);
  const segMaxY = Math.max(a.y, b.y);

  if (segMaxX < minX || segMinX > maxX || segMaxY < minY || segMinY > maxY) {
    return false;
  }

  // Orthogonal horizontal segment
  if (Math.abs(a.y - b.y) < 1e-4) {
    return a.y >= minY && a.y <= maxY && segMinX <= maxX && segMaxX >= minX;
  }

  // Orthogonal vertical segment
  if (Math.abs(a.x - b.x) < 1e-4) {
    return a.x >= minX && a.x <= maxX && segMinY <= maxY && segMaxY >= minY;
  }

  return !(segMaxX < minX || segMinX > maxX || segMaxY < minY || segMinY > maxY);
}

export function isElementInBox(elem: Pt, box: Box, radius = 22): boolean {
  const { minX, minY, maxX, maxY } = normalizeBox(box);
  const eMinX = elem.x - radius;
  const eMaxX = elem.x + radius;
  const eMinY = elem.y - radius;
  const eMaxY = elem.y + radius;
  return !(eMaxX < minX || eMinX > maxX || eMaxY < minY || eMinY > maxY);
}

export function isWireInBox(pts: Pt[], box: Box): boolean {
  for (let i = 0; i < pts.length; i++) {
    if (isPointInBox(pts[i], box)) return true;
  }
  for (let i = 0; i < pts.length - 1; i++) {
    if (isSegmentInBox(pts[i], pts[i + 1], box)) return true;
  }
  return false;
}

