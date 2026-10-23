import { describe, it, expect } from 'vitest';
import { Doc, Element, Wire } from '../model/types';
import { createInitialSimState, stepSimulation } from './simulation';

describe('Timers and Counters Benchmark Test Suite', () => {
  // Helper to build a minimal DC circuit
  function makeCircuit(elements: any[], wires: Wire[]): Doc {
    const formattedElements: Element[] = elements.map((el) => ({
      id: el.id,
      def: el.def,
      x: el.x,
      y: el.y,
      rot: el.rot ?? 0,
      tag: el.tag ?? '',
      props: el.props || {},
    }));

    return {
      app: 'powercad-nextgen',
      version: 1,
      sheet: {
        format: 'A3',
        orientation: 'landscape',
        project: 'Timer Benchmark',
        title: 'Timer Benchmark',
        author: 'Ing. Di Filippo',
        date: '2026-10-23',
        revision: 'Rev. 1.0',
        sheetNo: '1/1',
      },
      elements: [
        { id: 'pwr_pos', def: 'pwr_dc_plus', x: 40, y: 50, rot: 0, tag: '+', props: {} },
        { id: 'pwr_neg', def: 'pwr_dc_minus', x: 40, y: 350, rot: 0, tag: '-', props: {} },
        ...formattedElements,
      ],
      wires: [
        // Top rail from x=40 to x=600 at y=60
        { id: 'w_top_rail', pts: [{ x: 40, y: 60 }, { x: 600, y: 60 }] },
        // Bottom rail from x=40 to x=600 at y=360
        { id: 'w_bot_rail', pts: [{ x: 40, y: 360 }, { x: 600, y: 360 }] },
        ...wires,
      ],
    };
  }

  it('TON (Timer ON-Delay): delays contact activation upon coil energization', () => {
    // SB1 at (100, 120), KT1 at (100, 300) with delay: 2s
    // KT1 contact at (180, 120), H1 lamp at (180, 300)
    const doc = makeCircuit(
      [
        { id: 'sb1', def: 'btn_no', x: 100, y: 120, rot: 0, tag: 'SB1' },
        { id: 'kt1', def: 'coil_timer_on', x: 100, y: 300, rot: 0, tag: 'KT1', props: { delay: 2 } },
        { id: 'kt1_c', def: 'contact_timer_on_no', x: 180, y: 120, rot: 0, tag: 'KT1' },
        { id: 'h1', def: 'pilot_lamp', x: 180, y: 300, rot: 0, tag: 'H1' },
      ],
      [
        // Column 1: Rail -> SB1 -> KT1 -> Rail
        { id: 'w1', pts: [{ x: 100, y: 60 }, { x: 100, y: 100 }] },
        { id: 'w2', pts: [{ x: 100, y: 140 }, { x: 100, y: 280 }] },
        { id: 'w3', pts: [{ x: 100, y: 320 }, { x: 100, y: 360 }] },
        // Column 2: Rail -> KT1_c -> H1 -> Rail
        { id: 'w4', pts: [{ x: 180, y: 60 }, { x: 180, y: 100 }] },
        { id: 'w5', pts: [{ x: 180, y: 140 }, { x: 180, y: 280 }] },
        { id: 'w6', pts: [{ x: 180, y: 320 }, { x: 180, y: 360 }] },
      ]
    );

    let state = { ...createInitialSimState(), running: true };

    // Initially SB1 released: KT1 and H1 off
    state = stepSimulation(doc, state, 0.1);
    expect(state.activeOutputs['KT1']).toBeFalsy();
    expect(state.activeOutputs['H1']).toBeFalsy();

    // Press and hold SB1 for 1 second (delay is 2s) -> H1 still off
    state.elementStates['sb1'] = true;
    for (let i = 0; i < 10; i++) {
      state = stepSimulation(doc, state, 0.1);
    }
    expect(state.activeOutputs['KT1']).toBeFalsy();
    expect(state.activeOutputs['H1']).toBeFalsy();

    // Continue holding for another 1.2s (total 2.2s > 2s delay) -> H1 must turn ON!
    for (let i = 0; i < 12; i++) {
      state = stepSimulation(doc, state, 0.1);
    }
    expect(state.activeOutputs['KT1']).toBe(true);
    expect(state.activeOutputs['H1']).toBe(true);

    // Release SB1: KT1 and H1 turn off immediately
    state.elementStates['sb1'] = false;
    state = stepSimulation(doc, state, 0.1);
    expect(state.activeOutputs['KT1']).toBeFalsy();
    expect(state.activeOutputs['H1']).toBeFalsy();
  });

  it('TOF (Timer OFF-Delay): activates immediately, delays turn-off upon release', () => {
    // SB2 at (100, 120), KT2 at (100, 300) with delay: 2s
    // KT2 contact at (180, 120), H2 lamp at (180, 300)
    const doc = makeCircuit(
      [
        { id: 'sb2', def: 'btn_no', x: 100, y: 120, rot: 0, tag: 'SB2' },
        { id: 'kt2', def: 'coil_timer_off', x: 100, y: 300, rot: 0, tag: 'KT2', props: { delay: 2 } },
        { id: 'kt2_c', def: 'contact_timer_off_no', x: 180, y: 120, rot: 0, tag: 'KT2' },
        { id: 'h2', def: 'pilot_lamp', x: 180, y: 300, rot: 0, tag: 'H2' },
      ],
      [
        { id: 'w1', pts: [{ x: 100, y: 60 }, { x: 100, y: 100 }] },
        { id: 'w2', pts: [{ x: 100, y: 140 }, { x: 100, y: 280 }] },
        { id: 'w3', pts: [{ x: 100, y: 320 }, { x: 100, y: 360 }] },
        { id: 'w4', pts: [{ x: 180, y: 60 }, { x: 180, y: 100 }] },
        { id: 'w5', pts: [{ x: 180, y: 140 }, { x: 180, y: 280 }] },
        { id: 'w6', pts: [{ x: 180, y: 320 }, { x: 180, y: 360 }] },
      ]
    );

    let state = { ...createInitialSimState(), running: true };

    // Initially off
    state = stepSimulation(doc, state, 0.1);
    expect(state.activeOutputs['H2']).toBeFalsy();

    // Press SB2: activates IMMEDIATELY!
    state.elementStates['sb2'] = true;
    state = stepSimulation(doc, state, 0.1);
    expect(state.activeOutputs['KT2']).toBe(true);
    expect(state.activeOutputs['H2']).toBe(true);

    // Release SB2: H2 should STAY ON during the 2s off-delay
    state.elementStates['sb2'] = false;
    for (let i = 0; i < 15; i++) {
      // 1.5s elapsed
      state = stepSimulation(doc, state, 0.1);
      expect(state.activeOutputs['KT2']).toBe(true);
      expect(state.activeOutputs['H2']).toBe(true);
    }

    // Advance past 2s (another 1s -> total 2.5s)
    for (let i = 0; i < 10; i++) {
      state = stepSimulation(doc, state, 0.1);
    }
    // Now KT2 and H2 must be OFF!
    expect(state.activeOutputs['KT2']).toBeFalsy();
    expect(state.activeOutputs['H2']).toBeFalsy();
  });

  it('TON+TOF (Timer ON-Delay & OFF-Delay): delays both energization and de-energization', () => {
    // SB3 at (100, 120), KT3 at (100, 300) with delay: 2s
    // KT3 contact at (180, 120), H3 lamp at (180, 300)
    const doc = makeCircuit(
      [
        { id: 'sb3', def: 'btn_no', x: 100, y: 120, rot: 0, tag: 'SB3' },
        { id: 'kt3', def: 'coil_timer_on_off', x: 100, y: 300, rot: 0, tag: 'KT3', props: { delay: 2 } },
        { id: 'kt3_c', def: 'contact_timer_onoff_no', x: 180, y: 120, rot: 0, tag: 'KT3' },
        { id: 'h3', def: 'pilot_lamp', x: 180, y: 300, rot: 0, tag: 'H3' },
      ],
      [
        { id: 'w1', pts: [{ x: 100, y: 60 }, { x: 100, y: 100 }] },
        { id: 'w2', pts: [{ x: 100, y: 140 }, { x: 100, y: 280 }] },
        { id: 'w3', pts: [{ x: 100, y: 320 }, { x: 100, y: 360 }] },
        { id: 'w4', pts: [{ x: 180, y: 60 }, { x: 180, y: 100 }] },
        { id: 'w5', pts: [{ x: 180, y: 140 }, { x: 180, y: 280 }] },
        { id: 'w6', pts: [{ x: 180, y: 320 }, { x: 180, y: 360 }] },
      ]
    );

    let state = { ...createInitialSimState(), running: true };

    // Press SB3 for 1s: delay is 2s, H3 must NOT turn on yet
    state.elementStates['sb3'] = true;
    for (let i = 0; i < 10; i++) {
      state = stepSimulation(doc, state, 0.1);
    }
    expect(state.activeOutputs['H3']).toBeFalsy();

    // Continue holding past 2s (another 1.2s -> total 2.2s): H3 turns ON!
    for (let i = 0; i < 12; i++) {
      state = stepSimulation(doc, state, 0.1);
    }
    expect(state.activeOutputs['KT3']).toBe(true);
    expect(state.activeOutputs['H3']).toBe(true);

    // Release SB3: H3 must STAY ON for 2s (off delay)
    state.elementStates['sb3'] = false;
    for (let i = 0; i < 15; i++) {
      // 1.5s elapsed
      state = stepSimulation(doc, state, 0.1);
      expect(state.activeOutputs['KT3']).toBe(true);
      expect(state.activeOutputs['H3']).toBe(true);
    }

    // Advance past 2s (another 1s -> total 2.5s)
    for (let i = 0; i < 10; i++) {
      state = stepSimulation(doc, state, 0.1);
    }
    // Now H3 must be OFF!
    expect(state.activeOutputs['KT3']).toBeFalsy();
    expect(state.activeOutputs['H3']).toBeFalsy();
  });

  it('Flasher / Blink Relay: blinks contact and lamp cyclically', () => {
    // SA1 at (100, 120), KT4 at (100, 300) with delay: 0.5s (period 1s)
    // KT4 contact at (180, 120), H4 lamp at (180, 300)
    const doc = makeCircuit(
      [
        { id: 'sa1', def: 'switch_no', x: 100, y: 120, rot: 0, tag: 'SA1' },
        { id: 'kt4', def: 'coil_relay_flasher', x: 100, y: 300, rot: 0, tag: 'KT4', props: { delay: 0.5 } },
        { id: 'kt4_c', def: 'contact_no', x: 180, y: 120, rot: 0, tag: 'KT4' },
        { id: 'h4', def: 'pilot_lamp', x: 180, y: 300, rot: 0, tag: 'H4' },
      ],
      [
        { id: 'w1', pts: [{ x: 100, y: 60 }, { x: 100, y: 100 }] },
        { id: 'w2', pts: [{ x: 100, y: 140 }, { x: 100, y: 280 }] },
        { id: 'w3', pts: [{ x: 100, y: 320 }, { x: 100, y: 360 }] },
        { id: 'w4', pts: [{ x: 180, y: 60 }, { x: 180, y: 100 }] },
        { id: 'w5', pts: [{ x: 180, y: 140 }, { x: 180, y: 280 }] },
        { id: 'w6', pts: [{ x: 180, y: 320 }, { x: 180, y: 360 }] },
      ]
    );

    let state = { ...createInitialSimState(), running: true };
    state.elementStates['sa1'] = true;

    // At t=0.2s: within first 0.5s -> ON
    state = stepSimulation(doc, state, 0.2);
    expect(state.activeOutputs['H4']).toBe(true);

    // At t=0.6s: between 0.5s and 1.0s -> OFF
    state = stepSimulation(doc, state, 0.4);
    expect(state.activeOutputs['H4']).toBeFalsy();

    // At t=1.2s: cycling back into second period (0..0.5s) -> ON
    state = stepSimulation(doc, state, 0.6);
    expect(state.activeOutputs['H4']).toBe(true);
  });

  it('Pulse Generator (KT5): produces periodic pulses on contact and lamp', () => {
    // SA2 at (100, 120), KT5 at (100, 300) with delay: 0.5s
    // KT5 contact at (180, 120), H5 lamp at (180, 300)
    const doc = makeCircuit(
      [
        { id: 'sa2', def: 'switch_no', x: 100, y: 120, rot: 0, tag: 'SA2' },
        { id: 'kt5', def: 'coil_pulse_generator', x: 100, y: 300, rot: 0, tag: 'KT5', props: { delay: 0.5 } },
        { id: 'kt5_c', def: 'contact_no', x: 180, y: 120, rot: 0, tag: 'KT5' },
        { id: 'h5', def: 'pilot_lamp', x: 180, y: 300, rot: 0, tag: 'H5' },
      ],
      [
        { id: 'w1', pts: [{ x: 100, y: 60 }, { x: 100, y: 100 }] },
        { id: 'w2', pts: [{ x: 100, y: 140 }, { x: 100, y: 280 }] },
        { id: 'w3', pts: [{ x: 100, y: 320 }, { x: 100, y: 360 }] },
        { id: 'w4', pts: [{ x: 180, y: 60 }, { x: 180, y: 100 }] },
        { id: 'w5', pts: [{ x: 180, y: 140 }, { x: 180, y: 280 }] },
        { id: 'w6', pts: [{ x: 180, y: 320 }, { x: 180, y: 360 }] },
      ]
    );

    let state = { ...createInitialSimState(), running: true };
    state.elementStates['sa2'] = true;

    // At t=0.2s: within first 0.5s pulse -> ON
    state = stepSimulation(doc, state, 0.2);
    expect(state.activeOutputs['H5']).toBe(true);

    // At t=0.6s: between 0.5s and 1.0s -> OFF
    state = stepSimulation(doc, state, 0.4);
    expect(state.activeOutputs['H5']).toBeFalsy();

    // At t=1.2s: next pulse cycle -> ON
    state = stepSimulation(doc, state, 0.6);
    expect(state.activeOutputs['H5']).toBe(true);
  });

  it('Counter Impulse (D1): counts pulses up, down, resets, and activates output on preset', () => {
    // D1 counter at (250, 300) with preset: 3
    // A1 at (220, 280), C at (240, 280), D at (260, 280), R at (280, 280), A2 at (250, 320)
    // SB4 (Count) at (240, 120), SA3 (Down) at (260, 160), SB5 (Reset) at (280, 200)
    // Contact D1 at (350, 120), H6 at (350, 300)
    const doc = makeCircuit(
      [
        { id: 'd1', def: 'counter_impulse', x: 250, y: 300, rot: 0, tag: 'D1', props: { preset: 3 } },
        { id: 'sb4', def: 'btn_no', x: 240, y: 120, rot: 0, tag: 'SB4' },
        { id: 'sa3', def: 'switch_no', x: 260, y: 160, rot: 0, tag: 'SA3' },
        { id: 'sb5', def: 'btn_no', x: 280, y: 200, rot: 0, tag: 'SB5' },
        { id: 'd1_c', def: 'contact_no', x: 350, y: 120, rot: 0, tag: 'D1' },
        { id: 'h6', def: 'pilot_lamp', x: 350, y: 300, rot: 0, tag: 'H6' },
      ],
      [
        // Power to A1: from rail (220, 60) down to A1 (220, 280)
        { id: 'w_a1', pts: [{ x: 220, y: 60 }, { x: 220, y: 280 }] },
        // Power to A2: from A2 (250, 320) down to bot rail (250, 360)
        { id: 'w_a2', pts: [{ x: 250, y: 320 }, { x: 250, y: 360 }] },

        // SB4 (Count): rail (240, 60) -> 13 (240, 100), 14 (240, 140) -> C (240, 280)
        { id: 'w_c1', pts: [{ x: 240, y: 60 }, { x: 240, y: 100 }] },
        { id: 'w_c2', pts: [{ x: 240, y: 140 }, { x: 240, y: 280 }] },

        // SA3 (Down): rail (260, 60) -> 13 (260, 140), 14 (260, 180) -> D (260, 280)
        { id: 'w_d1', pts: [{ x: 260, y: 60 }, { x: 260, y: 140 }] },
        { id: 'w_d2', pts: [{ x: 260, y: 180 }, { x: 260, y: 280 }] },

        // SB5 (Reset): rail (280, 60) -> 13 (280, 180), 14 (280, 220) -> R (280, 280)
        { id: 'w_r1', pts: [{ x: 280, y: 60 }, { x: 280, y: 180 }] },
        { id: 'w_r2', pts: [{ x: 280, y: 220 }, { x: 280, y: 280 }] },

        // Output column: rail -> D1_c -> H6 -> bot rail
        { id: 'w_out1', pts: [{ x: 350, y: 60 }, { x: 350, y: 100 }] },
        { id: 'w_out2', pts: [{ x: 350, y: 140 }, { x: 350, y: 280 }] },
        { id: 'w_out3', pts: [{ x: 350, y: 320 }, { x: 350, y: 360 }] },
      ]
    );

    let state = { ...createInitialSimState(), running: true };

    // Step 0: initially count is 0, H6 is OFF
    state = stepSimulation(doc, state, 0.1);
    expect(state.activeOutputs['H6']).toBeFalsy();
    expect(state.elementStates['d1_cnt']).toBe(0);

    // Pulse 1: press and release SB4
    state.elementStates['sb4'] = true;
    state = stepSimulation(doc, state, 0.1);
    expect(state.elementStates['d1_cnt']).toBe(1);
    expect(state.activeOutputs['H6']).toBeFalsy();
    state.elementStates['sb4'] = false;
    state = stepSimulation(doc, state, 0.1);

    // Pulse 2:
    state.elementStates['sb4'] = true;
    state = stepSimulation(doc, state, 0.1);
    expect(state.elementStates['d1_cnt']).toBe(2);
    expect(state.activeOutputs['H6']).toBeFalsy();
    state.elementStates['sb4'] = false;
    state = stepSimulation(doc, state, 0.1);

    // Pulse 3: target preset 3 reached!
    state.elementStates['sb4'] = true;
    state = stepSimulation(doc, state, 0.1);
    expect(state.elementStates['d1_cnt']).toBe(3);
    expect(state.activeOutputs['D1']).toBe(true);
    expect(state.activeOutputs['H6']).toBe(true); // Lamp H6 lights up!
    state.elementStates['sb4'] = false;
    state = stepSimulation(doc, state, 0.1);
    expect(state.activeOutputs['H6']).toBe(true); // Stays on

    // Count Down: turn on SA3 (Down direction) and pulse SB4
    state.elementStates['sa3'] = true;
    state.elementStates['sb4'] = true;
    state = stepSimulation(doc, state, 0.1);
    expect(state.elementStates['d1_cnt']).toBe(2); // Count decremented to 2!
    expect(state.activeOutputs['H6']).toBeFalsy(); // Count < preset 3, H6 turns OFF!
    state.elementStates['sb4'] = false;
    state.elementStates['sa3'] = false;
    state = stepSimulation(doc, state, 0.1);

    // Reset: press SB5 (Reset)
    state.elementStates['sb5'] = true;
    state = stepSimulation(doc, state, 0.1);
    expect(state.elementStates['d1_cnt']).toBe(0); // Reset to 0!
    expect(state.activeOutputs['H6']).toBeFalsy();
  });
});
