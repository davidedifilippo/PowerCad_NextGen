import { ComponentDef } from '../model/types';

/**
 * Standard IEC-like symbols library defined declaratively with JSON-serializable primitives.
 * Easy to extend, customize or export to JSON.
 */
export const STANDARD_LIBRARY: ComponentDef[] = [
  // ==================== ALIMENTAZIONI ====================
  {
    id: 'pwr_l',
    name: 'Fase (L)',
    category: 'Alimentazione',
    tagPrefix: 'L',
    termLabels: false,
    terminals: [{ id: '1', x: 0, y: 10, label: 'L' }],
    behavior: { type: 'source', potentials: { '1': 'L' } },
    symbol: [
      { t: 'circle', cx: 0, cy: 0, r: 4, fill: '#ef4444' },
      { t: 'line', x1: 0, y1: 4, x2: 0, y2: 10, stroke: '#ef4444' },
    ],
  },
  {
    id: 'pwr_n',
    name: 'Neutro (N)',
    category: 'Alimentazione',
    tagPrefix: 'N',
    termLabels: false,
    terminals: [{ id: '1', x: 0, y: 10, label: 'N' }],
    behavior: { type: 'source', potentials: { '1': 'N' } },
    symbol: [
      { t: 'circle', cx: 0, cy: 0, r: 4, fill: '#3b82f6' },
      { t: 'line', x1: 0, y1: 4, x2: 0, y2: 10, stroke: '#3b82f6' },
    ],
  },
  {
    id: 'pwr_pe',
    name: 'Terra (PE)',
    category: 'Alimentazione',
    tagPrefix: 'PE',
    termLabels: false,
    terminals: [{ id: '1', x: 0, y: -10, label: 'PE' }],
    behavior: { type: 'source', potentials: { '1': 'PE' } },
    symbol: [
      { t: 'line', x1: 0, y1: -10, x2: 0, y2: 0, stroke: '#10b981' },
      { t: 'line', x1: -10, y1: 0, x2: 10, y2: 0, stroke: '#10b981', w: 2 },
      { t: 'line', x1: -6, y1: 4, x2: 6, y2: 4, stroke: '#10b981', w: 2 },
      { t: 'line', x1: -2, y1: 8, x2: 2, y2: 8, stroke: '#10b981', w: 2 },
    ],
  },
  {
    id: 'pwr_3p_n_pe',
    name: 'Alimentazione 3P + N + PE',
    category: 'Alimentazione',
    tagPrefix: 'SORG',
    termLabels: false,
    terminals: [
      { id: 'L1', x: -40, y: 10, label: 'L1' },
      { id: 'L2', x: -20, y: 10, label: 'L2' },
      { id: 'L3', x: 0, y: 10, label: 'L3' },
      { id: 'N', x: 20, y: 10, label: 'N' },
      { id: 'PE', x: 40, y: 10, label: 'PE' },
    ],
    behavior: {
      type: 'source',
      potentials: { L1: 'L1', L2: 'L2', L3: 'L3', N: 'N', PE: 'PE' },
    },
    symbol: [
      { t: 'circle', cx: -40, cy: 0, r: 3, fill: '#ef4444' },
      { t: 'circle', cx: -20, cy: 0, r: 3, fill: '#f59e0b' },
      { t: 'circle', cx: 0, cy: 0, r: 3, fill: '#10b981' },
      { t: 'circle', cx: 20, cy: 0, r: 3, fill: '#3b82f6' },
      { t: 'circle', cx: 40, cy: 0, r: 3, fill: '#84cc16' },
      { t: 'line', x1: -40, y1: 3, x2: -40, y2: 10 },
      { t: 'line', x1: -20, y1: 3, x2: -20, y2: 10 },
      { t: 'line', x1: 0, y1: 3, x2: 0, y2: 10 },
      { t: 'line', x1: 20, y1: 3, x2: 20, y2: 10 },
      { t: 'line', x1: 40, y1: 3, x2: 40, y2: 10 },
      { t: 'text', x: -40, y: -6, text: 'L1', size: 9, anchor: 'middle' },
      { t: 'text', x: -20, y: -6, text: 'L2', size: 9, anchor: 'middle' },
      { t: 'text', x: 0, y: -6, text: 'L3', size: 9, anchor: 'middle' },
      { t: 'text', x: 20, y: -6, text: 'N', size: 9, anchor: 'middle' },
      { t: 'text', x: 40, y: -6, text: 'PE', size: 9, anchor: 'middle' },
    ],
  },
  {
    id: 'pwr_dc_source',
    name: 'Alimentatore 24V DC (+/-)',
    category: 'Alimentazione',
    tagPrefix: 'G',
    termLabels: true,
    terminals: [
      { id: 'plus', x: -15, y: 15, label: '+24V' },
      { id: 'minus', x: 15, y: 15, label: '0V' },
    ],
    behavior: { type: 'source', potentials: { plus: '+24V', minus: '0V' } },
    symbol: [
      { t: 'rect', x: -25, y: -15, w: 50, h: 30, r: 3 },
      { t: 'text', x: 0, y: -3, text: '24V DC', size: 10, anchor: 'middle' },
      { t: 'line', x1: -15, y1: 15, x2: -15, y2: 15 },
      { t: 'line', x1: 15, y1: 15, x2: 15, y2: 15 },
      { t: 'text', x: -15, y: 10, text: '+', size: 11, anchor: 'middle', fill: '#ef4444' },
      { t: 'text', x: 15, y: 10, text: '-', size: 12, anchor: 'middle', fill: '#3b82f6' },
    ],
  },

  // ==================== PROTEZIONI ====================
  // ==================== FUSIBILI (IEC 60617) ====================
  {
    id: 'fuse_1p',
    name: 'Fusibile 1P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: 0, y: -20, label: '1' },
      { id: '2', x: 0, y: 20, label: '2' },
    ],
    behavior: { type: 'conductor', pairs: [['1', '2']] },
    symbol: [
      { t: 'rect', x: -4.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'fuse_1p_n',
    name: 'Fusibile 1P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -20, label: '1' },
      { id: '3', x: 10, y: -20, label: '3' },
      { id: '2', x: -10, y: 20, label: '2' },
      { id: '4', x: 10, y: 20, label: '4' },
    ],
    behavior: {
      type: 'conductor',
      pairs: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: Fuse (1-2)
      { t: 'rect', x: -14.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: 20 },
      // Pole 2: Neutral Link (3-4)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: 20 },
      { t: 'line', x1: 6, y1: -2, x2: 14, y2: -2, w: 1.8 },
    ],
  },
  {
    id: 'fuse_3p',
    name: 'Fusibile 3P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -20, y: -20, label: '1' },
      { id: '3', x: 0, y: -20, label: '3' },
      { id: '5', x: 20, y: -20, label: '5' },
      { id: '2', x: -20, y: 20, label: '2' },
      { id: '4', x: 0, y: 20, label: '4' },
      { id: '6', x: 20, y: 20, label: '6' },
    ],
    behavior: {
      type: 'conductor',
      pairs: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1
      { t: 'rect', x: -24.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: -20, y1: -20, x2: -20, y2: 20 },
      // Pole 2
      { t: 'rect', x: -4.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: 20 },
      // Pole 3
      { t: 'rect', x: 15.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: 20, y1: -20, x2: 20, y2: 20 },
    ],
  },
  {
    id: 'fuse_3p_n',
    name: 'Fusibile 3P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -30, y: -20, label: '1' },
      { id: '3', x: -10, y: -20, label: '3' },
      { id: '5', x: 10, y: -20, label: '5' },
      { id: '7', x: 30, y: -20, label: '7' },
      { id: '2', x: -30, y: 20, label: '2' },
      { id: '4', x: -10, y: 20, label: '4' },
      { id: '6', x: 10, y: 20, label: '6' },
      { id: '8', x: 30, y: 20, label: '8' },
    ],
    behavior: {
      type: 'conductor',
      pairs: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Pole 1
      { t: 'rect', x: -34.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: -30, y1: -20, x2: -30, y2: 20 },
      // Pole 2
      { t: 'rect', x: -14.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: 20 },
      // Pole 3
      { t: 'rect', x: 5.5, y: -9, w: 9, h: 18, fill: '#ffffff' },
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: 20 },
      // Pole 4: Neutral Link
      { t: 'line', x1: 30, y1: -20, x2: 30, y2: 20 },
      { t: 'line', x1: 26, y1: -2, x2: 34, y2: -2, w: 1.8 },
    ],
  },

  // ==================== SEZIONATORI PORTAFUSIBILI (IEC 60617) ====================
  {
    id: 'fuse_disconnector_1p',
    name: 'Sezionatore Portafusibili 1P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: 0, y: -20, label: '1' },
      { id: '2', x: 0, y: 20, label: '2' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [['1', '2']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -12 },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: 20 },
      // OFF (Open, slanted blade with fuse)
      { t: 'rect', x: -4.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 0 12)', when: 'off' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, transform: 'rotate(-22 0 12)', when: 'off' },
      // ON (Closed, straight)
      { t: 'rect', x: -4.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'fuse_disconnector_1p_n',
    name: 'Sezionatore Portafusibili 1P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -20, label: '1' },
      { id: '3', x: 10, y: -20, label: '3' },
      { id: '2', x: -10, y: 20, label: '2' },
      { id: '4', x: 10, y: 20, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: Fuse blade (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: 20 },
      { t: 'rect', x: -14.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'rect', x: -14.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, when: 'on' },
      // Pole 2: Neutral switch blade (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: 20 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'fuse_disconnector_2p',
    name: 'Sezionatore Portafusibili 2P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -20, label: '1' },
      { id: '3', x: 10, y: -20, label: '3' },
      { id: '2', x: -10, y: 20, label: '2' },
      { id: '4', x: 10, y: 20, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: Fuse blade (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: 20 },
      { t: 'rect', x: -14.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'rect', x: -14.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, when: 'on' },
      // Pole 2: Fuse blade (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: 20 },
      { t: 'rect', x: 5.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'rect', x: 5.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'fuse_disconnector_3p',
    name: 'Sezionatore Portafusibili 3P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -20, y: -20, label: '1' },
      { id: '3', x: 0, y: -20, label: '3' },
      { id: '5', x: 20, y: -20, label: '5' },
      { id: '2', x: -20, y: 20, label: '2' },
      { id: '4', x: 0, y: 20, label: '4' },
      { id: '6', x: 20, y: 20, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1: Fuse blade (-20)
      { t: 'line', x1: -20, y1: -20, x2: -20, y2: -12 },
      { t: 'line', x1: -20, y1: 12, x2: -20, y2: 20 },
      { t: 'rect', x: -24.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 -20 12)', when: 'off' },
      { t: 'line', x1: -20, y1: 12, x2: -20, y2: -12, transform: 'rotate(-22 -20 12)', when: 'off' },
      { t: 'rect', x: -24.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: -20, y1: 12, x2: -20, y2: -12, when: 'on' },
      // Pole 2: Fuse blade (0)
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -12 },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: 20 },
      { t: 'rect', x: -4.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 0 12)', when: 'off' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, transform: 'rotate(-22 0 12)', when: 'off' },
      { t: 'rect', x: -4.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, when: 'on' },
      // Pole 3: Fuse blade (20)
      { t: 'line', x1: 20, y1: -20, x2: 20, y2: -12 },
      { t: 'line', x1: 20, y1: 12, x2: 20, y2: 20 },
      { t: 'rect', x: 15.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 20 12)', when: 'off' },
      { t: 'line', x1: 20, y1: 12, x2: 20, y2: -12, transform: 'rotate(-22 20 12)', when: 'off' },
      { t: 'rect', x: 15.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: 20, y1: 12, x2: 20, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'fuse_disconnector_3p_n',
    name: 'Sezionatore Portafusibili 3P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -30, y: -20, label: '1' },
      { id: '3', x: -10, y: -20, label: '3' },
      { id: '5', x: 10, y: -20, label: '5' },
      { id: '7', x: 30, y: -20, label: '7' },
      { id: '2', x: -30, y: 20, label: '2' },
      { id: '4', x: -10, y: 20, label: '4' },
      { id: '6', x: 10, y: 20, label: '6' },
      { id: '8', x: 30, y: 20, label: '8' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Pole 1: Fuse blade (-30)
      { t: 'line', x1: -30, y1: -20, x2: -30, y2: -12 },
      { t: 'line', x1: -30, y1: 12, x2: -30, y2: 20 },
      { t: 'rect', x: -34.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 -30 12)', when: 'off' },
      { t: 'line', x1: -30, y1: 12, x2: -30, y2: -12, transform: 'rotate(-22 -30 12)', when: 'off' },
      { t: 'rect', x: -34.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: -30, y1: 12, x2: -30, y2: -12, when: 'on' },
      // Pole 2: Fuse blade (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: 20 },
      { t: 'rect', x: -14.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'rect', x: -14.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, when: 'on' },
      // Pole 3: Fuse blade (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: 20 },
      { t: 'rect', x: 5.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'rect', x: 5.5, y: -7, w: 9, h: 14, fill: '#ffffff', stroke: '#0f172a', when: 'on' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, when: 'on' },
      // Pole 4: Neutral switch blade (30)
      { t: 'line', x1: 30, y1: -20, x2: 30, y2: -12 },
      { t: 'line', x1: 30, y1: 12, x2: 30, y2: 20 },
      { t: 'line', x1: 30, y1: 12, x2: 30, y2: -12, transform: 'rotate(-22 30 12)', when: 'off' },
      { t: 'line', x1: 30, y1: 12, x2: 30, y2: -12, when: 'on' },
    ],
  },

  // ==================== INTERRUTTORI SEZIONATORI (IEC 60617) ====================
  {
    id: 'switch_disconnector_1p',
    name: 'Interruttore Sezionatore 1P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: 0, y: -20, label: '1' },
      { id: '2', x: 0, y: 20, label: '2' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [['1', '2']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -12 },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: 20 },
      // OFF (Open, slanted blade with filled square pad)
      { t: 'rect', x: -3.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 0 12)', when: 'off' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, transform: 'rotate(-22 0 12)', when: 'off' },
      // ON (Closed, straight)
      { t: 'rect', x: -3.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'switch_disconnector_1p_n',
    name: 'Interruttore Sezionatore 1P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -20, label: '1' },
      { id: '3', x: 10, y: -20, label: '3' },
      { id: '2', x: -10, y: 20, label: '2' },
      { id: '4', x: 10, y: 20, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: Disconnector blade with square pad (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: 20 },
      { t: 'rect', x: -13.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'rect', x: -13.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, when: 'on' },
      // Pole 2: Neutral switch blade (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: 20 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'switch_disconnector_2p',
    name: 'Interruttore Sezionatore 2P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -20, label: '1' },
      { id: '3', x: 10, y: -20, label: '3' },
      { id: '2', x: -10, y: 20, label: '2' },
      { id: '4', x: 10, y: 20, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1 (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: 20 },
      { t: 'rect', x: -13.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'rect', x: -13.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, when: 'on' },
      // Pole 2 (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: 20 },
      { t: 'rect', x: 6.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'rect', x: 6.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'switch_disconnector_3p',
    name: 'Interruttore Sezionatore 3P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -20, y: -20, label: '1' },
      { id: '3', x: 0, y: -20, label: '3' },
      { id: '5', x: 20, y: -20, label: '5' },
      { id: '2', x: -20, y: 20, label: '2' },
      { id: '4', x: 0, y: 20, label: '4' },
      { id: '6', x: 20, y: 20, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1 (-20)
      { t: 'line', x1: -20, y1: -20, x2: -20, y2: -12 },
      { t: 'line', x1: -20, y1: 12, x2: -20, y2: 20 },
      { t: 'rect', x: -23.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 -20 12)', when: 'off' },
      { t: 'line', x1: -20, y1: 12, x2: -20, y2: -12, transform: 'rotate(-22 -20 12)', when: 'off' },
      { t: 'rect', x: -23.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: -20, y1: 12, x2: -20, y2: -12, when: 'on' },
      // Pole 2 (0)
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -12 },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: 20 },
      { t: 'rect', x: -3.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 0 12)', when: 'off' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, transform: 'rotate(-22 0 12)', when: 'off' },
      { t: 'rect', x: -3.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: -12, when: 'on' },
      // Pole 3 (20)
      { t: 'line', x1: 20, y1: -20, x2: 20, y2: -12 },
      { t: 'line', x1: 20, y1: 12, x2: 20, y2: 20 },
      { t: 'rect', x: 16.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 20 12)', when: 'off' },
      { t: 'line', x1: 20, y1: 12, x2: 20, y2: -12, transform: 'rotate(-22 20 12)', when: 'off' },
      { t: 'rect', x: 16.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: 20, y1: 12, x2: 20, y2: -12, when: 'on' },
    ],
  },
  {
    id: 'switch_disconnector_3p_n',
    name: 'Interruttore Sezionatore 3P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -30, y: -20, label: '1' },
      { id: '3', x: -10, y: -20, label: '3' },
      { id: '5', x: 10, y: -20, label: '5' },
      { id: '7', x: 30, y: -20, label: '7' },
      { id: '2', x: -30, y: 20, label: '2' },
      { id: '4', x: -10, y: 20, label: '4' },
      { id: '6', x: 10, y: 20, label: '6' },
      { id: '8', x: 30, y: 20, label: '8' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Pole 1 (-30)
      { t: 'line', x1: -30, y1: -20, x2: -30, y2: -12 },
      { t: 'line', x1: -30, y1: 12, x2: -30, y2: 20 },
      { t: 'rect', x: -33.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 -30 12)', when: 'off' },
      { t: 'line', x1: -30, y1: 12, x2: -30, y2: -12, transform: 'rotate(-22 -30 12)', when: 'off' },
      { t: 'rect', x: -33.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: -30, y1: 12, x2: -30, y2: -12, when: 'on' },
      // Pole 2 (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: 20 },
      { t: 'rect', x: -13.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, transform: 'rotate(-22 -10 12)', when: 'off' },
      { t: 'rect', x: -13.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: -10, y1: 12, x2: -10, y2: -12, when: 'on' },
      // Pole 3 (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: 20 },
      { t: 'rect', x: 6.5, y: -7, w: 7, h: 7, fill: '#0f172a', transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, transform: 'rotate(-22 10 12)', when: 'off' },
      { t: 'rect', x: 6.5, y: -7, w: 7, h: 7, fill: '#0f172a', when: 'on' },
      { t: 'line', x1: 10, y1: 12, x2: 10, y2: -12, when: 'on' },
      // Pole 4: Neutral switch blade (30)
      { t: 'line', x1: 30, y1: -20, x2: 30, y2: -12 },
      { t: 'line', x1: 30, y1: 12, x2: 30, y2: 20 },
      { t: 'line', x1: 30, y1: 12, x2: 30, y2: -12, transform: 'rotate(-22 30 12)', when: 'off' },
      { t: 'line', x1: 30, y1: 12, x2: 30, y2: -12, when: 'on' },
    ],
  },

  // ==================== INTERRUTTORI DIFFERENZIALI (RCD) ====================
  {
    id: 'rcd_differential_1p_n',
    name: 'Interruttore Differenziale 1P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -20, label: '1' },
      { id: '3', x: 10, y: -20, label: '3' },
      { id: '2', x: -10, y: 20, label: '2' },
      { id: '4', x: 10, y: 20, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Contact stubs
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      // Switch blades
      { t: 'line', x1: -10, y1: 0, x2: -10, y2: -12, transform: 'rotate(-22 -10 0)', when: 'off' },
      { t: 'line', x1: 10, y1: 0, x2: 10, y2: -12, transform: 'rotate(-22 10 0)', when: 'off' },
      { t: 'line', x1: -10, y1: 0, x2: -10, y2: -12, when: 'on' },
      { t: 'line', x1: 10, y1: 0, x2: 10, y2: -12, when: 'on' },
      // Bottom lines through toroid
      { t: 'line', x1: -10, y1: 0, x2: -10, y2: 20 },
      { t: 'line', x1: 10, y1: 0, x2: 10, y2: 20 },
      // Toroid oval
      { t: 'rect', x: -16, y: 5, w: 32, h: 8, r: 4, fill: '#ffffff', stroke: '#0f172a' },
      // Link to trip relay
      { t: 'line', x1: -16, y1: 9, x2: -24, y2: 9 },
      { t: 'line', x1: -24, y1: 9, x2: -24, y2: -6 },
      // Trip relay box
      { t: 'rect', x: -30, y: -12, w: 12, h: 12, fill: '#ffffff' },
      { t: 'line', x1: -30, y1: -12, x2: -18, y2: 0 },
      { t: 'line', x1: -18, y1: -12, x2: -30, y2: 0 },
      // Dashed actuator link to contacts
      { t: 'line', x1: -18, y1: -6, x2: -12, y2: -6, dash: true },
    ],
  },
  {
    id: 'rcd_differential_3p_n',
    name: 'Interruttore Differenziale 3P + N',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -30, y: -20, label: '1' },
      { id: '3', x: -10, y: -20, label: '3' },
      { id: '5', x: 10, y: -20, label: '5' },
      { id: '7', x: 30, y: -20, label: '7' },
      { id: '2', x: -30, y: 20, label: '2' },
      { id: '4', x: -10, y: 20, label: '4' },
      { id: '6', x: 10, y: 20, label: '6' },
      { id: '8', x: 30, y: 20, label: '8' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Contact stubs
      { t: 'line', x1: -30, y1: -20, x2: -30, y2: -12 },
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -12 },
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -12 },
      { t: 'line', x1: 30, y1: -20, x2: 30, y2: -12 },
      // Switch blades
      { t: 'line', x1: -30, y1: 0, x2: -30, y2: -12, transform: 'rotate(-22 -30 0)', when: 'off' },
      { t: 'line', x1: -10, y1: 0, x2: -10, y2: -12, transform: 'rotate(-22 -10 0)', when: 'off' },
      { t: 'line', x1: 10, y1: 0, x2: 10, y2: -12, transform: 'rotate(-22 10 0)', when: 'off' },
      { t: 'line', x1: 30, y1: 0, x2: 30, y2: -12, transform: 'rotate(-22 30 0)', when: 'off' },
      { t: 'line', x1: -30, y1: 0, x2: -30, y2: -12, when: 'on' },
      { t: 'line', x1: -10, y1: 0, x2: -10, y2: -12, when: 'on' },
      { t: 'line', x1: 10, y1: 0, x2: 10, y2: -12, when: 'on' },
      { t: 'line', x1: 30, y1: 0, x2: 30, y2: -12, when: 'on' },
      // Bottom lines through toroid
      { t: 'line', x1: -30, y1: 0, x2: -30, y2: 20 },
      { t: 'line', x1: -10, y1: 0, x2: -10, y2: 20 },
      { t: 'line', x1: 10, y1: 0, x2: 10, y2: 20 },
      { t: 'line', x1: 30, y1: 0, x2: 30, y2: 20 },
      // Wide toroid oval
      { t: 'rect', x: -36, y: 5, w: 72, h: 8, r: 4, fill: '#ffffff', stroke: '#0f172a' },
      // Link to trip relay
      { t: 'line', x1: -36, y1: 9, x2: -44, y2: 9 },
      { t: 'line', x1: -44, y1: 9, x2: -44, y2: -6 },
      // Trip relay box
      { t: 'rect', x: -50, y: -12, w: 12, h: 12, fill: '#ffffff' },
      { t: 'line', x1: -50, y1: -12, x2: -38, y2: 0 },
      { t: 'line', x1: -38, y1: -12, x2: -50, y2: 0 },
      // Dashed actuator link to contacts
      { t: 'line', x1: -38, y1: -6, x2: -32, y2: -6, dash: true },
    ],
  },

  // ==================== RELE TERMICO BIMETALLICO (IEC 60617) ====================
  {
    id: 'thermal_bimetal_relay_3p',
    name: 'Relè Termico Bimetallico 3P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -20, y: -20, label: '1' },
      { id: '3', x: 0, y: -20, label: '3' },
      { id: '5', x: 20, y: -20, label: '5' },
      { id: '2', x: -20, y: 20, label: '2' },
      { id: '4', x: 0, y: 20, label: '4' },
      { id: '6', x: 20, y: 20, label: '6' },
    ],
    behavior: {
      type: 'thermal',
      pairs: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1: Bimetal square loop (-20)
      { t: 'line', x1: -20, y1: -20, x2: -20, y2: -6 },
      { t: 'line', x1: -20, y1: -6, x2: -14, y2: -6 },
      { t: 'line', x1: -14, y1: -6, x2: -14, y2: 6 },
      { t: 'line', x1: -14, y1: 6, x2: -20, y2: 6 },
      { t: 'line', x1: -20, y1: 6, x2: -20, y2: 20 },
      // Pole 2: Bimetal square loop (0)
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -6 },
      { t: 'line', x1: 0, y1: -6, x2: 6, y2: -6 },
      { t: 'line', x1: 6, y1: -6, x2: 6, y2: 6 },
      { t: 'line', x1: 6, y1: 6, x2: 0, y2: 6 },
      { t: 'line', x1: 0, y1: 6, x2: 0, y2: 20 },
      // Pole 3: Bimetal square loop (20)
      { t: 'line', x1: 20, y1: -20, x2: 20, y2: -6 },
      { t: 'line', x1: 20, y1: -6, x2: 26, y2: -6 },
      { t: 'line', x1: 26, y1: -6, x2: 26, y2: 6 },
      { t: 'line', x1: 26, y1: 6, x2: 20, y2: 6 },
      { t: 'line', x1: 20, y1: 6, x2: 20, y2: 20 },
    ],
  },

  // ==================== INTERRUTTORI MAGNETOTERMICI (MCB) ====================
  {
    id: 'mcb_magnetothermal_1p',
    name: 'Interruttore Magnetotermico 1P',
    category: 'Protezioni',
    tagPrefix: '-Q',
    terminals: [
      { id: '1', x: 0, y: -25, label: '1' },
      { id: '2', x: 0, y: 25, label: '2' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [['1', '2']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -16 },
      // Contact blade
      { t: 'line', x1: 0, y1: -4, x2: 0, y2: -16, transform: 'rotate(-22 0 -4)', when: 'off' },
      { t: 'line', x1: 0, y1: -4, x2: 0, y2: -16, when: 'on' },
      // Thermal/Magnetic trip unit
      { t: 'line', x1: 0, y1: -4, x2: 0, y2: 0 },
      { t: 'rect', x: -6, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: 0, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: 0, y1: 14, x2: 0, y2: 25 },
      // Manual control box on left
      { t: 'rect', x: -20, y: -16, w: 10, h: 10, fill: '#ffffff' },
      { t: 'line', x1: -20, y1: -16, x2: -10, y2: -6 },
      { t: 'line', x1: -10, y1: -16, x2: -20, y2: -6 },
      { t: 'line', x1: -15, y1: -6, x2: -15, y2: 7, dash: true },
      { t: 'line', x1: -15, y1: 7, x2: -6, y2: 7, dash: true },
      { t: 'line', x1: -10, y1: -11, x2: -3, y2: -11, dash: true },
    ],
  },
  {
    id: 'mcb_magnetothermal_1p_n',
    name: 'Interruttore Magnetotermico 1P + N',
    category: 'Protezioni',
    tagPrefix: '-Q',
    terminals: [
      { id: '1', x: -10, y: -25, label: '1' },
      { id: '3', x: 10, y: -25, label: '3' },
      { id: '2', x: -10, y: 25, label: '2' },
      { id: '4', x: 10, y: 25, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: Phase with I > trip (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -16 },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: -16, transform: 'rotate(-22 -10 -4)', when: 'off' },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: -16, when: 'on' },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: 0 },
      { t: 'rect', x: -16, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: -10, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: -10, y1: 14, x2: -10, y2: 25 },
      // Pole 2: Neutral blade (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -16 },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: -16, transform: 'rotate(-22 10 -4)', when: 'off' },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: -16, when: 'on' },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: 25 },
      // Manual control box on left
      { t: 'rect', x: -30, y: -16, w: 10, h: 10, fill: '#ffffff' },
      { t: 'line', x1: -30, y1: -16, x2: -20, y2: -6 },
      { t: 'line', x1: -20, y1: -16, x2: -30, y2: -6 },
      { t: 'line', x1: -25, y1: -6, x2: -25, y2: 7, dash: true },
      { t: 'line', x1: -25, y1: 7, x2: -16, y2: 7, dash: true },
      { t: 'line', x1: -20, y1: -11, x2: -13, y2: -11, dash: true },
    ],
  },
  {
    id: 'mcb_magnetothermal_2p',
    name: 'Interruttore Magnetotermico 2P',
    category: 'Protezioni',
    tagPrefix: '-Q',
    terminals: [
      { id: '1', x: -10, y: -25, label: '1' },
      { id: '3', x: 10, y: -25, label: '3' },
      { id: '2', x: -10, y: 25, label: '2' },
      { id: '4', x: 10, y: 25, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -16 },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: -16, transform: 'rotate(-22 -10 -4)', when: 'off' },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: -16, when: 'on' },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: 0 },
      { t: 'rect', x: -16, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: -10, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: -10, y1: 14, x2: -10, y2: 25 },
      // Pole 2: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -16 },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: -16, transform: 'rotate(-22 10 -4)', when: 'off' },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: -16, when: 'on' },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: 0 },
      { t: 'rect', x: 4, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: 10, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: 10, y1: 14, x2: 10, y2: 25 },
      // Manual control box on left
      { t: 'rect', x: -30, y: -16, w: 10, h: 10, fill: '#ffffff' },
      { t: 'line', x1: -30, y1: -16, x2: -20, y2: -6 },
      { t: 'line', x1: -20, y1: -16, x2: -30, y2: -6 },
      { t: 'line', x1: -25, y1: -6, x2: -25, y2: 7, dash: true },
      { t: 'line', x1: -25, y1: 7, x2: -16, y2: 7, dash: true },
      { t: 'line', x1: -20, y1: -11, x2: -13, y2: -11, dash: true },
    ],
  },
  {
    id: 'mcb_magnetothermal_3p',
    name: 'Interruttore Magnetotermico 3P',
    category: 'Protezioni',
    tagPrefix: '-Q',
    terminals: [
      { id: '1', x: -20, y: -25, label: '1' },
      { id: '3', x: 0, y: -25, label: '3' },
      { id: '5', x: 20, y: -25, label: '5' },
      { id: '2', x: -20, y: 25, label: '2' },
      { id: '4', x: 0, y: 25, label: '4' },
      { id: '6', x: 20, y: 25, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1: (-20)
      { t: 'line', x1: -20, y1: -25, x2: -20, y2: -16 },
      { t: 'line', x1: -20, y1: -4, x2: -20, y2: -16, transform: 'rotate(-22 -20 -4)', when: 'off' },
      { t: 'line', x1: -20, y1: -4, x2: -20, y2: -16, when: 'on' },
      { t: 'line', x1: -20, y1: -4, x2: -20, y2: 0 },
      { t: 'rect', x: -26, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: -20, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: -20, y1: 14, x2: -20, y2: 25 },
      // Pole 2: (0)
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -16 },
      { t: 'line', x1: 0, y1: -4, x2: 0, y2: -16, transform: 'rotate(-22 0 -4)', when: 'off' },
      { t: 'line', x1: 0, y1: -4, x2: 0, y2: -16, when: 'on' },
      { t: 'line', x1: 0, y1: -4, x2: 0, y2: 0 },
      { t: 'rect', x: -6, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: 0, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: 0, y1: 14, x2: 0, y2: 25 },
      // Pole 3: (20)
      { t: 'line', x1: 20, y1: -25, x2: 20, y2: -16 },
      { t: 'line', x1: 20, y1: -4, x2: 20, y2: -16, transform: 'rotate(-22 20 -4)', when: 'off' },
      { t: 'line', x1: 20, y1: -4, x2: 20, y2: -16, when: 'on' },
      { t: 'line', x1: 20, y1: -4, x2: 20, y2: 0 },
      { t: 'rect', x: 14, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: 20, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: 20, y1: 14, x2: 20, y2: 25 },
      // Manual control box on left
      { t: 'rect', x: -40, y: -16, w: 10, h: 10, fill: '#ffffff' },
      { t: 'line', x1: -40, y1: -16, x2: -30, y2: -6 },
      { t: 'line', x1: -30, y1: -16, x2: -40, y2: -6 },
      { t: 'line', x1: -35, y1: -6, x2: -35, y2: 7, dash: true },
      { t: 'line', x1: -35, y1: 7, x2: -26, y2: 7, dash: true },
      { t: 'line', x1: -30, y1: -11, x2: -23, y2: -11, dash: true },
    ],
  },
  {
    id: 'mcb_magnetothermal_3p_n',
    name: 'Interruttore Magnetotermico 3P + N',
    category: 'Protezioni',
    tagPrefix: '-Q',
    terminals: [
      { id: '1', x: -30, y: -25, label: '1' },
      { id: '3', x: -10, y: -25, label: '3' },
      { id: '5', x: 10, y: -25, label: '5' },
      { id: '7', x: 30, y: -25, label: '7' },
      { id: '2', x: -30, y: 25, label: '2' },
      { id: '4', x: -10, y: 25, label: '4' },
      { id: '6', x: 10, y: 25, label: '6' },
      { id: '8', x: 30, y: 25, label: '8' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Pole 1: (-30)
      { t: 'line', x1: -30, y1: -25, x2: -30, y2: -16 },
      { t: 'line', x1: -30, y1: -4, x2: -30, y2: -16, transform: 'rotate(-22 -30 -4)', when: 'off' },
      { t: 'line', x1: -30, y1: -4, x2: -30, y2: -16, when: 'on' },
      { t: 'line', x1: -30, y1: -4, x2: -30, y2: 0 },
      { t: 'rect', x: -36, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: -30, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: -30, y1: 14, x2: -30, y2: 25 },
      // Pole 2: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -16 },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: -16, transform: 'rotate(-22 -10 -4)', when: 'off' },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: -16, when: 'on' },
      { t: 'line', x1: -10, y1: -4, x2: -10, y2: 0 },
      { t: 'rect', x: -16, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: -10, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: -10, y1: 14, x2: -10, y2: 25 },
      // Pole 3: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -16 },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: -16, transform: 'rotate(-22 10 -4)', when: 'off' },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: -16, when: 'on' },
      { t: 'line', x1: 10, y1: -4, x2: 10, y2: 0 },
      { t: 'rect', x: 4, y: 0, w: 12, h: 14, fill: '#ffffff' },
      { t: 'text', x: 10, y: 10, text: 'I >', size: 7.5, anchor: 'middle' },
      { t: 'line', x1: 10, y1: 14, x2: 10, y2: 25 },
      // Pole 4: Neutral blade (30)
      { t: 'line', x1: 30, y1: -25, x2: 30, y2: -16 },
      { t: 'line', x1: 30, y1: -4, x2: 30, y2: -16, transform: 'rotate(-22 30 -4)', when: 'off' },
      { t: 'line', x1: 30, y1: -4, x2: 30, y2: -16, when: 'on' },
      { t: 'line', x1: 30, y1: -4, x2: 30, y2: 25 },
      // Manual control box on left
      { t: 'rect', x: -50, y: -16, w: 10, h: 10, fill: '#ffffff' },
      { t: 'line', x1: -50, y1: -16, x2: -40, y2: -6 },
      { t: 'line', x1: -40, y1: -16, x2: -50, y2: -6 },
      { t: 'line', x1: -45, y1: -6, x2: -45, y2: 7, dash: true },
      { t: 'line', x1: -45, y1: 7, x2: -36, y2: 7, dash: true },
      { t: 'line', x1: -40, y1: -11, x2: -33, y2: -11, dash: true },
    ],
  },

  // ==================== SCARICATORI DI SOVRATENSIONE (SPD) ====================
  {
    id: 'spd_surge_arrester_2p',
    name: 'Scaricatore di Sovratensione SPD 2P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -10, y: -25, label: '1' },
      { id: '2', x: 10, y: -25, label: '2' },
      { id: 'PE', x: 0, y: 25, label: 'PE' },
    ],
    behavior: { type: 'conductor', pairs: [] },
    symbol: [
      // Enclosing dashed box
      { t: 'rect', x: -18, y: -16, w: 36, h: 32, dash: true },
      // Pole 1: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -7 },
      { t: 'path', d: 'M -14 -6 L -6 -6 L -10 0 Z', fill: '#0f172a' },
      { t: 'path', d: 'M -14 6 L -6 6 L -10 0 Z', fill: '#0f172a' },
      { t: 'line', x1: -10, y1: 7, x2: -10, y2: 14 },
      // Pole 2: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -7 },
      { t: 'path', d: 'M 6 -6 L 14 -6 L 10 0 Z', fill: '#0f172a' },
      { t: 'path', d: 'M 6 6 L 14 6 L 10 0 Z', fill: '#0f172a' },
      { t: 'line', x1: 10, y1: 7, x2: 10, y2: 14 },
      // Common ground bus to PE terminal
      { t: 'line', x1: -10, y1: 14, x2: 10, y2: 14 },
      { t: 'line', x1: 0, y1: 14, x2: 0, y2: 25 },
    ],
  },
  {
    id: 'spd_surge_arrester_4p',
    name: 'Scaricatore di Sovratensione SPD 4P',
    category: 'Protezioni',
    tagPrefix: '-F',
    terminals: [
      { id: '1', x: -30, y: -25, label: '1' },
      { id: '2', x: -10, y: -25, label: '2' },
      { id: '3', x: 10, y: -25, label: '3' },
      { id: '4', x: 30, y: -25, label: '4' },
      { id: 'PE', x: 0, y: 25, label: 'PE' },
    ],
    behavior: { type: 'conductor', pairs: [] },
    symbol: [
      // Enclosing dashed box
      { t: 'rect', x: -38, y: -16, w: 76, h: 32, dash: true },
      // Pole 1: (-30)
      { t: 'line', x1: -30, y1: -25, x2: -30, y2: -7 },
      { t: 'path', d: 'M -34 -6 L -26 -6 L -30 0 Z', fill: '#0f172a' },
      { t: 'path', d: 'M -34 6 L -26 6 L -30 0 Z', fill: '#0f172a' },
      { t: 'line', x1: -30, y1: 7, x2: -30, y2: 14 },
      // Pole 2: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -7 },
      { t: 'path', d: 'M -14 -6 L -6 -6 L -10 0 Z', fill: '#0f172a' },
      { t: 'path', d: 'M -14 6 L -6 6 L -10 0 Z', fill: '#0f172a' },
      { t: 'line', x1: -10, y1: 7, x2: -10, y2: 14 },
      // Pole 3: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -7 },
      { t: 'path', d: 'M 6 -6 L 14 -6 L 10 0 Z', fill: '#0f172a' },
      { t: 'path', d: 'M 6 6 L 14 6 L 10 0 Z', fill: '#0f172a' },
      { t: 'line', x1: 10, y1: 7, x2: 10, y2: 14 },
      // Pole 4: (30)
      { t: 'line', x1: 30, y1: -25, x2: 30, y2: -7 },
      { t: 'path', d: 'M 26 -6 L 34 -6 L 30 0 Z', fill: '#0f172a' },
      { t: 'path', d: 'M 26 6 L 34 6 L 30 0 Z', fill: '#0f172a' },
      { t: 'line', x1: 30, y1: 7, x2: 30, y2: 14 },
      // Common ground bus to PE terminal
      { t: 'line', x1: -30, y1: 14, x2: 30, y2: 14 },
      { t: 'line', x1: 0, y1: 14, x2: 0, y2: 25 },
    ],
  },
  {
    id: 'disconnector_3p',
    name: 'Sezionatore Magnetotermico 3P',
    category: 'Protezioni',
    tagPrefix: '-QM',
    terminals: [
      { id: '1', x: -20, y: -25, label: '1' },
      { id: '3', x: 0, y: -25, label: '3' },
      { id: '5', x: 20, y: -25, label: '5' },
      { id: '2', x: -20, y: 25, label: '2' },
      { id: '4', x: 0, y: 25, label: '4' },
      { id: '6', x: 20, y: 25, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1
      { t: 'line', x1: -20, y1: -25, x2: -20, y2: -10 },
      { t: 'circle', cx: -20, cy: -10, r: 2 },
      { t: 'circle', cx: -20, cy: 10, r: 2 },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: 25 },
      { t: 'line', x1: -20, y1: 10, x2: -14, y2: -8, when: 'off' },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: -10, when: 'on' },
      // Pole 2
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -10 },
      { t: 'circle', cx: 0, cy: -10, r: 2 },
      { t: 'circle', cx: 0, cy: 10, r: 2 },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: 25 },
      { t: 'line', x1: 0, y1: 10, x2: 6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: -10, when: 'on' },
      // Pole 3
      { t: 'line', x1: 20, y1: -25, x2: 20, y2: -10 },
      { t: 'circle', cx: 20, cy: -10, r: 2 },
      { t: 'circle', cx: 20, cy: 10, r: 2 },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: 25 },
      { t: 'line', x1: 20, y1: 10, x2: 26, y2: -8, when: 'off' },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: -10, when: 'on' },
      // Connection bar
      { t: 'line', x1: -18, y1: 0, x2: 22, y2: 0, dash: true },
    ],
  },
  {
    id: 'thermal_relay_power',
    name: 'Relè Termico (Potenza 3P)',
    category: 'Protezioni',
    tagPrefix: '-FR',
    terminals: [
      { id: '1', x: -20, y: -20, label: '1' },
      { id: '3', x: 0, y: -20, label: '3' },
      { id: '5', x: 20, y: -20, label: '5' },
      { id: '2', x: -20, y: 20, label: '2' },
      { id: '4', x: 0, y: 20, label: '4' },
      { id: '6', x: 20, y: 20, label: '6' },
    ],
    behavior: {
      type: 'thermal',
      pairs: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      { t: 'line', x1: -20, y1: -20, x2: -20, y2: -8 },
      { t: 'rect', x: -25, y: -8, w: 10, h: 16 },
      { t: 'line', x1: -20, y1: 8, x2: -20, y2: 20 },

      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'rect', x: -5, y: -8, w: 10, h: 16 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },

      { t: 'line', x1: 20, y1: -20, x2: 20, y2: -8 },
      { t: 'rect', x: 15, y: -8, w: 10, h: 16 },
      { t: 'line', x1: 20, y1: 8, x2: 20, y2: 20 },
    ],
  },

  // ==================== CONTATTORI & INTERRUTTORI ====================
  // --- Gruppo 1: Contatti Principali di Potenza del Contattore (1P, 2P, 3P, 4P) ---
  {
    id: 'contactor_power_1p',
    name: 'Contattore 1P',
    category: 'Contattori',
    tagPrefix: '-KM',
    terminals: [
      { id: '1', x: 0, y: -25, label: '1' },
      { id: '2', x: 0, y: 25, label: '2' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [['1', '2']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -10 },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: 25 },
      { t: 'line', x1: 0, y1: 10, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: -10, when: 'on' },
    ],
  },
  {
    id: 'contactor_power_2p',
    name: 'Contattore 2P',
    category: 'Contattori',
    tagPrefix: '-KM',
    terminals: [
      { id: '1', x: -10, y: -25, label: '1' },
      { id: '3', x: 10, y: -25, label: '3' },
      { id: '2', x: -10, y: 25, label: '2' },
      { id: '4', x: 10, y: 25, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -10 },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: 25 },
      { t: 'line', x1: -10, y1: 10, x2: -16, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: -10, when: 'on' },
      // Pole 2: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -10 },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: 25 },
      { t: 'line', x1: 10, y1: 10, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: -10, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -13, y1: 1, x2: 7, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -10, y1: 0, x2: 10, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'contactor_power_3p',
    name: 'Contattore 3P',
    category: 'Contattori',
    tagPrefix: '-KM',
    terminals: [
      { id: '1', x: -20, y: -25, label: '1' },
      { id: '3', x: 0, y: -25, label: '3' },
      { id: '5', x: 20, y: -25, label: '5' },
      { id: '2', x: -20, y: 25, label: '2' },
      { id: '4', x: 0, y: 25, label: '4' },
      { id: '6', x: 20, y: 25, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1: (-20)
      { t: 'line', x1: -20, y1: -25, x2: -20, y2: -10 },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: 25 },
      { t: 'line', x1: -20, y1: 10, x2: -26, y2: -8, when: 'off' },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: -10, when: 'on' },
      // Pole 2: (0)
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -10 },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: 25 },
      { t: 'line', x1: 0, y1: 10, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: -10, when: 'on' },
      // Pole 3: (20)
      { t: 'line', x1: 20, y1: -25, x2: 20, y2: -10 },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: 25 },
      { t: 'line', x1: 20, y1: 10, x2: 14, y2: -8, when: 'off' },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: -10, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -23, y1: 1, x2: 17, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -20, y1: 0, x2: 20, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'contactor_power_4p',
    name: 'Contattore 4P',
    category: 'Contattori',
    tagPrefix: '-KM',
    terminals: [
      { id: '1', x: -30, y: -25, label: '1' },
      { id: '3', x: -10, y: -25, label: '3' },
      { id: '5', x: 10, y: -25, label: '5' },
      { id: '7', x: 30, y: -25, label: '7' },
      { id: '2', x: -30, y: 25, label: '2' },
      { id: '4', x: -10, y: 25, label: '4' },
      { id: '6', x: 10, y: 25, label: '6' },
      { id: '8', x: 30, y: 25, label: '8' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Pole 1: (-30)
      { t: 'line', x1: -30, y1: -25, x2: -30, y2: -10 },
      { t: 'line', x1: -30, y1: 10, x2: -30, y2: 25 },
      { t: 'line', x1: -30, y1: 10, x2: -36, y2: -8, when: 'off' },
      { t: 'line', x1: -30, y1: 10, x2: -30, y2: -10, when: 'on' },
      // Pole 2: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -10 },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: 25 },
      { t: 'line', x1: -10, y1: 10, x2: -16, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: -10, when: 'on' },
      // Pole 3: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -10 },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: 25 },
      { t: 'line', x1: 10, y1: 10, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: -10, when: 'on' },
      // Pole 4: (30)
      { t: 'line', x1: 30, y1: -25, x2: 30, y2: -10 },
      { t: 'line', x1: 30, y1: 10, x2: 30, y2: 25 },
      { t: 'line', x1: 30, y1: 10, x2: 24, y2: -8, when: 'off' },
      { t: 'line', x1: 30, y1: 10, x2: 30, y2: -10, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -33, y1: 1, x2: 27, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -30, y1: 0, x2: 30, y2: 0, dash: true, when: 'on' },
    ],
  },

  // --- Gruppo 2: Contattore 3P con Simbolo ad Arco IEC (Row 2) ---
  {
    id: 'contactor_power_arc_3p',
    name: 'Contattore 3P (Simbolo ad Arco IEC)',
    category: 'Contattori',
    tagPrefix: '-KM',
    terminals: [
      { id: '1', x: -20, y: -25, label: '1' },
      { id: '3', x: 0, y: -25, label: '3' },
      { id: '5', x: 20, y: -25, label: '5' },
      { id: '2', x: -20, y: 25, label: '2' },
      { id: '4', x: 0, y: 25, label: '4' },
      { id: '6', x: 20, y: 25, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1: (-20)
      { t: 'line', x1: -20, y1: -25, x2: -20, y2: -10 },
      { t: 'path', d: 'M -20 -16 A 3 3 0 0 0 -20 -10' },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: 25 },
      { t: 'line', x1: -20, y1: 10, x2: -26, y2: -8, when: 'off' },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: -10, when: 'on' },
      // Pole 2: (0)
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -10 },
      { t: 'path', d: 'M 0 -16 A 3 3 0 0 0 0 -10' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: 25 },
      { t: 'line', x1: 0, y1: 10, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: -10, when: 'on' },
      // Pole 3: (20)
      { t: 'line', x1: 20, y1: -25, x2: 20, y2: -10 },
      { t: 'path', d: 'M 20 -16 A 3 3 0 0 0 20 -10' },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: 25 },
      { t: 'line', x1: 20, y1: 10, x2: 14, y2: -8, when: 'off' },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: -10, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -23, y1: 1, x2: 17, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -20, y1: 0, x2: 20, y2: 0, dash: true, when: 'on' },
    ],
  },

  // --- Gruppo 3: Interruttori di Manovra Manuale (Row 3, Tag -S) ---
  {
    id: 'switch_manual_1p',
    name: 'Interruttore 1P',
    category: 'Contattori',
    tagPrefix: '-S',
    terminals: [
      { id: '1', x: 0, y: -25, label: '1' },
      { id: '2', x: 0, y: 25, label: '2' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [['1', '2']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -10 },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: 25 },
      { t: 'line', x1: 0, y1: 10, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: -10, when: 'on' },
      // Manual switch detent operator on left
      { t: 'line', x1: -18, y1: -5, x2: -18, y2: 5 },
      { t: 'line', x1: -18, y1: 0, x2: -14, y2: 0 },
      { t: 'line', x1: -14, y1: 0, x2: -11, y2: 5 },
      { t: 'line', x1: -11, y1: 5, x2: -8, y2: 0 },
      { t: 'line', x1: -8, y1: 0, x2: -3, y2: 0, when: 'off' },
      { t: 'line', x1: -8, y1: 0, x2: 0, y2: 0, when: 'on' },
    ],
  },
  {
    id: 'switch_manual_2p',
    name: 'Interruttore 2P',
    category: 'Contattori',
    tagPrefix: '-S',
    terminals: [
      { id: '1', x: -10, y: -25, label: '1' },
      { id: '3', x: 10, y: -25, label: '3' },
      { id: '2', x: -10, y: 25, label: '2' },
      { id: '4', x: 10, y: 25, label: '4' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
      ],
    },
    symbol: [
      // Pole 1: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -10 },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: 25 },
      { t: 'line', x1: -10, y1: 10, x2: -16, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: -10, when: 'on' },
      // Pole 2: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -10 },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: 25 },
      { t: 'line', x1: 10, y1: 10, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: -10, when: 'on' },
      // Manual operator on left
      { t: 'line', x1: -28, y1: -5, x2: -28, y2: 5 },
      { t: 'line', x1: -28, y1: 0, x2: -24, y2: 0 },
      { t: 'line', x1: -24, y1: 0, x2: -21, y2: 5 },
      { t: 'line', x1: -21, y1: 5, x2: -18, y2: 0 },
      { t: 'line', x1: -18, y1: 0, x2: -13, y2: 0, when: 'off' },
      { t: 'line', x1: -18, y1: 0, x2: -10, y2: 0, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -13, y1: 1, x2: 7, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -10, y1: 0, x2: 10, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'switch_manual_3p',
    name: 'Interruttore 3P',
    category: 'Contattori',
    tagPrefix: '-S',
    terminals: [
      { id: '1', x: -20, y: -25, label: '1' },
      { id: '3', x: 0, y: -25, label: '3' },
      { id: '5', x: 20, y: -25, label: '5' },
      { id: '2', x: -20, y: 25, label: '2' },
      { id: '4', x: 0, y: 25, label: '4' },
      { id: '6', x: 20, y: 25, label: '6' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
    },
    symbol: [
      // Pole 1: (-20)
      { t: 'line', x1: -20, y1: -25, x2: -20, y2: -10 },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: 25 },
      { t: 'line', x1: -20, y1: 10, x2: -26, y2: -8, when: 'off' },
      { t: 'line', x1: -20, y1: 10, x2: -20, y2: -10, when: 'on' },
      // Pole 2: (0)
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -10 },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: 25 },
      { t: 'line', x1: 0, y1: 10, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 10, x2: 0, y2: -10, when: 'on' },
      // Pole 3: (20)
      { t: 'line', x1: 20, y1: -25, x2: 20, y2: -10 },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: 25 },
      { t: 'line', x1: 20, y1: 10, x2: 14, y2: -8, when: 'off' },
      { t: 'line', x1: 20, y1: 10, x2: 20, y2: -10, when: 'on' },
      // Manual operator on left
      { t: 'line', x1: -38, y1: -5, x2: -38, y2: 5 },
      { t: 'line', x1: -38, y1: 0, x2: -34, y2: 0 },
      { t: 'line', x1: -34, y1: 0, x2: -31, y2: 5 },
      { t: 'line', x1: -31, y1: 5, x2: -28, y2: 0 },
      { t: 'line', x1: -28, y1: 0, x2: -23, y2: 0, when: 'off' },
      { t: 'line', x1: -28, y1: 0, x2: -20, y2: 0, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -23, y1: 1, x2: 17, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -20, y1: 0, x2: 20, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'switch_manual_4p',
    name: 'Interruttore 4P',
    category: 'Contattori',
    tagPrefix: '-S',
    terminals: [
      { id: '1', x: -30, y: -25, label: '1' },
      { id: '3', x: -10, y: -25, label: '3' },
      { id: '5', x: 10, y: -25, label: '5' },
      { id: '7', x: 30, y: -25, label: '7' },
      { id: '2', x: -30, y: 25, label: '2' },
      { id: '4', x: -10, y: 25, label: '4' },
      { id: '6', x: 10, y: 25, label: '6' },
      { id: '8', x: 30, y: 25, label: '8' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false,
      no: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
        ['7', '8'],
      ],
    },
    symbol: [
      // Pole 1: (-30)
      { t: 'line', x1: -30, y1: -25, x2: -30, y2: -10 },
      { t: 'line', x1: -30, y1: 10, x2: -30, y2: 25 },
      { t: 'line', x1: -30, y1: 10, x2: -36, y2: -8, when: 'off' },
      { t: 'line', x1: -30, y1: 10, x2: -30, y2: -10, when: 'on' },
      // Pole 2: (-10)
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -10 },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: 25 },
      { t: 'line', x1: -10, y1: 10, x2: -16, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 10, x2: -10, y2: -10, when: 'on' },
      // Pole 3: (10)
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -10 },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: 25 },
      { t: 'line', x1: 10, y1: 10, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 10, x2: 10, y2: -10, when: 'on' },
      // Pole 4: (30)
      { t: 'line', x1: 30, y1: -25, x2: 30, y2: -10 },
      { t: 'line', x1: 30, y1: 10, x2: 30, y2: 25 },
      { t: 'line', x1: 30, y1: 10, x2: 24, y2: -8, when: 'off' },
      { t: 'line', x1: 30, y1: 10, x2: 30, y2: -10, when: 'on' },
      // Manual operator on left
      { t: 'line', x1: -48, y1: -5, x2: -48, y2: 5 },
      { t: 'line', x1: -48, y1: 0, x2: -44, y2: 0 },
      { t: 'line', x1: -44, y1: 0, x2: -41, y2: 5 },
      { t: 'line', x1: -41, y1: 5, x2: -38, y2: 0 },
      { t: 'line', x1: -38, y1: 0, x2: -33, y2: 0, when: 'off' },
      { t: 'line', x1: -38, y1: 0, x2: -30, y2: 0, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -33, y1: 1, x2: 27, y2: 1, dash: true, when: 'off' },
      { t: 'line', x1: -30, y1: 0, x2: 30, y2: 0, dash: true, when: 'on' },
    ],
  },

  // --- Gruppo 4: Interblocco Meccanico (Row 4) ---
  {
    id: 'mechanical_interlock',
    name: 'Interblocco Meccanico Contattori',
    category: 'Contattori',
    terminals: [],
    termLabels: false,
    bounds: { x: -35, y: -15, w: 70, h: 25 },
    behavior: { type: 'none' },
    props: [
      { key: 'km1', label: 'Sigla Contattore 1', type: 'text', default: '-KM1' },
      { key: 'km2', label: 'Sigla Contattore 2', type: 'text', default: '-KM2' },
    ],
    symbol: [
      // Left dashed line
      { t: 'line', x1: -30, y1: 0, x2: -6, y2: 0, dash: true },
      // Triangle down
      { t: 'path', d: 'M -6 -5 L 6 -5 L 0 5 Z', fill: '#ffffff' },
      // Right dashed line
      { t: 'line', x1: 6, y1: 0, x2: 30, y2: 0, dash: true },
      // Text labels -KM1 and -KM2
      { t: 'text', x: -18, y: -4, text: '-KM1', size: 8.5, anchor: 'middle', fill: '#0284c7' },
      { t: 'text', x: 18, y: -4, text: '-KM2', size: 8.5, anchor: 'middle', fill: '#0284c7' },
    ],
  },

  // ==================== COMANDO & PULSANTI ====================
  {
    id: 'btn_no',
    name: 'Pulsante Normalmente Aperto (NA / Start)',
    category: 'Comando',
    tagPrefix: '-SB',
    terminals: [
      { id: '13', x: 0, y: -20, label: '13' },
      { id: '14', x: 0, y: 20, label: '14' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'momentary',
      no: [['13', '14']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'circle', cx: 0, cy: -8, r: 2 },
      { t: 'circle', cx: 0, cy: 8, r: 2 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      // Open
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -6, when: 'off' },
      { t: 'line', x1: 6, y1: -10, x2: 6, y2: -2, when: 'off', stroke: '#10b981', w: 2 },
      // Closed
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      { t: 'line', x1: 0, y1: -10, x2: 0, y2: -2, when: 'on', stroke: '#10b981', w: 2 },
    ],
  },
  {
    id: 'btn_nc',
    name: 'Pulsante Normalmente Chiuso (NC / Stop)',
    category: 'Comando',
    tagPrefix: '-SB',
    terminals: [
      { id: '11', x: 0, y: -20, label: '11' },
      { id: '12', x: 0, y: 20, label: '12' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'momentary',
      nc: [['11', '12']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'circle', cx: 0, cy: -8, r: 2 },
      { t: 'circle', cx: 0, cy: 8, r: 2 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      // NC idle is closed
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: -10, x2: 0, y2: -2, when: 'off', stroke: '#ef4444', w: 2 },
      // NC pressed opens
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -6, when: 'on' },
      { t: 'line', x1: 6, y1: -10, x2: 6, y2: -2, when: 'on', stroke: '#ef4444', w: 2 },
    ],
  },
  {
    id: 'btn_emergency',
    name: 'Pulsante a Fungo Emergenza NC (Latching)',
    category: 'Comando',
    tagPrefix: '-SE',
    terminals: [
      { id: '11', x: 0, y: -20, label: '11' },
      { id: '12', x: 0, y: 20, label: '12' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      defaultOn: false, // Inverted: default unpressed means closed
      nc: [['11', '12']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'circle', cx: 0, cy: -8, r: 2 },
      { t: 'circle', cx: 0, cy: 8, r: 2 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      // Fungo cap
      { t: 'path', d: 'M -8 -12 C -8 -17, 8 -17, 8 -12 Z', fill: '#ef4444' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 7, y2: -6, when: 'on' },
    ],
  },
  {
    id: 'switch_no',
    name: 'Selettore / Interruttore a Leva NA',
    category: 'Comando',
    tagPrefix: '-SA',
    terminals: [
      { id: '1', x: 0, y: -20, label: '1' },
      { id: '2', x: 0, y: 20, label: '2' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'latching',
      no: [['1', '2']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'circle', cx: 0, cy: -8, r: 2 },
      { t: 'circle', cx: 0, cy: 8, r: 2 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 7, y2: -6, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
    ],
  },

  // ==================== CONTATTI AUSILIARI & TEMPORIZZATI ====================
  // --- Gruppo 1: Contatti Ausiliari Istantanei (Tag -K) ---
  {
    id: 'contact_no',
    name: 'Contatto NO',
    category: 'Contatti',
    tagPrefix: '-K',
    terminals: [
      { id: '13', x: 0, y: -20, label: '13' },
      { id: '14', x: 0, y: 20, label: '14' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [['13', '14']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
    ],
  },
  {
    id: 'contact_nc',
    name: 'Contatto NC',
    category: 'Contatti',
    tagPrefix: '-K',
    terminals: [
      { id: '11', x: 0, y: -20, label: '11' },
      { id: '12', x: 0, y: 20, label: '12' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['11', '12']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: -8, x2: 6, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
    ],
  },
  {
    id: 'contact_aux_no_nc',
    name: 'Contatto NO + NC',
    category: 'Contatti',
    tagPrefix: '-K',
    terminals: [
      { id: '11', x: -10, y: -20, label: '11' },
      { id: '13', x: 10, y: -20, label: '13' },
      { id: '12', x: -10, y: 20, label: '12' },
      { id: '14', x: 10, y: 20, label: '14' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['11', '12']],
      no: [['13', '14']],
    },
    symbol: [
      // Left NC pole: (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -8 },
      { t: 'line', x1: -10, y1: -8, x2: -4, y2: -8 },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: 20 },
      { t: 'line', x1: -10, y1: 8, x2: -4, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: -8, when: 'on' },
      // Right NO pole: (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -8 },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: 20 },
      { t: 'line', x1: 10, y1: 8, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: -8, when: 'on' },
      // Mechanical link between blades
      { t: 'line', x1: -7, y1: 0, x2: 7, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -10, y1: 0, x2: 10, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'contact_aux_con',
    name: 'Contatto CON (Scambio)',
    category: 'Contatti',
    tagPrefix: '-K',
    terminals: [
      { id: '11', x: 0, y: -20, label: '11' },
      { id: '12', x: -10, y: 20, label: '12' },
      { id: '14', x: 10, y: 20, label: '14' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['11', '12']],
      no: [['11', '14']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      // NC bracket at 12
      { t: 'line', x1: -10, y1: 20, x2: -10, y2: 8 },
      { t: 'line', x1: -10, y1: 8, x2: -5, y2: 8 },
      // NO bracket at 14
      { t: 'line', x1: 10, y1: 20, x2: 10, y2: 8 },
      { t: 'line', x1: 10, y1: 8, x2: 5, y2: 8 },
      // Blade
      { t: 'line', x1: 0, y1: -8, x2: -5, y2: 8, when: 'off' },
      { t: 'line', x1: 0, y1: -8, x2: 5, y2: 8, when: 'on' },
    ],
  },

  // --- Gruppo 2: Contatti Temporizzati - Ritardo all'Eccitazione (Row 2, Tag -KA) ---
  {
    id: 'contact_timer_on_no',
    name: 'Ritardato all\'eccitazione NO',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '67', x: 0, y: -20, label: '67' },
      { id: '68', x: 0, y: 20, label: '68' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [['67', '68']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      // Timer actuator shaft with cup opening right (convex left)
      { t: 'line', x1: -14, y1: 0, x2: -3, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 0, y2: 0, dash: true, when: 'on' },
      { t: 'path', d: 'M -8 -5 A 5 5 0 0 0 -8 5' },
    ],
  },
  {
    id: 'contact_timer_on_nc',
    name: 'Ritardato all\'eccitazione NC',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: 0, y: -20, label: '55' },
      { id: '56', x: 0, y: 20, label: '56' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: -8, x2: 6, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      // Timer actuator shaft with cup opening right (convex left)
      { t: 'line', x1: -14, y1: 0, x2: 3, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 0, y2: 0, dash: true, when: 'on' },
      { t: 'path', d: 'M -8 -5 A 5 5 0 0 0 -8 5' },
    ],
  },
  {
    id: 'contact_timer_on_no_nc',
    name: 'Ritardato all\'eccitazione NO + NC',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: -10, y: -20, label: '55' },
      { id: '57', x: 10, y: -20, label: '57' },
      { id: '56', x: -10, y: 20, label: '56' },
      { id: '58', x: 10, y: 20, label: '58' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
      no: [['57', '58']],
    },
    symbol: [
      // Left NC pole: (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -8 },
      { t: 'line', x1: -10, y1: -8, x2: -4, y2: -8 },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: 20 },
      { t: 'line', x1: -10, y1: 8, x2: -4, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: -8, when: 'on' },
      // Right NO pole: (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -8 },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: 20 },
      { t: 'line', x1: 10, y1: 8, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: -8, when: 'on' },
      // Timer actuator shaft & cup on left
      { t: 'path', d: 'M -18 -5 A 5 5 0 0 0 -18 5' },
      { t: 'line', x1: -24, y1: 0, x2: 7, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -24, y1: 0, x2: 10, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'contact_timer_on_con',
    name: 'Ritardato all\'eccitazione CON',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: 0, y: -20, label: '55' },
      { id: '56', x: -10, y: 20, label: '56' },
      { id: '58', x: 10, y: 20, label: '58' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
      no: [['55', '58']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      // NC bracket at 56
      { t: 'line', x1: -10, y1: 20, x2: -10, y2: 8 },
      { t: 'line', x1: -10, y1: 8, x2: -5, y2: 8 },
      // NO bracket at 58
      { t: 'line', x1: 10, y1: 20, x2: 10, y2: 8 },
      { t: 'line', x1: 10, y1: 8, x2: 5, y2: 8 },
      // Blade
      { t: 'line', x1: 0, y1: -8, x2: -5, y2: 8, when: 'off' },
      { t: 'line', x1: 0, y1: -8, x2: 5, y2: 8, when: 'on' },
      // Timer actuator shaft & cup
      { t: 'path', d: 'M -8 -5 A 5 5 0 0 0 -8 5' },
      { t: 'line', x1: -14, y1: 0, x2: -2.5, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 2.5, y2: 0, dash: true, when: 'on' },
    ],
  },

  // --- Gruppo 3: Contatti Temporizzati - Ritardo alla Diseccitazione (Row 3, Tag -KA) ---
  {
    id: 'contact_timer_off_no',
    name: 'Ritardato alla diseccitazione NO',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '67', x: 0, y: -20, label: '67' },
      { id: '68', x: 0, y: 20, label: '68' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [['67', '68']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      // Timer actuator shaft with cup opening left (convex right)
      { t: 'line', x1: -14, y1: 0, x2: -3, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 0, y2: 0, dash: true, when: 'on' },
      { t: 'path', d: 'M -12 -5 A 5 5 0 0 1 -12 5' },
    ],
  },
  {
    id: 'contact_timer_off_nc',
    name: 'Ritardato alla diseccitazione NC',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: 0, y: -20, label: '55' },
      { id: '56', x: 0, y: 20, label: '56' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: -8, x2: 6, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      // Timer actuator shaft with cup opening left (convex right)
      { t: 'line', x1: -14, y1: 0, x2: 3, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 0, y2: 0, dash: true, when: 'on' },
      { t: 'path', d: 'M -12 -5 A 5 5 0 0 1 -12 5' },
    ],
  },
  {
    id: 'contact_timer_off_no_nc',
    name: 'Ritardato alla diseccitazione NO + NC',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: -10, y: -20, label: '55' },
      { id: '57', x: 10, y: -20, label: '57' },
      { id: '56', x: -10, y: 20, label: '56' },
      { id: '58', x: 10, y: 20, label: '58' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
      no: [['57', '58']],
    },
    symbol: [
      // Left NC pole: (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -8 },
      { t: 'line', x1: -10, y1: -8, x2: -4, y2: -8 },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: 20 },
      { t: 'line', x1: -10, y1: 8, x2: -4, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: -8, when: 'on' },
      // Right NO pole: (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -8 },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: 20 },
      { t: 'line', x1: 10, y1: 8, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: -8, when: 'on' },
      // Timer actuator shaft & cup on left
      { t: 'path', d: 'M -22 -5 A 5 5 0 0 1 -22 5' },
      { t: 'line', x1: -24, y1: 0, x2: 7, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -24, y1: 0, x2: 10, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'contact_timer_off_con',
    name: 'Ritardato alla diseccitazione CON',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: 0, y: -20, label: '55' },
      { id: '56', x: -10, y: 20, label: '56' },
      { id: '58', x: 10, y: 20, label: '58' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
      no: [['55', '58']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      // NC bracket at 56
      { t: 'line', x1: -10, y1: 20, x2: -10, y2: 8 },
      { t: 'line', x1: -10, y1: 8, x2: -5, y2: 8 },
      // NO bracket at 58
      { t: 'line', x1: 10, y1: 20, x2: 10, y2: 8 },
      { t: 'line', x1: 10, y1: 8, x2: 5, y2: 8 },
      // Blade
      { t: 'line', x1: 0, y1: -8, x2: -5, y2: 8, when: 'off' },
      { t: 'line', x1: 0, y1: -8, x2: 5, y2: 8, when: 'on' },
      // Timer actuator shaft & cup
      { t: 'path', d: 'M -12 -5 A 5 5 0 0 1 -12 5' },
      { t: 'line', x1: -14, y1: 0, x2: -2.5, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 2.5, y2: 0, dash: true, when: 'on' },
    ],
  },

  // --- Gruppo 4: Contatti Temporizzati - Ritardo Ecc./Disecc. (Row 4, Tag -KA) ---
  {
    id: 'contact_timer_onoff_no',
    name: 'Ritardato alla ecc./disecc. NO',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '67', x: 0, y: -20, label: '67' },
      { id: '68', x: 0, y: 20, label: '68' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      no: [['67', '68']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: -6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      // Double cup (umbrella in both directions)
      { t: 'line', x1: -14, y1: 0, x2: -3, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 0, y2: 0, dash: true, when: 'on' },
      { t: 'path', d: 'M -7 -5 A 4 4 0 0 0 -7 5' },
      { t: 'path', d: 'M -11 -5 A 4 4 0 0 1 -11 5' },
    ],
  },
  {
    id: 'contact_timer_onoff_nc',
    name: 'Ritardato alla ecc./disecc. NC',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: 0, y: -20, label: '55' },
      { id: '56', x: 0, y: 20, label: '56' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'line', x1: 0, y1: -8, x2: 6, y2: -8 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
      // Double cup (umbrella in both directions)
      { t: 'line', x1: -14, y1: 0, x2: 3, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 0, y2: 0, dash: true, when: 'on' },
      { t: 'path', d: 'M -7 -5 A 4 4 0 0 0 -7 5' },
      { t: 'path', d: 'M -11 -5 A 4 4 0 0 1 -11 5' },
    ],
  },
  {
    id: 'contact_timer_onoff_no_nc',
    name: 'Ritardato alla ecc./disecc. NO + NC',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: -10, y: -20, label: '55' },
      { id: '57', x: 10, y: -20, label: '57' },
      { id: '56', x: -10, y: 20, label: '56' },
      { id: '58', x: 10, y: 20, label: '58' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
      no: [['57', '58']],
    },
    symbol: [
      // Left NC pole: (-10)
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -8 },
      { t: 'line', x1: -10, y1: -8, x2: -4, y2: -8 },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: 20 },
      { t: 'line', x1: -10, y1: 8, x2: -4, y2: -8, when: 'off' },
      { t: 'line', x1: -10, y1: 8, x2: -10, y2: -8, when: 'on' },
      // Right NO pole: (10)
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -8 },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: 20 },
      { t: 'line', x1: 10, y1: 8, x2: 4, y2: -8, when: 'off' },
      { t: 'line', x1: 10, y1: 8, x2: 10, y2: -8, when: 'on' },
      // Double cup on left
      { t: 'path', d: 'M -17 -5 A 4 4 0 0 0 -17 5' },
      { t: 'path', d: 'M -21 -5 A 4 4 0 0 1 -21 5' },
      { t: 'line', x1: -24, y1: 0, x2: 7, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -24, y1: 0, x2: 10, y2: 0, dash: true, when: 'on' },
    ],
  },
  {
    id: 'contact_timer_onoff_con',
    name: 'Ritardato alla ecc./disecc. CON',
    category: 'Contatti',
    tagPrefix: '-KA',
    terminals: [
      { id: '55', x: 0, y: -20, label: '55' },
      { id: '56', x: -10, y: 20, label: '56' },
      { id: '58', x: 10, y: 20, label: '58' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['55', '56']],
      no: [['55', '58']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      // NC bracket at 56
      { t: 'line', x1: -10, y1: 20, x2: -10, y2: 8 },
      { t: 'line', x1: -10, y1: 8, x2: -5, y2: 8 },
      // NO bracket at 58
      { t: 'line', x1: 10, y1: 20, x2: 10, y2: 8 },
      { t: 'line', x1: 10, y1: 8, x2: 5, y2: 8 },
      // Blade
      { t: 'line', x1: 0, y1: -8, x2: -5, y2: 8, when: 'off' },
      { t: 'line', x1: 0, y1: -8, x2: 5, y2: 8, when: 'on' },
      // Double cup
      { t: 'path', d: 'M -7 -5 A 4 4 0 0 0 -7 5' },
      { t: 'path', d: 'M -11 -5 A 4 4 0 0 1 -11 5' },
      { t: 'line', x1: -14, y1: 0, x2: -2.5, y2: 0, dash: true, when: 'off' },
      { t: 'line', x1: -14, y1: 0, x2: 2.5, y2: 0, dash: true, when: 'on' },
    ],
  },

  {
    id: 'contact_thermal_aux_nc_no',
    name: 'Contatti Ausiliari Relè Termico (95-96 NC, 97-98 NA)',
    category: 'Contatti',
    tagPrefix: '-FR',
    terminals: [
      { id: '95', x: -15, y: -20, label: '95' },
      { id: '96', x: -15, y: 20, label: '96' },
      { id: '97', x: 15, y: -20, label: '97' },
      { id: '98', x: 15, y: 20, label: '98' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['95', '96']],
      no: [['97', '98']],
    },
    symbol: [
      // 95-96 NC
      { t: 'line', x1: -15, y1: -20, x2: -15, y2: -8 },
      { t: 'circle', cx: -15, cy: -8, r: 2 },
      { t: 'circle', cx: -15, cy: 8, r: 2 },
      { t: 'line', x1: -15, y1: 8, x2: -15, y2: 20 },
      { t: 'line', x1: -15, y1: 8, x2: -15, y2: -8, when: 'off' },
      { t: 'line', x1: -15, y1: 8, x2: -9, y2: -6, when: 'on' },
      // 97-98 NO
      { t: 'line', x1: 15, y1: -20, x2: 15, y2: -8 },
      { t: 'circle', cx: 15, cy: -8, r: 2 },
      { t: 'circle', cx: 15, cy: 8, r: 2 },
      { t: 'line', x1: 15, y1: 8, x2: 15, y2: 20 },
      { t: 'line', x1: 15, y1: 8, x2: 21, y2: -6, when: 'off' },
      { t: 'line', x1: 15, y1: 8, x2: 15, y2: -8, when: 'on' },
    ],
  },

  // ==================== BOBINE & SEGNALI ====================
  // --- Gruppo 1: Bobine Contattori, Relè ed Elettrovalvola ---
  {
    id: 'coil_standard',
    name: 'Bobina contattori e relè',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 0, y: -20, label: 'A1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'mono' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      // Normative IEC Horizontal Rectangle (24 x 14)
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#9ca3af', when: 'on' },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'coil_bistable',
    name: 'Bistabile Bobina contattori e relè',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: -6, y: -20, label: 'A1' },
      { id: 'B1', x: 6, y: -20, label: 'B1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'latch' },
    symbol: [
      { t: 'line', x1: -6, y1: -20, x2: -6, y2: -7 },
      { t: 'line', x1: 6, y1: -20, x2: 6, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Center trapezoid / dual diagonal windings
      { t: 'line', x1: -6, y1: -7, x2: -14, y2: 7 },
      { t: 'line', x1: 6, y1: -7, x2: 14, y2: 7 },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'coil_teleruttore',
    name: 'Teleruttore',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 0, y: -20, label: 'A1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'mono' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      { t: 'rect', x: -16, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -16, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Left section with triangle pointing to divider line
      { t: 'line', x1: -6, y1: -7, x2: -6, y2: 7 },
      { t: 'line', x1: -16, y1: -7, x2: -6, y2: 0 },
      { t: 'line', x1: -16, y1: 7, x2: -6, y2: 0 },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'coil_solenoid_valve',
    name: 'Bobina elettrovalvola',
    category: 'Bobine e Segnali',
    tagPrefix: '-EV',
    terminals: [
      { id: 'A1', x: 0, y: -20, label: 'A1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    behavior: { type: 'load', kind: 'lamp', a: 'A1', b: 'A2' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 24, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 24, h: 14, fill: '#9ca3af', when: 'on' },
      // Diagonal slash across the coil
      { t: 'line', x1: -14, y1: 7, x2: 10, y2: -7 },
      // Shaft connecting to valve
      { t: 'line', x1: 10, y1: 0, x2: 15, y2: 0 },
      // Valve butterfly symbol (two opposing triangles)
      { t: 'path', d: 'M 15 -8 L 23 -8 L 19 0 Z', fill: '#ffffff' },
      { t: 'path', d: 'M 15 8 L 23 8 L 19 0 Z', fill: '#ffffff' },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },

  // --- Gruppo 2: Temporizzatori e Contatori ---
  {
    id: 'coil_timer_on',
    name: 'Temporizzatore ritardato all\'eccitazione',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 2, y: -20, label: 'A1' },
      { id: 'A2', x: 2, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'delay', label: 'Tempo (secondi)', type: 'number', default: 3 },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'ton' },
    symbol: [
      { t: 'line', x1: 2, y1: -20, x2: 2, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Left section with cross X
      { t: 'line', x1: -4, y1: -7, x2: -4, y2: 7 },
      { t: 'line', x1: -14, y1: -7, x2: -4, y2: 7 },
      { t: 'line', x1: -14, y1: 7, x2: -4, y2: -7 },
      { t: 'line', x1: 2, y1: 7, x2: 2, y2: 20 },
    ],
  },
  {
    id: 'coil_timer_off',
    name: 'Temporizzatore ritardato alla diseccitazione',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 2, y: -20, label: 'A1' },
      { id: 'A2', x: 2, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'delay', label: 'Tempo (secondi)', type: 'number', default: 3 },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'tof' },
    symbol: [
      { t: 'line', x1: 2, y1: -20, x2: 2, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Left section filled solid black
      { t: 'rect', x: -14, y: -7, w: 10, h: 14, fill: '#0f172a' },
      { t: 'line', x1: 2, y1: 7, x2: 2, y2: 20 },
    ],
  },
  {
    id: 'coil_timer_on_off',
    name: 'Temporizzatore ritardato all\'eccitazione e alla diseccitazione',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 4, y: -20, label: 'A1' },
      { id: 'A2', x: 4, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'delay', label: 'Tempo (secondi)', type: 'number', default: 3 },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'ton' },
    symbol: [
      { t: 'line', x1: 4, y1: -20, x2: 4, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Left section: outer half with X, inner half filled black
      { t: 'line', x1: -8, y1: -7, x2: -8, y2: 7 },
      { t: 'line', x1: -14, y1: -7, x2: -8, y2: 7 },
      { t: 'line', x1: -14, y1: 7, x2: -8, y2: -7 },
      { t: 'rect', x: -8, y: -7, w: 6, h: 14, fill: '#0f172a' },
      { t: 'line', x1: -2, y1: -7, x2: -2, y2: 7 },
      { t: 'line', x1: 4, y1: 7, x2: 4, y2: 20 },
    ],
  },
  {
    id: 'coil_relay_flasher',
    name: 'Relè intermittente',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 2, y: -20, label: 'A1' },
      { id: 'A2', x: 2, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'delay', label: 'Periodo (secondi)', type: 'number', default: 1 },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'blink' },
    symbol: [
      { t: 'line', x1: 2, y1: -20, x2: 2, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Vertical divider
      { t: 'line', x1: -3, y1: -7, x2: -3, y2: 7 },
      // Square pulse waveform in left section
      { t: 'path', d: 'M -12 3 L -10 3 L -10 -3 L -7 -3 L -7 3 L -5 3' },
      { t: 'line', x1: 2, y1: 7, x2: 2, y2: 20 },
    ],
  },
  {
    id: 'coil_pulse_generator',
    name: 'Generatore d\'impulsi',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 2, y: -20, label: 'A1' },
      { id: 'A2', x: 2, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'delay', label: 'Durata impulso (s)', type: 'number', default: 0.5 },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'blink' },
    symbol: [
      { t: 'line', x1: 2, y1: -20, x2: 2, y2: -7 },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -14, y: -7, w: 28, h: 14, fill: '#9ca3af', when: 'on' },
      // Vertical divider
      { t: 'line', x1: -3, y1: -7, x2: -3, y2: 7 },
      // Double pulse waveform train in left section
      { t: 'path', d: 'M -13 3 L -12 3 L -12 -3 L -10 -3 L -10 3 L -8 3 L -8 -3 L -6 -3 L -6 3 L -5 3' },
      { t: 'line', x1: 2, y1: 7, x2: 2, y2: 20 },
    ],
  },
  {
    id: 'coil_time_switch',
    name: 'Interruttore orario',
    category: 'Bobine e Segnali',
    tagPrefix: '-K',
    terminals: [
      { id: 'A1', x: 0, y: -20, label: 'A1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'mono' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#9ca3af', when: 'on' },
      // Clock dial with hands at 12 and 3
      { t: 'circle', cx: 0, cy: 0, r: 6, fill: '#ffffff' },
      { t: 'line', x1: 0, y1: 0, x2: 0, y2: -4 },
      { t: 'line', x1: 0, y1: 0, x2: 4, y2: 0 },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'counter_impulse',
    name: 'Contatore d\'impulsi',
    category: 'Bobine e Segnali',
    tagPrefix: '-C',
    terminals: [
      { id: 'A1', x: -10, y: -20, label: 'A1' },
      { id: 'C', x: 0, y: -20, label: 'C' },
      { id: 'D', x: 10, y: -20, label: 'D' },
      { id: 'R', x: 20, y: -20, label: 'R' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'preset', label: 'Conteggio impostato', type: 'number', default: 5 },
    ],
    behavior: { type: 'coil', a: 'C', b: 'A2', mode: 'mono' },
    symbol: [
      // Main rectangle
      { t: 'rect', x: -24, y: -7, w: 48, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -24, y: -7, w: 48, h: 14, fill: '#9ca3af', when: 'on' },
      // Divider
      { t: 'line', x1: -10, y1: -7, x2: -10, y2: 7 },
      // Dial circle
      { t: 'circle', cx: -17, cy: 0, r: 5, fill: '#ffffff' },
      // Terminals
      { t: 'line', x1: -10, y1: -20, x2: -10, y2: -7 },
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      { t: 'line', x1: 10, y1: -20, x2: 10, y2: -7 },
      { t: 'line', x1: 20, y1: -20, x2: 20, y2: -7 },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },

  // ==================== MOTORI & CARICHI ====================
  {
    id: 'motor_3p_async',
    name: 'Motore Asincrono Trifase 3~ (M)',
    category: 'Motori',
    tagPrefix: '-M',
    terminals: [
      { id: 'U', x: -15, y: -25, label: 'U1' },
      { id: 'V', x: 0, y: -25, label: 'V1' },
      { id: 'W', x: 15, y: -25, label: 'W1' },
      { id: 'PE', x: 25, y: 0, label: 'PE' },
    ],
    behavior: { type: 'motor3', u: 'U', v: 'V', w: 'W' },
    symbol: [
      { t: 'circle', cx: 0, cy: 0, r: 22, fill: '#f8fafc' },
      { t: 'text', x: 0, y: -3, text: 'M', size: 14, anchor: 'middle' },
      { t: 'text', x: 0, y: 9, text: '3 ~', size: 9, anchor: 'middle' },
      { t: 'line', x1: -15, y1: -25, x2: -15, y2: -16 },
      { t: 'line', x1: 0, y1: -25, x2: 0, y2: -22 },
      { t: 'line', x1: 15, y1: -25, x2: 15, y2: -16 },
      { t: 'line', x1: 22, y1: 0, x2: 25, y2: 0, stroke: '#10b981' },
      // Rotating rotor indicator when running
      { t: 'rotor', cx: 0, cy: 0, r: 18, when: 'on' },
    ],
  },
  {
    id: 'motor_1p',
    name: 'Motore Monofase 1~ (M)',
    category: 'Motori',
    tagPrefix: '-M',
    terminals: [
      { id: 'U', x: -10, y: -25, label: 'U' },
      { id: 'N', x: 10, y: -25, label: 'N' },
      { id: 'PE', x: 25, y: 0, label: 'PE' },
    ],
    behavior: { type: 'load', kind: 'motor1', a: 'U', b: 'N' },
    symbol: [
      { t: 'circle', cx: 0, cy: 0, r: 22, fill: '#f8fafc' },
      { t: 'text', x: 0, y: -3, text: 'M', size: 14, anchor: 'middle' },
      { t: 'text', x: 0, y: 9, text: '1 ~', size: 9, anchor: 'middle' },
      { t: 'line', x1: -10, y1: -25, x2: -10, y2: -19 },
      { t: 'line', x1: 10, y1: -25, x2: 10, y2: -19 },
      { t: 'line', x1: 22, y1: 0, x2: 25, y2: 0, stroke: '#10b981' },
      { t: 'rotor', cx: 0, cy: 0, r: 18, when: 'on' },
    ],
  },

  // ==================== BOBINE & SEGNALI (SEGNALAZIONE) ====================
  {
    id: 'pilot_lamp',
    name: 'Lampada Spia di Segnalazione (H)',
    category: 'Bobine e Segnali',
    tagPrefix: '-H',
    props: [
      {
        key: 'color',
        label: 'Colore Lampada',
        type: 'select',
        options: ['Verde', 'Rosso', 'Giallo', 'Blu', 'Bianco'],
        default: 'Verde',
      },
    ],
    terminals: [
      { id: 'X1', x: 0, y: -20, label: 'X1' },
      { id: 'X2', x: 0, y: 20, label: 'X2' },
    ],
    behavior: { type: 'load', kind: 'lamp', a: 'X1', b: 'X2' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -12 },
      { t: 'circle', cx: 0, cy: 0, r: 12, fill: '#ffffff', when: 'off' },
      // Lit glow
      { t: 'circle', cx: 0, cy: 0, r: 12, fill: '#16a34a', when: 'on' },
      // Standard IEC Cross: always visible on top in black, preserving the symbol even when lit
      { t: 'line', x1: -8.5, y1: -8.5, x2: 8.5, y2: 8.5, stroke: '#0f172a', w: 1.5 },
      { t: 'line', x1: 8.5, y1: -8.5, x2: -8.5, y2: 8.5, stroke: '#0f172a', w: 1.5 },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'buzzer',
    name: 'Segnalatore Acustico / Sirena (H)',
    category: 'Bobine e Segnali',
    tagPrefix: '-H',
    terminals: [
      { id: '1', x: 0, y: -20, label: '1' },
      { id: '2', x: 0, y: 20, label: '2' },
    ],
    behavior: { type: 'load', kind: 'buzzer', a: '1', b: '2' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -12 },
      { t: 'rect', x: -10, y: -12, w: 20, h: 24 },
      { t: 'path', d: 'M 10 -6 L 16 -12 L 16 12 L 10 6 Z', fill: '#fbbf24' },
      { t: 'line', x1: 0, y1: 12, x2: 0, y2: 20 },
    ],
  },
];
