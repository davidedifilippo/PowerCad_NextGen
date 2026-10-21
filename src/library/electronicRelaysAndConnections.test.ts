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

  it('Phase loss relay operates SPDT changeover: 11-14 closes when healthy, 11-12 closes on phase loss', () => {
    // healthy 3-phase system
    const docHealthy: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Phase Loss Relay SPDT Test',
        title: 'Phase Loss Relay Test',
        author: 'Tester',
        date: '2026-10-20',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'pwr_3p', def: 'pwr_3p', x: 100, y: 100, rot: 0, tag: 'L1-L2-L3', props: {} },
        { id: 'pwr_n', def: 'pwr_n', x: 200, y: 100, rot: 0, tag: 'N', props: {} },
        { id: 'relay_plr', def: 'phase_loss_relay', x: 100, y: 200, rot: 0, tag: '-F1', props: {} },
        { id: 'lamp_fault', def: 'pilot_lamp', x: 100, y: 330, rot: 0, tag: '-H_FAULT', props: { color: 'Rosso' } },
        { id: 'lamp_ok', def: 'pilot_lamp', x: 140, y: 330, rot: 0, tag: '-H_OK', props: { color: 'Verde' } },
      ],
      wires: [
        // L1 (80, 110) to relay L1 (80, 170)
        { id: 'w1', pts: [{ x: 80, y: 110 }, { x: 80, y: 170 }] },
        // L2 (100, 110) to relay L2 (100, 170)
        { id: 'w2', pts: [{ x: 100, y: 110 }, { x: 100, y: 170 }] },
        // L3 (120, 110) to relay L3 (120, 170)
        { id: 'w3', pts: [{ x: 120, y: 110 }, { x: 120, y: 170 }] },

        // Branch L1 (80, 110) down to common 11 (80, 230)
        { id: 'w_c', pts: [{ x: 80, y: 170 }, { x: 60, y: 170 }, { x: 60, y: 230 }, { x: 80, y: 230 }] },

        // Terminal 12 (NC) at (100, 230) to lamp_fault X1 at (100, 310)
        { id: 'w_nc', pts: [{ x: 100, y: 230 }, { x: 100, y: 310 }] },

        // Terminal 14 (NO) at (120, 230) to lamp_ok X1 at (140, 310)
        { id: 'w_no', pts: [{ x: 120, y: 230 }, { x: 140, y: 230 }, { x: 140, y: 310 }] },

        // Neutral to lamp_fault X2 (100, 350) and lamp_ok X2 (140, 350)
        { id: 'w_n1', pts: [{ x: 200, y: 110 }, { x: 200, y: 370 }, { x: 100, y: 370 }, { x: 100, y: 350 }] },
        { id: 'w_n2', pts: [{ x: 200, y: 370 }, { x: 140, y: 370 }, { x: 140, y: 350 }] },
      ],
    };

    // When 3-phase is healthy:
    const simHealthy = stepSimulation(docHealthy, { ...createInitialSimState(), running: true }, 0.05);
    expect(simHealthy.activeOutputs['relay_plr']).toBe(true);
    // Contact 11-14 (NO) closed -> lamp_ok is ON
    expect(simHealthy.activeOutputs['lamp_ok']).toBe(true);
    // Contact 11-12 (NC) open -> lamp_fault is OFF
    expect(simHealthy.activeOutputs['lamp_fault']).toBeUndefined();

    // Now disconnect Phase L3 (simulate phase loss):
    const docFault: Doc = {
      ...docHealthy,
      wires: docHealthy.wires.filter((w) => w.id !== 'w3'),
    };
    const simFault = stepSimulation(docFault, { ...createInitialSimState(), running: true }, 0.05);
    expect(simFault.activeOutputs['relay_plr']).toBeUndefined();
    // Contact 11-14 (NO) opened -> lamp_ok is OFF
    expect(simFault.activeOutputs['lamp_ok']).toBeUndefined();
    // Contact 11-12 (NC) closed -> lamp_fault is ON (alarm triggered!)
    expect(simFault.activeOutputs['lamp_fault']).toBe(true);
  });

  it('Phase sequence relay detects phase inversion and triggers alarm contact 11-12 NC', () => {
    // 1. Direct sequence: L1 to L1, L2 to L2, L3 to L3
    const docDirect: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Phase Sequence Relay Test',
        title: 'Phase Sequence Test',
        author: 'Tester',
        date: '2026-10-21',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'pwr_3p', def: 'pwr_3p', x: 100, y: 100, rot: 0, tag: 'L1-L2-L3', props: {} },
        { id: 'pwr_n', def: 'pwr_n', x: 200, y: 100, rot: 0, tag: 'N', props: {} },
        { id: 'relay_psr', def: 'phase_sequence_relay', x: 100, y: 200, rot: 0, tag: '-S1', props: {} },
        { id: 'lamp_alarm', def: 'pilot_lamp', x: 100, y: 330, rot: 0, tag: '-H_ALARM', props: { color: 'Rosso' } },
        { id: 'lamp_ok', def: 'pilot_lamp', x: 140, y: 330, rot: 0, tag: '-H_OK', props: { color: 'Verde' } },
      ],
      wires: [
        // Direct wiring: L1 (80, 110) -> relay L1 (80, 170)
        { id: 'w1', pts: [{ x: 80, y: 110 }, { x: 80, y: 170 }] },
        // L2 (100, 110) -> relay L2 (100, 170)
        { id: 'w2', pts: [{ x: 100, y: 110 }, { x: 100, y: 170 }] },
        // L3 (120, 110) -> relay L3 (120, 170)
        { id: 'w3', pts: [{ x: 120, y: 110 }, { x: 120, y: 170 }] },

        // Branch L1 to Common 11 at (80, 230)
        { id: 'w_c', pts: [{ x: 80, y: 170 }, { x: 60, y: 170 }, { x: 60, y: 230 }, { x: 80, y: 230 }] },
        // 12 NC at (100, 230) to lamp_alarm X1 at (100, 310)
        { id: 'w_nc', pts: [{ x: 100, y: 230 }, { x: 100, y: 310 }] },
        // 14 NO at (120, 230) to lamp_ok X1 at (140, 310)
        { id: 'w_no', pts: [{ x: 120, y: 230 }, { x: 140, y: 230 }, { x: 140, y: 310 }] },
        // Neutral connections to lamps
        { id: 'w_n1', pts: [{ x: 200, y: 110 }, { x: 200, y: 370 }, { x: 100, y: 370 }, { x: 100, y: 350 }] },
        { id: 'w_n2', pts: [{ x: 200, y: 370 }, { x: 140, y: 370 }, { x: 140, y: 350 }] },
      ],
    };

    // With direct sequence: Relay is energised, NO 11-14 closed (lamp_ok ON), NC 11-12 open (lamp_alarm OFF)
    const simDirect = stepSimulation(docDirect, { ...createInitialSimState(), running: true }, 0.05);
    expect(simDirect.activeOutputs['relay_psr']).toBe(true);
    expect(simDirect.activeOutputs['lamp_ok']).toBe(true);
    expect(simDirect.activeOutputs['lamp_alarm']).toBeUndefined();

    // 2. Invert two phases: Swap L1 and L2 (L2 to terminal L1, L1 to terminal L2)
    const docInverted: Doc = {
      ...docDirect,
      wires: [
        // L2 (100, 110) routed to relay L1 (80, 170)
        { id: 'w1_inv', pts: [{ x: 100, y: 110 }, { x: 80, y: 130 }, { x: 80, y: 170 }] },
        // L1 (80, 110) routed to relay L2 (100, 170)
        { id: 'w2_inv', pts: [{ x: 80, y: 110 }, { x: 100, y: 130 }, { x: 100, y: 170 }] },
        // L3 (120, 110) -> relay L3 (120, 170)
        { id: 'w3', pts: [{ x: 120, y: 110 }, { x: 120, y: 170 }] },
        // Branch to Common 11
        { id: 'w_c', pts: [{ x: 80, y: 170 }, { x: 60, y: 170 }, { x: 60, y: 230 }, { x: 80, y: 230 }] },
        { id: 'w_nc', pts: [{ x: 100, y: 230 }, { x: 100, y: 310 }] },
        { id: 'w_no', pts: [{ x: 120, y: 230 }, { x: 140, y: 230 }, { x: 140, y: 310 }] },
        { id: 'w_n1', pts: [{ x: 200, y: 110 }, { x: 200, y: 370 }, { x: 100, y: 370 }, { x: 100, y: 350 }] },
        { id: 'w_n2', pts: [{ x: 200, y: 370 }, { x: 140, y: 370 }, { x: 140, y: 350 }] },
      ],
    };

    // Inverted sequence must de-energize the relay: NO 11-14 opens (lamp_ok OFF), NC 11-12 closes (lamp_alarm ON!)
    const simInverted = stepSimulation(docInverted, { ...createInitialSimState(), running: true }, 0.05);
    expect(simInverted.activeOutputs['relay_psr']).toBeUndefined();
    expect(simInverted.activeOutputs['lamp_ok']).toBeUndefined();
    expect(simInverted.activeOutputs['lamp_alarm']).toBe(true);
  });
});
