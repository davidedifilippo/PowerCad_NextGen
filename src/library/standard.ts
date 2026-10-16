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

  // ==================== CONTATTI AUSILIARI & POTENZA ====================
  {
    id: 'contact_no',
    name: 'Contatto Ausiliario NA (Linked)',
    category: 'Contatti',
    tagPrefix: '-KM',
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
      { t: 'circle', cx: 0, cy: -8, r: 2 },
      { t: 'circle', cx: 0, cy: 8, r: 2 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -6, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'on' },
    ],
  },
  {
    id: 'contact_nc',
    name: 'Contatto Ausiliario NC (Linked)',
    category: 'Contatti',
    tagPrefix: '-KM',
    terminals: [
      { id: '21', x: 0, y: -20, label: '21' },
      { id: '22', x: 0, y: 20, label: '22' },
    ],
    behavior: {
      type: 'contact',
      actuation: 'linked',
      nc: [['21', '22']],
    },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -8 },
      { t: 'circle', cx: 0, cy: -8, r: 2 },
      { t: 'circle', cx: 0, cy: 8, r: 2 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: 20 },
      { t: 'line', x1: 0, y1: 8, x2: 0, y2: -8, when: 'off' },
      { t: 'line', x1: 0, y1: 8, x2: 6, y2: -6, when: 'on' },
    ],
  },
  {
    id: 'contactor_power_3p',
    name: 'Contatti Potenza Contattore 3P (Linked)',
    category: 'Contatti',
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

  // ==================== BOBINE & TEMPORIZZATORI ====================
  {
    id: 'coil_standard',
    name: 'Bobina Contattore / Relè Monostabile',
    category: 'Bobine',
    tagPrefix: '-KM',
    terminals: [
      { id: 'A1', x: 0, y: -20, label: 'A1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'mono' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      // Normative IEC Horizontal Rectangle (24 x 14)
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#ffffff', when: 'off' },
      // Active in simulation: filled grey (#9ca3af) exactly as in CADe_SIMU
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#9ca3af', when: 'on' },
      { t: 'line', x1: 0, y1: 7, x2: 0, y2: 20 },
    ],
  },
  {
    id: 'coil_timer_on',
    name: 'Bobina Relè Temporizzatore (Ritardo Eccitazione TON)',
    category: 'Bobine',
    tagPrefix: '-KT',
    terminals: [
      { id: 'A1', x: 0, y: -20, label: 'A1' },
      { id: 'A2', x: 0, y: 20, label: 'A2' },
    ],
    props: [
      { key: 'delay', label: 'Tempo (secondi)', type: 'number', default: 3 },
    ],
    behavior: { type: 'coil', a: 'A1', b: 'A2', mode: 'ton' },
    symbol: [
      { t: 'line', x1: 0, y1: -20, x2: 0, y2: -7 },
      // Normative IEC Horizontal Rectangle (24 x 14)
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#ffffff', when: 'off' },
      { t: 'rect', x: -12, y: -7, w: 24, h: 14, fill: '#9ca3af', when: 'on' },
      // Standard TON cross on left division
      { t: 'line', x1: -4, y1: -7, x2: -4, y2: 7 },
      { t: 'line', x1: -12, y1: -7, x2: -4, y2: 7 },
      { t: 'line', x1: -12, y1: 7, x2: -4, y2: -7 },
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

  // ==================== SEGNALAZIONE & SPIE ====================
  {
    id: 'pilot_lamp',
    name: 'Lampada Spia di Segnalazione (H)',
    category: 'Segnalazione',
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
    category: 'Segnalazione',
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
