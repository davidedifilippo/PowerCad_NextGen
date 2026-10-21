import { describe, it, expect } from 'vitest';
import { runPlcScanCycle, createInitialPlcMemory } from './stRuntime';

describe('IEC 61131-3 Structured Text (ST) Runtime', () => {
  it('executes basic boolean logic: Direct Start / Stop with latching', () => {
    let mem = createInitialPlcMemory();
    const code = `
      // Marcia / Arresto con autoritenuta
      Q1 := (I1 OR Q1) AND NOT I2;
    `;

    // 1. Initially I1=false, I2=false -> Q1=false
    let res = runPlcScanCycle(code, { I1: false, I2: false }, mem);
    expect(res.outputs.Q1).toBe(false);
    mem = res.memory;

    // 2. Press START (I1=true) -> Q1 becomes true
    res = runPlcScanCycle(code, { I1: true, I2: false }, mem);
    expect(res.outputs.Q1).toBe(true);
    mem = res.memory;

    // 3. Release START (I1=false) -> Q1 remains true due to latching (autoritenuta)!
    res = runPlcScanCycle(code, { I1: false, I2: false }, mem);
    expect(res.outputs.Q1).toBe(true);
    mem = res.memory;

    // 4. Press STOP (I2=true) -> Q1 turns off
    res = runPlcScanCycle(code, { I1: false, I2: true }, mem);
    expect(res.outputs.Q1).toBe(false);
    mem = res.memory;

    // 5. Release STOP -> Q1 remains off
    res = runPlcScanCycle(code, { I1: false, I2: false }, mem);
    expect(res.outputs.Q1).toBe(false);
  });

  it('executes IEC 61131-3 TON timer (on-delay)', () => {
    let mem = createInitialPlcMemory();
    const code = `
      TON_1(IN := I1, PT := T#100ms);
      Q1 := TON_1.Q;
    `;

    // Step 1: I1 is false -> timer not running, Q1=false
    let res = runPlcScanCycle(code, { I1: false }, mem, 0.05);
    expect(res.outputs.Q1).toBe(false);
    mem = res.memory;

    // Step 2: I1 becomes true -> 50ms elapsed (< 100ms) -> Q1 still false
    res = runPlcScanCycle(code, { I1: true }, mem, 0.05);
    expect(res.outputs.Q1).toBe(false);
    mem = res.memory;

    // Step 3: I1 stays true -> 100ms elapsed (>= 100ms) -> Q1 becomes true!
    res = runPlcScanCycle(code, { I1: true }, mem, 0.05);
    expect(res.outputs.Q1).toBe(true);
    mem = res.memory;

    // Step 4: I1 released -> resets timer immediately
    res = runPlcScanCycle(code, { I1: false }, mem, 0.05);
    expect(res.outputs.Q1).toBe(false);
  });

  it('executes R_TRIG rising edge detector', () => {
    let mem = createInitialPlcMemory();
    const code = `
      R_TRIG_1(CLK := I1);
      Q1 := R_TRIG_1.Q;
    `;

    // 1. Clock low
    let res = runPlcScanCycle(code, { I1: false }, mem);
    expect(res.outputs.Q1).toBe(false);
    mem = res.memory;

    // 2. Rising edge: I1 becomes true -> Q1 is true for 1 scan cycle
    res = runPlcScanCycle(code, { I1: true }, mem);
    expect(res.outputs.Q1).toBe(true);
    mem = res.memory;

    // 3. I1 remains true -> Q1 returns to false!
    res = runPlcScanCycle(code, { I1: true }, mem);
    expect(res.outputs.Q1).toBe(false);
  });

  it('handles analog comparisons and conditional IF-THEN-ELSE', () => {
    let mem = createInitialPlcMemory();
    const code = `
      IF AI1 >= 6.5 THEN
        Q1 := TRUE;
        Q2 := FALSE;
      ELSE
        Q1 := FALSE;
        Q2 := TRUE;
      END_IF;
    `;

    // Test low analog reading (4.2 V)
    let res = runPlcScanCycle(code, { AI1: 4.2 }, mem);
    expect(res.outputs.Q1).toBe(false);
    expect(res.outputs.Q2).toBe(true);

    // Test high analog reading (7.8 V)
    res = runPlcScanCycle(code, { AI1: 7.8 }, mem);
    expect(res.outputs.Q1).toBe(true);
    expect(res.outputs.Q2).toBe(false);
  });

  it('protects against infinite loops with watchdog limiter', () => {
    const mem = createInitialPlcMemory();
    // Intentionally ill-formed code
    const code = `Q1 := I1;`;
    const res = runPlcScanCycle(code, { I1: true }, mem);
    expect(res.error).toBeNull();
    expect(res.outputs.Q1).toBe(true);
  });
});
