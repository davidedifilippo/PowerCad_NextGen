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

  it('correctly detects earth leakage / ground fault and trips differential circuit breaker (RCD)', () => {
    const rcdDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Source L+N+PE at (100, 100): L at (80, 110), N at (100, 110), PE at (120, 110)
        { id: 'src', def: 'pwr_l_n_pe', x: 100, y: 100, rot: 0 as const, tag: '-X1', props: {} },
        // Interruttore Differenziale 1P+N at (90, 160): 1 at (80, 130), 3 at (100, 130), 2 at (80, 190), 4 at (100, 190)
        { id: 'rcd1', def: 'rcd_differential_1p_n', x: 90, y: 160, rot: 0 as const, tag: '-F1', props: {} },
        // Pilot Lamp at (90, 250): X1 at (90, 230), X2 at (90, 270)
        { id: 'lamp1', def: 'pilot_lamp', x: 90, y: 250, rot: 0 as const, tag: '-H1', props: {} },
        // Pushbutton NO at (40, 210) simulating ground fault when pressed: 13 at (40, 190), 14 at (40, 230)
        { id: 'btn_fault', def: 'btn_no', x: 40, y: 210, rot: 0 as const, tag: '-S1', props: {} },
      ],
      wires: [
        // Power from Source to RCD inputs (1 and 3)
        { id: 'w_l_in', pts: [{ x: 80, y: 110 }, { x: 80, y: 130 }] },
        { id: 'w_n_in', pts: [{ x: 100, y: 110 }, { x: 100, y: 130 }] },
        // RCD outputs to Lamp load
        { id: 'w_l_out', pts: [{ x: 80, y: 190 }, { x: 90, y: 190 }, { x: 90, y: 230 }] },
        { id: 'w_n_out', pts: [{ x: 100, y: 190 }, { x: 100, y: 270 }, { x: 90, y: 270 }] },
        // Fault branch: wire from terminal 2 of RCD (80, 190) to terminal 13 of button (40, 190)
        { id: 'w_fault_tap', pts: [{ x: 80, y: 190 }, { x: 40, y: 190 }] },
        // Fault branch: wire from terminal 14 of button (40, 230) to PE source terminal (120, 110)
        { id: 'w_fault_pe', pts: [{ x: 40, y: 230 }, { x: 40, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 110 }], kind: 'pe' },
      ],
    };

    // 1. Initial normal state: RCD is closed, fault button is not pressed
    const normalState = {
      ...createInitialSimState(),
      running: true,
      elementStates: { rcd1: true, btn_fault: false },
    };
    const step1 = stepSimulation(rcdDoc, normalState, 0.05);

    // RCD should remain closed, no fault alert, and lamp must be ON
    expect(step1.elementStates['rcd1']).toBe(true);
    expect(step1.faultAlert).toBeNull();
    expect(step1.fault).toBeNull();
    expect(step1.activeOutputs['lamp1']).toBe(true);

    // 2. Fault occurrence: User presses button -S1 connecting Phase (downstream of RCD) to PE
    const faultState = {
      ...step1,
      elementStates: { ...step1.elementStates, btn_fault: true },
    };
    const stepFault = stepSimulation(rcdDoc, faultState, 0.05);

    // The differential breaker MUST trip automatically (contacts pop open)!
    expect(stepFault.elementStates['rcd1']).toBe(false);
    expect(stepFault.faultAlert).not.toBeNull();
    expect(stepFault.faultAlert?.type).toBe('rcd_tripped');
    expect(stepFault.faultAlert?.message).toContain('Interruttore differenziale');
    expect(stepFault.faultAlert?.message).toContain('scattato per dispersione verso terra');

    // Downstream circuit must be de-energized immediately (lamp turns OFF)
    expect(stepFault.activeOutputs['lamp1']).toBeFalsy();

    // 3. User releases the button and re-closes the RCD: normal operation resumes
    const recloseState = {
      ...stepFault,
      elementStates: { rcd1: true, btn_fault: false },
    };
    const stepRecover = stepSimulation(rcdDoc, recloseState, 0.05);
    expect(stepRecover.elementStates['rcd1']).toBe(true);
    expect(stepRecover.activeOutputs['lamp1']).toBe(true);
  });

  it('halts simulation when an unprotected earth fault occurs with no differential breaker', () => {
    const unprotectedDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        { id: 'src', def: 'pwr_l_n_pe', x: 100, y: 100, rot: 0 as const, tag: '-X1', props: {} },
        { id: 'btn_fault', def: 'btn_no', x: 100, y: 160, rot: 0 as const, tag: '-S1', props: {} },
      ],
      wires: [
        // Direct wire from Phase L (80, 110) to Button terminal 13 (100, 140)
        { id: 'w1', pts: [{ x: 80, y: 110 }, { x: 100, y: 110 }, { x: 100, y: 140 }] },
        // Direct wire from Button terminal 14 (100, 180) to PE (120, 110)
        { id: 'w2', pts: [{ x: 100, y: 180 }, { x: 120, y: 180 }, { x: 120, y: 110 }], kind: 'pe' },
      ],
    };

    const initial = {
      ...createInitialSimState(),
      running: true,
      elementStates: { btn_fault: true },
    };
    const step = stepSimulation(unprotectedDoc, initial, 0.05);

    // Simulation should be halted due to unprotected earth leakage
    expect(step.running).toBe(false);
    expect(step.paused).toBe(true);
    expect(step.fault).not.toBeNull();
    expect(step.fault?.type).toBe('ground_fault');
    expect(step.fault?.message).toContain('Dispersione verso terra');
  });

  it('does NOT trip RCD when a resistor load (-R1) is connected between line and neutral, and trips only when fault button (-S1) to PE is pressed', () => {
    const userCircuitDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Power source L+N+PE at (100, 100): L at (80, 110), N at (100, 110), PE at (120, 110)
        { id: 'src', def: 'pwr_l_n_pe', x: 100, y: 100, rot: 0 as const, tag: '-X1', props: {} },
        // Interruttore Differenziale -F1 at (90, 160): 1 at (80, 130), 3 at (100, 130), 2 at (80, 190), 4 at (100, 190)
        { id: 'rcd1', def: 'rcd_differential_1p_n', x: 90, y: 160, rot: 0 as const, tag: '-F1', props: {} },
        // Resistor load -R1 at (90, 240): 1 at (90, 220), 2 at (90, 270)
        { id: 'resistor1', def: 'resistor_1p', x: 90, y: 240, rot: 0 as const, tag: '-R1', props: {} },
        // Pushbutton -S1 at (40, 210) connected to Phase and PE: 13 at (40, 190), 14 at (40, 230)
        { id: 'btn_fault', def: 'btn_no', x: 40, y: 210, rot: 0 as const, tag: '-S1', props: {} },
      ],
      wires: [
        // Source to RCD
        { id: 'w_l_in', pts: [{ x: 80, y: 110 }, { x: 80, y: 130 }] },
        { id: 'w_n_in', pts: [{ x: 100, y: 110 }, { x: 100, y: 130 }] },
        // RCD outputs to Resistor load
        { id: 'w_l_out', pts: [{ x: 80, y: 190 }, { x: 90, y: 190 }, { x: 90, y: 220 }] },
        { id: 'w_n_out', pts: [{ x: 100, y: 190 }, { x: 100, y: 270 }, { x: 90, y: 270 }] },
        // Fault branch: terminal 2 of RCD (80, 190) to terminal 13 of button (40, 190)
        { id: 'w_fault_tap', pts: [{ x: 80, y: 190 }, { x: 40, y: 190 }] },
        // Fault branch: terminal 14 of button (40, 230) to PE wire / source terminal (120, 110)
        { id: 'w_fault_pe', pts: [{ x: 40, y: 230 }, { x: 40, y: 300 }, { x: 120, y: 300 }, { x: 120, y: 110 }] },
      ],
    };

    // Step 1: User starts simulation and closes RCD -F1 (fault button -S1 is NOT pressed)
    const normalState = {
      ...createInitialSimState(),
      running: true,
      elementStates: { rcd1: true, btn_fault: false },
    };
    const step1 = stepSimulation(userCircuitDoc, normalState, 0.05);

    // Resistor is active (operating normally between L and N)
    expect(step1.activeOutputs['resistor1']).toBe(true);
    // RCD MUST REMAIN CLOSED!
    expect(step1.elementStates['rcd1']).toBe(true);
    // NO fault must be triggered!
    expect(step1.fault).toBeNull();
    expect(step1.faultAlert).toBeNull();
    expect(step1.running).toBe(true);

    // Step 2: User presses fault button -S1 connecting Phase downstream of RCD to PE
    const faultState = {
      ...step1,
      elementStates: { ...step1.elementStates, btn_fault: true },
    };
    const stepFault = stepSimulation(userCircuitDoc, faultState, 0.05);

    // RCD trips!
    expect(stepFault.elementStates['rcd1']).toBe(false);
    expect(stepFault.faultAlert).not.toBeNull();
    expect(stepFault.faultAlert?.type).toBe('rcd_tripped');
    // Resistor load turns OFF because power is cut downstream
    expect(stepFault.activeOutputs['resistor1']).toBeFalsy();
  });

  it('correctly toggles auxiliary NC (95-96) and NO (97-98) contacts when thermal relay trips', () => {
    const thermalDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Power source L+N at (100, 100): L at (90, 110), N at (110, 110)
        { id: 'src', def: 'pwr_l_n', x: 100, y: 100, rot: 0 as const, tag: '-X1', props: {} },
        // Thermal relay -F1 at (100, 160)
        { id: 'th1', def: 'thermal_bimetal_relay_3p', x: 100, y: 160, rot: 0 as const, tag: '-F1', props: {} },
        // Auxiliary NC contact (95-96) with matching tag -F1
        { id: 'th_nc', def: 'thermal_contact_nc', x: 200, y: 150, rot: 0 as const, tag: '-F1', props: {} },
        // Lamp -H2 (Arresto) connected in series with NC contact
        { id: 'lamp_nc', def: 'pilot_lamp', x: 200, y: 210, rot: 0 as const, tag: '-H2', props: {} },
        // Auxiliary NO contact (97-98) with matching tag -F1
        { id: 'th_no', def: 'thermal_contact_no', x: 300, y: 150, rot: 0 as const, tag: '-F1', props: {} },
        // Lamp -H1 (Allarme Sovraccarico) connected in series with NO contact
        { id: 'lamp_no', def: 'pilot_lamp', x: 300, y: 210, rot: 0 as const, tag: '-H1', props: {} },
      ],
      wires: [
        // L bus at y=80 to NC 95 at (200, 130)
        { id: 'w_l_nc', pts: [{ x: 90, y: 110 }, { x: 90, y: 80 }, { x: 200, y: 80 }, { x: 200, y: 130 }] },
        // NC 96 at (200, 170) to Lamp -H2 X1 at (200, 190)
        { id: 'w_nc_lamp', pts: [{ x: 200, y: 170 }, { x: 200, y: 190 }] },
        // Lamp -H2 X2 at (200, 230) to N bus at y=250 and back to N source at (110, 110)
        { id: 'w_lamp_n', pts: [{ x: 200, y: 230 }, { x: 200, y: 250 }, { x: 110, y: 250 }, { x: 110, y: 110 }] },
        // L bus at y=80 branched to NO 97 at (300, 130)
        { id: 'w_l_no', pts: [{ x: 200, y: 80 }, { x: 300, y: 80 }, { x: 300, y: 130 }] },
        // NO 98 at (300, 170) to Lamp -H1 X1 at (300, 190)
        { id: 'w_no_lamp', pts: [{ x: 300, y: 170 }, { x: 300, y: 190 }] },
        // Lamp -H1 X2 at (300, 230) to N bus at (200, 250)
        { id: 'w_lamp_no_n', pts: [{ x: 300, y: 230 }, { x: 300, y: 250 }, { x: 200, y: 250 }] },
      ],
    };

    // 1. Untripped state: -F1 is not tripped
    const normalState = {
      ...createInitialSimState(),
      running: true,
      activeOutputs: {},
    };
    const stepNormal = stepSimulation(thermalDoc, normalState, 0.05);

    // Lamp on NC contact (-H2) MUST be ON
    expect(stepNormal.activeOutputs['lamp_nc']).toBe(true);
    // Lamp on NO contact (-H1) MUST be OFF
    expect(stepNormal.activeOutputs['lamp_no']).toBeFalsy();

    // 2. Tripped state: Thermal relay trips (-F1 is active via activeOutputs)
    const trippedState = {
      ...stepNormal,
      activeOutputs: { '-F1': true },
    };
    const stepTripped = stepSimulation(thermalDoc, trippedState, 0.05);

    // NC contact opens: Lamp on NC contact (-H2) MUST be turned OFF (interrupted!)
    expect(stepTripped.activeOutputs['lamp_nc']).toBeFalsy();
    // NO contact closes: Lamp on NO contact (-H1) MUST be turned ON
    expect(stepTripped.activeOutputs['lamp_no']).toBe(true);

    // 3. Tripped state: Thermal relay trips via direct element interactive state (th1 in elementStates)
    const trippedByElemState = {
      ...stepNormal,
      elementStates: { th1: true },
      activeOutputs: {},
    };
    const stepTripped2 = stepSimulation(thermalDoc, trippedByElemState, 0.05);
    expect(stepTripped2.activeOutputs['lamp_nc']).toBeFalsy();
    expect(stepTripped2.activeOutputs['lamp_no']).toBe(true);
  });
  it('detects short circuit on DC output of single-phase power supply (psu_1p_dc) and halts simulation when unprotected', () => {
    const psuShortDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Source L+N at (100, 100): L at (90, 110), N at (110, 110)
        { id: 'src_ln', def: 'pwr_l_n', x: 100, y: 100, rot: 0 as const, tag: '-X', props: {} },
        // psu_1p_dc at (100, 160): 1 at (90, 140), 2 at (110, 140), 3 (+) at (90, 180), 4 (-) at (110, 180)
        { id: 'psu1', def: 'psu_1p_dc', x: 100, y: 160, rot: 0 as const, tag: '-V', props: {} },
      ],
      wires: [
        // Connect L+N to PSU inputs 1 and 2
        { id: 'w1', pts: [{ x: 90, y: 110 }, { x: 90, y: 140 }] },
        { id: 'w2', pts: [{ x: 110, y: 110 }, { x: 110, y: 140 }] },
        // Direct short-circuit between DC outputs 3 (+) and 4 (-)
        { id: 'w_short', pts: [{ x: 90, y: 180 }, { x: 90, y: 210 }, { x: 110, y: 210 }, { x: 110, y: 180 }] },
      ],
    };

    const sim = stepSimulation(psuShortDoc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim.running).toBe(false);
    expect(sim.paused).toBe(true);
    expect(sim.fault).not.toBeNull();
    expect(sim.fault?.type).toBe('short_circuit');
    expect(sim.fault?.message).toContain('Corto circuito DC (+/-)');
    expect(sim.fault?.message).toContain('-V');
  });

  it('trips upstream fuse when DC output of power supply (psu_1p_dc) is short-circuited', () => {
    const psuFuseDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Source L+N at (100, 70): L at (90, 80), N at (110, 80)
        { id: 'src_ln', def: 'pwr_l_n', x: 100, y: 70, rot: 0 as const, tag: '-X', props: {} },
        // Fuse 1P at (90, 110): 1 at (90, 90), 2 at (90, 130)
        { id: 'fuse1', def: 'fuse_1p', x: 90, y: 110, rot: 0 as const, tag: '-F1', props: {} },
        // psu_1p_dc at (100, 160): 1 at (90, 140), 2 at (110, 140), 3 (+) at (90, 180), 4 (-) at (110, 180)
        { id: 'psu1', def: 'psu_1p_dc', x: 100, y: 160, rot: 0 as const, tag: '-V', props: {} },
      ],
      wires: [
        // Source L to fuse input 1
        { id: 'w_l_fuse', pts: [{ x: 90, y: 80 }, { x: 90, y: 90 }] },
        // Fuse output 2 to PSU input 1
        { id: 'w_fuse_psu', pts: [{ x: 90, y: 130 }, { x: 90, y: 140 }] },
        // Source N directly to PSU input 2
        { id: 'w_n_psu', pts: [{ x: 110, y: 80 }, { x: 110, y: 140 }] },
        // Direct short-circuit between DC outputs 3 (+) and 4 (-)
        { id: 'w_short', pts: [{ x: 90, y: 180 }, { x: 90, y: 210 }, { x: 110, y: 210 }, { x: 110, y: 180 }] },
      ],
    };

    const sim = stepSimulation(psuFuseDoc, { ...createInitialSimState(), running: true }, 0.05);
    // Upstream fuse must trip!
    expect(sim.elementStates['fuse1']).toBe(false);
    expect(sim.faultAlert).not.toBeNull();
    expect(sim.faultAlert?.type).toBe('short_circuit');
    expect(sim.faultAlert?.message.toLowerCase()).toContain('fusibile');
    expect(sim.faultAlert?.message.toLowerCase()).toContain('corto circuito dc');
  });

  it('detects secondary short circuit on single-phase transformer (transformer_1p)', () => {
    const trafoDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Source L+N at (100, 100): L at (90, 110), N at (110, 110)
        { id: 'src_ln', def: 'pwr_l_n', x: 100, y: 100, rot: 0 as const, tag: '-X', props: {} },
        // transformer_1p at (100, 160): 1 at (90, 140), 2 at (110, 140), 3 (L) at (90, 180), 4 (N) at (110, 180)
        { id: 'trafo1', def: 'transformer_1p', x: 100, y: 160, rot: 0 as const, tag: '-T1', props: {} },
      ],
      wires: [
        { id: 'w1', pts: [{ x: 90, y: 110 }, { x: 90, y: 140 }] },
        { id: 'w2', pts: [{ x: 110, y: 110 }, { x: 110, y: 140 }] },
        // Direct short on secondary output
        { id: 'w_short', pts: [{ x: 90, y: 180 }, { x: 90, y: 210 }, { x: 110, y: 210 }, { x: 110, y: 180 }] },
      ],
    };

    const sim = stepSimulation(trafoDoc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim.running).toBe(false);
    expect(sim.fault).not.toBeNull();
    expect(sim.fault?.message).toContain('Corto circuito secondario Fase-Neutro');
    expect(sim.fault?.message).toContain('-T1');
  });

  it('detects secondary short circuit on three-phase transformer (transformer_3p)', () => {
    const trafo3pDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Source 3P at (100, 100): L1 at (80, 110), L2 at (100, 110), L3 at (120, 110)
        { id: 'src_3p', def: 'pwr_3p', x: 100, y: 100, rot: 0 as const, tag: '-X', props: {} },
        // transformer_3p at (100, 160): 1 at (80, 140), 2 at (100, 140), 3 at (120, 140), 4 at (80, 180), 5 at (100, 180), 6 at (120, 180)
        { id: 'trafo3', def: 'transformer_3p', x: 100, y: 160, rot: 0 as const, tag: '-T3', props: {} },
      ],
      wires: [
        { id: 'w1', pts: [{ x: 80, y: 110 }, { x: 80, y: 140 }] },
        { id: 'w2', pts: [{ x: 100, y: 110 }, { x: 100, y: 140 }] },
        { id: 'w3', pts: [{ x: 120, y: 110 }, { x: 120, y: 140 }] },
        // Direct short between secondary L1 (80, 180) and L2 (100, 180)
        { id: 'w_short', pts: [{ x: 80, y: 180 }, { x: 80, y: 210 }, { x: 100, y: 210 }, { x: 100, y: 180 }] },
      ],
    };

    const sim = stepSimulation(trafo3pDoc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim.running).toBe(false);
    expect(sim.fault).not.toBeNull();
    expect(sim.fault?.message).toContain('Corto circuito secondario L1-L2');
    expect(sim.fault?.message).toContain('-T3');
  });

  it('detects short circuit on DC output of three-phase power supply (psu_3p_dc)', () => {
    const psu3pDoc: Doc = {
      ...SAMPLE_DIRECT_START,
      elements: [
        // Source 3P at (100, 100): L1 at (80, 110), L2 at (100, 110), L3 at (120, 110)
        { id: 'src_3p', def: 'pwr_3p', x: 100, y: 100, rot: 0 as const, tag: '-X', props: {} },
        // psu_3p_dc at (100, 160): 1 at (80, 140), 2 at (100, 140), 3 at (120, 140), 4 (+) at (90, 180), 5 (-) at (110, 180)
        { id: 'psu3', def: 'psu_3p_dc', x: 100, y: 160, rot: 0 as const, tag: '-V3', props: {} },
      ],
      wires: [
        { id: 'w1', pts: [{ x: 80, y: 110 }, { x: 80, y: 140 }] },
        { id: 'w2', pts: [{ x: 100, y: 110 }, { x: 100, y: 140 }] },
        { id: 'w3', pts: [{ x: 120, y: 110 }, { x: 120, y: 140 }] },
        // Direct short between 4 (+) and 5 (-)
        { id: 'w_short', pts: [{ x: 90, y: 180 }, { x: 90, y: 210 }, { x: 110, y: 210 }, { x: 110, y: 180 }] },
      ],
    };

    const sim = stepSimulation(psu3pDoc, { ...createInitialSimState(), running: true }, 0.05);
    expect(sim.running).toBe(false);
    expect(sim.fault).not.toBeNull();
    expect(sim.fault?.message).toContain('Corto circuito DC (+/-)');
    expect(sim.fault?.message).toContain('-V3');
  });

  it('correctly simulates 3-position selector switch_3pos_center_off and switch_3pos', () => {
    // switch_3pos_center_off at (100, 200): 1 at (100, 180), 2 at (90, 220), 3 at (110, 220)
    // Source L at (100, 100): 1 at (100, 110)
    // Lamp 1 at (90, 300): X1 at (90, 280), X2 at (90, 320)
    // Lamp 2 at (110, 300): X1 at (110, 280), X2 at (110, 320)
    // Source N at (100, 400): 1 at (100, 390) (rot: 180)
    const doc: Doc = {
      app: 'powercad-nextgen',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Test',
        title: 'Selector Test',
        author: 'Test',
        date: '2026-10-22',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'src_l', def: 'pwr_l', x: 100, y: 100, rot: 0 as const, tag: 'L', props: {} },
        { id: 'sw_s2', def: 'switch_3pos_center_off', x: 100, y: 200, rot: 0 as const, tag: '-S2', props: {} },
        { id: 'lamp_p2', def: 'pilot_lamp', x: 90, y: 300, rot: 0 as const, tag: '-P2', props: {} },
        { id: 'lamp_p3', def: 'pilot_lamp', x: 110, y: 300, rot: 0 as const, tag: '-P3', props: {} },
        { id: 'src_n', def: 'pwr_n', x: 100, y: 400, rot: 180 as const, tag: 'N', props: {} },
      ],
      wires: [
        { id: 'w1', pts: [{ x: 100, y: 110 }, { x: 100, y: 180 }] },
        { id: 'w2', pts: [{ x: 90, y: 220 }, { x: 90, y: 280 }] },
        { id: 'w3', pts: [{ x: 110, y: 220 }, { x: 110, y: 280 }] },
        { id: 'w4', pts: [{ x: 90, y: 320 }, { x: 90, y: 390 }, { x: 100, y: 390 }] },
        { id: 'w5', pts: [{ x: 110, y: 320 }, { x: 110, y: 390 }, { x: 100, y: 390 }] },
      ],
    };

    // Position 0: Center open -> both lamps off
    const sim0 = stepSimulation(doc, { ...createInitialSimState(), running: true, elementStates: { sw_s2: 0 } }, 0.05);
    expect(sim0.activeOutputs['lamp_p2']).toBeFalsy();
    expect(sim0.activeOutputs['lamp_p3']).toBeFalsy();

    // Position 1: Pos I (1-2) -> lamp P2 on, lamp P3 off
    const sim1 = stepSimulation(doc, { ...createInitialSimState(), running: true, elementStates: { sw_s2: 1 } }, 0.05);
    expect(sim1.activeOutputs['lamp_p2']).toBe(true);
    expect(sim1.activeOutputs['lamp_p3']).toBeFalsy();

    // Position 2: Pos II (1-3) -> lamp P2 off, lamp P3 on
    const sim2 = stepSimulation(doc, { ...createInitialSimState(), running: true, elementStates: { sw_s2: 2 } }, 0.05);
    expect(sim2.activeOutputs['lamp_p2']).toBeFalsy();
    expect(sim2.activeOutputs['lamp_p3']).toBe(true);
  });

  it('correctly simulates impulse / step relay coil_step (toggles state on each pulse)', () => {
    // Button NO and step relay coil -K1, controlling contact NO -K1 and lamp -H1
    const doc: Doc = {
      app: 'powercad-nextgen',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Step Relay Test',
        title: 'Step Relay',
        author: 'Test',
        date: '2026-10-22',
        revision: '1',
        sheetNo: '1',
      },
      elements: [
        { id: 'src_l', def: 'pwr_l', x: 100, y: 100, rot: 0 as const, tag: 'L', props: {} },
        { id: 'btn_s', def: 'btn_no', x: 100, y: 160, rot: 0 as const, tag: '-S', props: {} },
        { id: 'coil_k1', def: 'coil_step', x: 100, y: 240, rot: 0 as const, tag: '-K1', props: {} },
        { id: 'contact_k1', def: 'contact_no', x: 160, y: 160, rot: 0 as const, tag: '-K1', props: {} },
        { id: 'lamp_h1', def: 'pilot_lamp', x: 160, y: 240, rot: 0 as const, tag: '-H1', props: {} },
        { id: 'src_n', def: 'pwr_n', x: 100, y: 320, rot: 180 as const, tag: 'N', props: {} },
      ],
      wires: [
        // L to btn (13) and contact (13)
        { id: 'w1', pts: [{ x: 100, y: 110 }, { x: 100, y: 140 }] },
        { id: 'w2', pts: [{ x: 100, y: 110 }, { x: 160, y: 110 }, { x: 160, y: 140 }] },
        // btn (14) to coil (A1)
        { id: 'w3', pts: [{ x: 100, y: 180 }, { x: 100, y: 220 }] },
        // contact (14) to lamp (X1)
        { id: 'w4', pts: [{ x: 160, y: 180 }, { x: 160, y: 220 }] },
        // coil (A2) and lamp (X2) to N
        { id: 'w5', pts: [{ x: 100, y: 260 }, { x: 100, y: 310 }] },
        { id: 'w6', pts: [{ x: 160, y: 260 }, { x: 160, y: 310 }, { x: 100, y: 310 }] },
      ],
    };

    let state = { ...createInitialSimState(), running: true };

    // Initially: button not pressed -> coil off, contact open, lamp off
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs['-K1']).toBeFalsy();
    expect(state.activeOutputs['lamp_h1']).toBeFalsy();

    // 1st pulse: press button -> coil energizes, toggles state to ON, contact closes, lamp lights up!
    state.elementStates['btn_s'] = true;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs['-K1']).toBe(true);
    expect(state.activeOutputs['lamp_h1']).toBe(true);

    // Release button: coil de-energizes, but latched state remains ON! Lamp stays ON!
    state.elementStates['btn_s'] = false;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs['-K1']).toBe(true);
    expect(state.activeOutputs['lamp_h1']).toBe(true);

    // 2nd pulse: press button again -> coil energizes, toggles state to OFF!
    state.elementStates['btn_s'] = true;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs['-K1']).toBeFalsy();
    expect(state.activeOutputs['lamp_h1']).toBeFalsy();

    // Release button: stays OFF!
    state.elementStates['btn_s'] = false;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs['-K1']).toBeFalsy();
    expect(state.activeOutputs['lamp_h1']).toBeFalsy();
  });
});
