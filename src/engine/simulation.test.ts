import { describe, it, expect } from 'vitest';
import { SAMPLE_DIRECT_START } from '../samples/directStart';
import { Doc } from '../model/types';
import { createInitialSimState, stepSimulation } from './simulation';

describe('Simulation Engine', () => {
  it('correctly lights up the red STOP lamp (H2) on simulation start', () => {
    const initial = { ...createInitialSimState(), running: true };
    const step1 = stepSimulation(SAMPLE_DIRECT_START, initial, 0.05);

    // H2 lamp (Arresto) should be active immediately because KM1 is de-energized and NC contact is closed
    expect(step1.activeOutputs['h2_lamp']).toBe(true);
    // H1 lamp (Marcia) should be inactive
    expect(step1.activeOutputs['h1_lamp']).toBeFalsy();
    // KM1 coil inactive
    expect(step1.activeOutputs['-KM1']).toBeFalsy();
  });

  it('motor M1 does NOT run when QM1 is open, and runs when QM1 is closed and START is pressed', () => {
    // Case 1: QM1 is open (default). Press START -> KM1 coil energizes, H1 lights up, BUT motor M1 stays stopped!
    const initialWithoutQM1 = {
      ...createInitialSimState(),
      running: true,
      elementStates: { sb2_start: true },
    };
    const stepNoQM1 = stepSimulation(SAMPLE_DIRECT_START, initialWithoutQM1, 0.05);

    expect(stepNoQM1.activeOutputs['-KM1']).toBe(true);
    expect(stepNoQM1.activeOutputs['h1_lamp']).toBe(true);
    // Motor M1 MUST NOT run because QM1 is open!
    expect(stepNoQM1.activeOutputs['m1']).toBeFalsy();

    // Case 2: QM1 is closed by the user AND START is pressed -> Motor M1 starts running!
    const initialWithQM1 = {
      ...createInitialSimState(),
      running: true,
      elementStates: { qm1: true, sb2_start: true },
    };
    const step1 = stepSimulation(SAMPLE_DIRECT_START, initialWithQM1, 0.05);

    // KM1 coil energizes
    expect(step1.activeOutputs['-KM1']).toBe(true);
    // H1 lamp (Marcia) lights up!
    expect(step1.activeOutputs['h1_lamp']).toBe(true);
    // H2 lamp (Arresto) turns off!
    expect(step1.activeOutputs['h2_lamp']).toBeFalsy();
    // 3-Phase Motor M1 starts running now that QM1 is closed!
    expect(step1.activeOutputs['m1']).toBe(true);

    // Now RELEASE the start button (autoritenuta / self-holding latch test)
    const step2 = stepSimulation(SAMPLE_DIRECT_START, { ...step1, elementStates: { qm1: true, sb2_start: false } }, 0.05);
    expect(step2.activeOutputs['-KM1']).toBe(true);
    expect(step2.activeOutputs['m1']).toBe(true);

    // Case 3: If QM1 is opened while motor is running, power is cut and motor M1 stops immediately!
    const stepQM1Open = stepSimulation(SAMPLE_DIRECT_START, { ...step2, elementStates: { qm1: false, sb2_start: false } }, 0.05);
    expect(stepQM1Open.activeOutputs['m1']).toBeFalsy();
  });

  it('correctly lights up a pilot lamp directly wired to L and N sources', () => {
    const customDoc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        { id: 'pwr_l1', def: 'pwr_l', x: 100, y: 100, rot: 0 as const, tag: 'L', props: {} },
        { id: 'pwr_n1', def: 'pwr_n', x: 200, y: 100, rot: 0 as const, tag: 'N', props: {} },
        { id: 'lamp1', def: 'pilot_lamp', x: 150, y: 200, rot: 0 as const, tag: '-H1', props: {} },
      ],
      wires: [
        // Wire from L (100, 110) to lamp X1 (150, 180)
        { id: 'w_l', pts: [{ x: 100, y: 110 }, { x: 100, y: 180 }, { x: 150, y: 180 }] },
        // Wire from N (200, 110) to lamp X2 (150, 220)
        { id: 'w_n', pts: [{ x: 200, y: 110 }, { x: 200, y: 220 }, { x: 150, y: 220 }] },
      ],
    };

    const sim = stepSimulation(customDoc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim.activeOutputs['lamp1']).toBe(true);
  });

  it('correctly simulates flashing lamp and siren when energized', () => {
    const flashDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        { id: 'pwr_l1', def: 'pwr_l', x: 100, y: 100, rot: 0 as const, tag: 'L', props: {} },
        { id: 'pwr_n1', def: 'pwr_n', x: 200, y: 100, rot: 0 as const, tag: 'N', props: {} },
        { id: 'lamp_flash', def: 'pilot_lamp_flashing', x: 100, y: 200, rot: 0 as const, tag: '-H1', props: { period: 1 } },
        { id: 'siren1', def: 'signal_siren', x: 200, y: 200, rot: 0 as const, tag: '-H2', props: {} },
      ],
      wires: [
        // L bus
        { id: 'w_l', pts: [{ x: 100, y: 110 }, { x: 100, y: 180 }] },
        { id: 'w_l_siren', pts: [{ x: 100, y: 180 }, { x: 200, y: 180 }] },
        // N bus routed to avoid passing through X1 terminal at (200, 180)
        { id: 'w_n', pts: [{ x: 200, y: 110 }, { x: 240, y: 110 }, { x: 240, y: 220 }, { x: 200, y: 220 }] },
        { id: 'w_n_lamp', pts: [{ x: 100, y: 220 }, { x: 200, y: 220 }] },
      ],
    };

    // First step (t=0.5s): lamp is ON during the first half of period
    const sim1 = stepSimulation(flashDoc, { ...createInitialSimState(), running: true }, 0.5);
    expect(sim1.activeOutputs['lamp_flash']).toBe(true);
    expect(sim1.activeOutputs['siren1']).toBe(true);

    // Second step (t=1.5s): lamp is OFF during the second half of period
    const sim2 = stepSimulation(flashDoc, sim1, 1.0);
    expect(sim2.activeOutputs['lamp_flash']).toBeFalsy();
    expect(sim2.activeOutputs['siren1']).toBe(true);
  });

  it('correctly simulates AC/DC power supply (psu_1p_dc) fed by L+N source (pwr_l_n)', () => {
    const psuDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // pwr_l_n at (100, 100): L at (90, 110), N at (110, 110)
        { id: 'src_ln', def: 'pwr_l_n', x: 100, y: 100, rot: 0 as const, tag: '-X4', props: {} },
        // psu_1p_dc at (100, 160): 1 at (90, 140), 2 at (110, 140), 3 (+) at (90, 180), 4 (-) at (110, 180)
        { id: 'psu1', def: 'psu_1p_dc', x: 100, y: 160, rot: 0 as const, tag: '-T4', props: {} },
        // pilot_lamp at (100, 240): X1 at (100, 220), X2 at (100, 260)
        { id: 'lamp_dc', def: 'pilot_lamp', x: 100, y: 240, rot: 0 as const, tag: '-H1', props: {} },
      ],
      wires: [
        // Connect L+N to PSU inputs 1 and 2
        { id: 'w1', pts: [{ x: 90, y: 110 }, { x: 90, y: 140 }] },
        { id: 'w2', pts: [{ x: 110, y: 110 }, { x: 110, y: 140 }] },
        // Connect PSU DC outputs 3 (+) and 4 (-) to lamp X1 and X2
        { id: 'w3', pts: [{ x: 90, y: 180 }, { x: 90, y: 220 }, { x: 100, y: 220 }] },
        { id: 'w4', pts: [{ x: 110, y: 180 }, { x: 140, y: 180 }, { x: 140, y: 260 }, { x: 100, y: 260 }] },
      ],
    };

    const sim = stepSimulation(psuDoc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim.activeOutputs['psu1']).toBe(true);
    expect(sim.activeOutputs['lamp_dc']).toBe(true);
  });
});

