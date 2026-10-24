import fs from "fs";
import { describe, it, expect } from "vitest";
import { SAMPLE_APRICANCELLO_ELETTRICO } from "../samples/apricancelloElettrico";
import { stepSimulation, createInitialSimState } from "./simulation";
import { validateDRC } from "../ai/cadCommands";

describe("Apricancello Elettrico - Complete Simulation Verification", () => {
  it("passes DRC validation with 0 issues", () => {
    const issues = validateDRC(SAMPLE_APRICANCELLO_ELETTRICO);
    expect(issues).toEqual([]);
  

});

  it("executes the full cycle: Apertura manuale -> S3 -> Pausa 5s -> Chiusura automatica -> S4", () => {
    const doc = SAMPLE_APRICANCELLO_ELETTRICO;
    let state = { ...createInitialSimState(), running: true };

    // Initial state: motor not running
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs["m1"]).toBeFalsy();
    expect(state.activeOutputs["K1"]).toBeFalsy();
    expect(state.activeOutputs["K3"]).toBeFalsy();

    // 1. Press S1 (Pulsante Apertura manuale)
    state.elementStates["s1"] = true;
    state = stepSimulation(doc, state, 0.05);

    // K1 energizes, motor runs in forward direction (apertura)
    expect(state.activeOutputs["k1_coil"]).toBe(true);
    expect(state.activeOutputs["K1"]).toBe(true);
    expect(state.activeOutputs["m1"]).toBe(true);
    expect(state.activeOutputs["m1_fwd"]).toBe(true);
    expect(state.activeOutputs["m1_rev"]).toBeFalsy();

    // Release S1 -> K1 stays latched via k1_aux
    state.elementStates["s1"] = false;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs["K1"]).toBe(true);
    expect(state.activeOutputs["m1_fwd"]).toBe(true);

    // 2. Gate reaches full open position -> Limit switch S3 is actuated
    // S3 NC opens and S3 NO closes
    state.elementStates["S3"] = true;
    state = stepSimulation(doc, state, 0.05);

    // K1 de-energizes, motor stops
    expect(state.activeOutputs["K1"]).toBeFalsy();
    expect(state.activeOutputs["m1"]).toBeFalsy();

    // Timer K2 starts counting (5s)
    // Run 3 seconds: timer still counting, K3 not yet engaged
    state = stepSimulation(doc, state, 3.0);
    expect(state.activeOutputs["K3"]).toBeFalsy();
    expect(state.activeOutputs["m1"]).toBeFalsy();

    // Run another 2.5 seconds: total > 5.0s -> K2 timed contact closes and triggers K3!
    state = stepSimulation(doc, state, 2.5);
    expect(state.activeOutputs["K3"]).toBe(true);
    expect(state.activeOutputs["m1"]).toBe(true);
    expect(state.activeOutputs["m1_rev"]).toBe(true);
    expect(state.activeOutputs["m1_fwd"]).toBeFalsy();

    // As gate begins to close, it moves off limit switch S3
    state.elementStates["S3"] = false;
    state = stepSimulation(doc, state, 0.05);

    // K3 remains latched via k3_aux! Motor continues closing in reverse
    expect(state.activeOutputs["K3"]).toBe(true);
    expect(state.activeOutputs["m1_rev"]).toBe(true);

    // 3. Gate reaches fully closed position -> Limit switch S4 actuated
    state.elementStates["s4_nc"] = true; // S4 NC opens
    state = stepSimulation(doc, state, 0.05);

    // K3 de-energizes, motor stops
    expect(state.activeOutputs["K3"]).toBeFalsy();
    expect(state.activeOutputs["m1"]).toBeFalsy();
  });

  it("supports manual closing with button S2", () => {
    const doc = SAMPLE_APRICANCELLO_ELETTRICO;
    let state = { ...createInitialSimState(), running: true };

    // Press S2 (Pulsante Chiusura manuale)
    state.elementStates["s2"] = true;
    state = stepSimulation(doc, state, 0.05);

    expect(state.activeOutputs["K3"]).toBe(true);
    expect(state.activeOutputs["m1_rev"]).toBe(true);

    // Release S2 -> K3 stays latched
    state.elementStates["s2"] = false;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs["K3"]).toBe(true);
    expect(state.activeOutputs["m1_rev"]).toBe(true);

    // Stop at S4
    state.elementStates["s4_nc"] = true;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs["K3"]).toBeFalsy();
    expect(state.activeOutputs["m1"]).toBeFalsy();
  });

  it("stops everything when thermal relay RT trips", () => {
    const doc = SAMPLE_APRICANCELLO_ELETTRICO;
    let state = { ...createInitialSimState(), running: true };

    // Start opening
    state.elementStates["s1"] = true;
    state = stepSimulation(doc, state, 0.05);
    state.elementStates["s1"] = false;
    state = stepSimulation(doc, state, 0.05);
    expect(state.activeOutputs["K1"]).toBe(true);

    // Trip thermal relay RT
    state.elementStates["RT"] = true;
    state.activeOutputs["RT"] = true;
    state = stepSimulation(doc, state, 0.05);

    // K1 drops, motor immediately stops
    expect(state.activeOutputs["K1"]).toBeFalsy();
    expect(state.activeOutputs["m1"]).toBeFalsy();
  });
  it("exports Apricancello_Elettrico.json to disk", () => {
    const jsonStr = JSON.stringify(SAMPLE_APRICANCELLO_ELETTRICO, null, 2).replace(/\n/g, "\r\n");
    fs.writeFileSync("Apricancello_Elettrico.json", jsonStr, "utf8");
    fs.writeFileSync("../Apricancello_Elettrico.json", jsonStr, "utf8");
    expect(fs.existsSync("Apricancello_Elettrico.json")).toBe(true);
  });
});

