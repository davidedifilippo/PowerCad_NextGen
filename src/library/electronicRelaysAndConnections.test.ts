import { describe, it, expect } from 'vitest';
import { STANDARD_LIBRARY } from './standard';
import { Doc } from '../model/types';
import { createInitialSimState, stepSimulation } from '../engine/simulation';
import { WIRE_COLOR_MAP } from '../ui/WireToolbar';
import { WIRE_TYPE_OPTIONS } from '../ui/PropertiesPanel';

describe('Electronic Relays and Connections Library Sections', () => {
  it('contains all 12 electronic relays with correct categories and terminal alignments', () => {
    const expectedRelays = [
      'ssr_1p_dc',
      'ssr_1p_ac',
      'ssr_3p_ac',
      'ssr_3p_ac_reversing',
      'phase_loss_relay_n',
      'phase_loss_relay',
      'phase_sequence_relay_n',
      'phase_sequence_relay',
      'voltage_monitoring_relay_1p',
      'voltage_monitoring_relay_3p',
      'relay_spst_no',
      'relay_spdt_changeover',
    ];

    for (const id of expectedRelays) {
      const def = STANDARD_LIBRARY.find((c) => c.id === id);
      expect(def, `Component ${id} must exist in standard library`).toBeDefined();
      expect(def?.category).toBe('Relè Elettronici');
      expect(def?.terminals.length).toBeGreaterThan(0);

      // Verify strict 10px grid alignment
      for (const t of def!.terminals) {
        expect(Math.abs(t.x % 10), `Terminal ${t.id} of ${id} x=${t.x} must be multiple of 10`).toBe(0);
        expect(Math.abs(t.y % 10), `Terminal ${t.id} of ${id} y=${t.y} must be multiple of 10`).toBe(0);
      }
    }
  });

  it('contains all 11 cables and connections components with correct category', () => {
    const expectedConnections = [
      'terminal_single',
      'terminal_1p',
      'terminal_2p',
      'terminal_3p',
      'terminal_4p',
      'terminal_pe',
      'ref_marker_output',
      'ref_marker_input',
      'tube_inlet_1',
      'tube_inlet_2',
      'junction_node',
    ];

    for (const id of expectedConnections) {
      const def = STANDARD_LIBRARY.find((c) => c.id === id);
      expect(def, `Component ${id} must exist in standard library`).toBeDefined();
      expect(def?.category).toBe('Cavi e Connessioni');
      for (const t of def!.terminals) {
        expect(Math.abs(t.x % 10)).toBe(0);
        expect(Math.abs(t.y % 10)).toBe(0);
      }
    }
  });

  it('wire maps and toolbar contain custom color, pneumatic tube and staggered 3-phase options', () => {
    expect(WIRE_COLOR_MAP['color_custom']).toBe('#a855f7');
    expect(WIRE_COLOR_MAP['pneumatic_tube']).toBe('#0284c7');
    expect(WIRE_COLOR_MAP['3p_vert_staggered']).toBe('#9a3412');
    expect(WIRE_COLOR_MAP['3p_horiz_staggered']).toBe('#9a3412');

    const optCustom = WIRE_TYPE_OPTIONS.find((o) => o.kind === 'color_custom');
    expect(optCustom).toBeDefined();

    const optTube = WIRE_TYPE_OPTIONS.find((o) => o.kind === 'pneumatic_tube');
    expect(optTube).toBeDefined();
  });

  it('SSR 1P DC activates its internal power contact when control +A1/-A2 is energized', () => {
    const doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'SSR Test',
        title: 'SSR 1P Test',
        author: 'Tester',
        date: '2026-10-20',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'pwr_pos', def: 'pwr_dc_plus', x: 100, y: 100, rot: 0, tag: '+24V', props: {} },
        { id: 'pwr_neg', def: 'pwr_dc_minus', x: 200, y: 100, rot: 0, tag: '0V', props: {} },
        { id: 'ssr1', def: 'ssr_1p_dc', x: 150, y: 200, rot: 0, tag: '-K1', props: {} },
        { id: 'lamp1', def: 'pilot_lamp', x: 150, y: 300, rot: 0, tag: '-H1', props: {} },
      ],
      wires: [
        // Wire +24V to +A1 (terminals at ssr1 x: 140, y: 170)
        { id: 'w1', pts: [{ x: 100, y: 110 }, { x: 140, y: 110 }, { x: 140, y: 170 }] },
        // Wire 0V to -A2 (terminals at ssr1 x: 160, y: 170)
        { id: 'w2', pts: [{ x: 200, y: 110 }, { x: 160, y: 110 }, { x: 160, y: 170 }] },
        // Power circuit: +24V to +1 of SSR (x: 140, y: 230)
        { id: 'w3', pts: [{ x: 100, y: 110 }, { x: 100, y: 230 }, { x: 140, y: 230 }] },
        // SSR output -2 (x: 160, y: 230) to Lamp terminal X1 (x: 150, y: 280)
        { id: 'w4', pts: [{ x: 160, y: 230 }, { x: 160, y: 280 }, { x: 150, y: 280 }] },
        // Lamp terminal X2 (x: 150, y: 320) to 0V
        { id: 'w5', pts: [{ x: 150, y: 320 }, { x: 200, y: 320 }, { x: 200, y: 110 }] },
      ],
    };

    const sim1 = stepSimulation(doc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim1.activeOutputs['ssr1']).toBe(true);
    expect(sim1.activeOutputs['-K1']).toBe(true);
    expect(sim1.activeOutputs['lamp1']).toBe(true);
  });

  it('Compact SPST-NO relay closes internal 13-14 contact and powers load when A1-A2 is fed AC voltage', () => {
    const doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Relay SPST Test',
        title: 'Relay Test',
        author: 'Tester',
        date: '2026-10-20',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'pwr_l', def: 'pwr_l', x: 100, y: 100, rot: 0, tag: 'L1', props: {} },
        { id: 'pwr_n', def: 'pwr_n', x: 200, y: 100, rot: 0, tag: 'N', props: {} },
        { id: 'relay1', def: 'relay_spst_no', x: 150, y: 200, rot: 0, tag: '-K1', props: {} },
        { id: 'lamp1', def: 'pilot_lamp', x: 150, y: 300, rot: 0, tag: '-H1', props: {} },
      ],
      wires: [
        // L1 to A1 (relay1 x: 140, y: 170)
        { id: 'w1', pts: [{ x: 100, y: 110 }, { x: 140, y: 110 }, { x: 140, y: 170 }] },
        // N to A2 (relay1 x: 140, y: 230) routed down to avoid crossing 14 at (160, 230)
        { id: 'w2', pts: [{ x: 200, y: 110 }, { x: 200, y: 250 }, { x: 140, y: 250 }, { x: 140, y: 230 }] },
        // L1 to 13 (relay1 x: 160, y: 170)
        { id: 'w3', pts: [{ x: 100, y: 110 }, { x: 100, y: 170 }, { x: 160, y: 170 }] },
        // 14 (relay1 x: 160, y: 230) to Lamp X1 (150, 280)
        { id: 'w4', pts: [{ x: 160, y: 230 }, { x: 160, y: 280 }, { x: 150, y: 280 }] },
        // Lamp X2 (150, 320) to N (200, 110)
        { id: 'w5', pts: [{ x: 150, y: 320 }, { x: 200, y: 320 }, { x: 200, y: 110 }] },
      ],
    };

    const sim1 = stepSimulation(doc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim1.activeOutputs['relay1']).toBe(true);
    expect(sim1.activeOutputs['-K1']).toBe(true);
    expect(sim1.activeOutputs['lamp1']).toBe(true);
  });

  it('Terminal block conducts current through its paired poles', () => {
    const doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Terminal Test',
        title: 'Terminal Conduction',
        author: 'Tester',
        date: '2026-10-20',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'pwr_l', def: 'pwr_l', x: 100, y: 100, rot: 0, tag: 'L1', props: {} },
        { id: 'pwr_n', def: 'pwr_n', x: 200, y: 100, rot: 0, tag: 'N', props: {} },
        // terminal_2p at (150, 180): pole 1 at (140, 160)-(140, 200), pole 2 at (160, 160)-(160, 200)
        { id: 'tb1', def: 'terminal_2p', x: 150, y: 180, rot: 0, tag: '-X1', props: {} },
        { id: 'lamp1', def: 'pilot_lamp', x: 150, y: 280, rot: 0, tag: '-H1', props: {} },
      ],
      wires: [
        // L1 to terminal 1 (140, 160)
        { id: 'w1', pts: [{ x: 100, y: 110 }, { x: 140, y: 110 }, { x: 140, y: 160 }] },
        // N to terminal 3 (160, 160)
        { id: 'w2', pts: [{ x: 200, y: 110 }, { x: 160, y: 110 }, { x: 160, y: 160 }] },
        // terminal 2 (140, 200) to lamp X1 (150, 260)
        { id: 'w3', pts: [{ x: 140, y: 200 }, { x: 140, y: 260 }, { x: 150, y: 260 }] },
        // terminal 4 (160, 200) to lamp X2 (150, 300)
        { id: 'w4', pts: [{ x: 160, y: 200 }, { x: 160, y: 300 }, { x: 150, y: 300 }] },
      ],
    };

    const sim1 = stepSimulation(doc, { ...createInitialSimState(), running: true }, 0.05);
    // Lamp should be powered through the terminal block poles 1-2 and 3-4
    expect(sim1.activeOutputs['lamp1']).toBe(true);
  });
});
