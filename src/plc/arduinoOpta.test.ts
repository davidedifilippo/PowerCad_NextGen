import { describe, it, expect } from 'vitest';
import { Doc } from '../model/types';
import { STANDARD_LIBRARY } from '../library/standard';
import { createInitialSimState, stepSimulation } from '../engine/simulation';

describe('Arduino Opta Micro-PLC Component & Simulation', () => {
  it('registers plc_arduino_opta in library with category PLC and 20 terminals on 10px grid', () => {
    const opta = STANDARD_LIBRARY.find((c) => c.id === 'plc_arduino_opta');
    expect(opta).toBeDefined();
    expect(opta?.category).toBe('PLC');
    expect(opta?.terminals.length).toBe(20);

    for (const t of opta!.terminals) {
      expect(Math.abs(t.x % 10)).toBe(0);
      expect(Math.abs(t.y % 10)).toBe(0);
    }
  });

  it('runs Arduino Opta: executes direct start/stop ST logic and drives isolated relay Q1', () => {
    // Schema:
    // +24V at (100, 100), 0V at (40, 100)
    // Arduino Opta at (250, 300)
    // Start button -SB1 at (180, 160) fed by +24V, driving I1
    // Stop button -SB2 at (220, 160) fed by +24V, driving I2
    // Lamp -H1 connected through Q1 contacts (11-14)
    const doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Opta PLC Test',
        title: 'Arduino Opta Test',
        author: 'Tester',
        date: '2026-10-21',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'pwr_pos', def: 'pwr_dc_plus', x: 100, y: 100, rot: 0, tag: '+24V', props: {} },
        { id: 'pwr_neg', def: 'pwr_dc_minus', x: 40, y: 100, rot: 0, tag: '0V', props: {} },

        // Arduino Opta at (250, 300):
        // VIN1: (150, 270), GND1: (150, 290)
        // I1: (180, 230), I2: (200, 230)
        // Relè Q1: term 11 at (180, 370), term 14 at (200, 370)
        {
          id: 'opta1',
          def: 'plc_arduino_opta',
          x: 250,
          y: 300,
          rot: 0,
          tag: '-PLC1',
          props: {
            stCode: 'Q1 := (I1 OR Q1) AND NOT I2;',
          },
        },

        // Button START -SB1 at (180, 160): term 13 at (180, 140), term 14 at (180, 180)
        { id: 'btn_start', def: 'btn_no', x: 180, y: 160, rot: 0, tag: '-SB1', props: {} },
        // Button STOP -SB2 at (220, 160): term 13 at (220, 140), term 14 at (220, 180)
        { id: 'btn_stop', def: 'btn_no', x: 220, y: 160, rot: 0, tag: '-SB2', props: {} },

        // Pilot lamp at (190, 440): term X1 at (190, 420), term X2 at (190, 460)
        { id: 'lamp1', def: 'pilot_lamp', x: 190, y: 440, rot: 0, tag: '-H1', props: {} },
      ],
      wires: [
        // Power +24V (100, 110) to Opta VIN1 (150, 270)
        { id: 'w_pwr_pos', pts: [{ x: 100, y: 110 }, { x: 150, y: 110 }, { x: 150, y: 270 }] },
        // Power 0V (40, 110) to Opta GND1 (150, 290)
        { id: 'w_pwr_neg', pts: [{ x: 40, y: 110 }, { x: 40, y: 290 }, { x: 150, y: 290 }] },

        // Branch +24V (150, 110) to Button START 13 (180, 140) and Button STOP 13 (220, 140)
        { id: 'w_b1', pts: [{ x: 150, y: 110 }, { x: 180, y: 110 }, { x: 180, y: 140 }] },
        { id: 'w_b2', pts: [{ x: 180, y: 110 }, { x: 220, y: 110 }, { x: 220, y: 140 }] },

        // Button START 14 (180, 180) to Opta I1 (180, 230)
        { id: 'w_i1', pts: [{ x: 180, y: 180 }, { x: 180, y: 230 }] },
        // Button STOP 14 (220, 180) to Opta I2 (200, 230)
        { id: 'w_i2', pts: [{ x: 220, y: 180 }, { x: 200, y: 180 }, { x: 200, y: 230 }] },

        // Feed +24V to Relay 11 (180, 370) routing away from GND terminal at x:150
        { id: 'w_q11', pts: [{ x: 150, y: 270 }, { x: 120, y: 270 }, { x: 120, y: 370 }, { x: 180, y: 370 }] },
        // Relay 14 (200, 370) to Lamp X1 (190, 420)
        { id: 'w_q14', pts: [{ x: 200, y: 370 }, { x: 200, y: 400 }, { x: 190, y: 400 }, { x: 190, y: 420 }] },
        // 0V to Lamp X2 (190, 460)
        { id: 'w_lamp_gnd', pts: [{ x: 40, y: 290 }, { x: 40, y: 460 }, { x: 190, y: 460 }] },
      ],
    };

    // 1. Initial State: Opta is powered, but START not pressed -> Lamp OFF
    let state = stepSimulation(doc, { ...createInitialSimState(), running: true }, 0.05);
    expect(state.fault).toBeNull();
    expect(state.activeOutputs['opta1']).toBe(true);
    expect(state.activeOutputs['opta1_pwr']).toBe(true);
    expect(state.activeOutputs['lamp1']).toBeUndefined();

    // 2. Press START button (-SB1)
    state = stepSimulation(doc, {
      ...state,
      elementStates: { btn_start: true },
    }, 0.05);

    // Input I1 is detected, Opta executes ST code -> Q1 closes -> Lamp turns ON!
    expect(state.activeOutputs['opta1_i1']).toBe(true);
    expect(state.activeOutputs['opta1_q1']).toBe(true);
    expect(state.activeOutputs['lamp1']).toBe(true);

    // 3. Release START button (-SB1) -> Q1 stays latched (autoritenuta), Lamp stays ON!
    state = stepSimulation(doc, {
      ...state,
      elementStates: { btn_start: false },
    }, 0.05);
    expect(state.activeOutputs['opta1_q1']).toBe(true);
    expect(state.activeOutputs['lamp1']).toBe(true);

    // 4. Press STOP button (-SB2) -> Q1 opens, Lamp turns OFF!
    state = stepSimulation(doc, {
      ...state,
      elementStates: { btn_stop: true },
    }, 0.05);
    expect(state.activeOutputs['opta1_i2']).toBe(true);
    expect(state.activeOutputs['opta1_q1']).toBeUndefined();
    expect(state.activeOutputs['lamp1']).toBeUndefined();
  });
});
