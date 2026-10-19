import { describe, it, expect } from 'vitest';
import sampleData from './testCadSample.json';
import { parseCadeSimu, extractCartiglio, cadToCanvasCoord } from './cadImporter';
import { createInitialSimState, stepSimulation } from '../engine/simulation';

describe('CADe_SIMU .cad Importer', () => {
  const content = sampleData.cadText;

  it('correctly transforms CADe_SIMU grid coordinates (step 3) to canvas coordinates (step 10)', () => {
    expect(cadToCanvasCoord(0)).toBe(0);
    expect(cadToCanvasCoord(3)).toBe(10);
    expect(cadToCanvasCoord(27)).toBe(90);
    expect(cadToCanvasCoord(45)).toBe(150);
    expect(cadToCanvasCoord(93)).toBe(310);
    expect(cadToCanvasCoord(189)).toBe(630);
  });

  it('correctly parses cartiglio title block from native .cad file', () => {
    const cartiglio = extractCartiglio(content);

    expect(cartiglio).not.toBeNull();
    expect(cartiglio?.date).toBe('21-Jun-2024');
    expect(cartiglio?.filename).toBe('Controllo_motori_esama_tpsee_2024.cad');
    expect(cartiglio?.sheetNo).toBe('1');
  });

  it('parses real native CADe_SIMU circuit file test_sample.cad into a valid Doc', () => {
    const doc = parseCadeSimu(content);

    expect(doc.app).toBe('electroforge');
    expect(doc.version).toBe(1);
    expect(doc.sheet.title).toContain('Controllo_motori_esama_tpsee_2024.cad');
    expect(doc.sheet.date).toBe('21-Jun-2024');

    // Check elements
    expect(doc.elements.length).toBeGreaterThanOrEqual(20);
    expect(doc.wires.length).toBeGreaterThanOrEqual(40);

    // Verify key components exist
    const pwr = doc.elements.find((e) => e.def === 'pwr_dc_plus' || e.def === 'pwr_l');
    expect(pwr).toBeDefined();
    expect(pwr?.tag).toBe('24V');

    const stopBtn = doc.elements.find((e) => e.tag === 'Stop');
    expect(stopBtn).toBeDefined();
    expect(stopBtn?.def).toBe('btn_emergency');

    const s1Btn = doc.elements.find((e) => e.tag === 'S1');
    expect(s1Btn).toBeDefined();
    expect(s1Btn?.def).toBe('btn_no');

    const coilKS = doc.elements.find((e) => e.tag === 'KS' && e.def === 'coil_standard');
    expect(coilKS).toBeDefined();

    const coilRM1 = doc.elements.find((e) => e.tag === 'RM1_A' && e.def === 'coil_standard');
    expect(coilRM1).toBeDefined();

    const contactRM1 = doc.elements.find((e) => e.tag === 'RM1_A' && e.def === 'contact_no');
    expect(contactRM1).toBeDefined();

    // Verify timer coil delay is extracted
    const timerT2 = doc.elements.find((e) => e.tag === 'T2' && e.def === 'coil_timer_on');
    expect(timerT2).toBeDefined();
    expect(timerT2?.props.delay).toBe(10);

    // Verify text labels
    const textLabels = doc.elements.filter((e) => e.def === 'text_label');
    expect(textLabels.length).toBe(3);
    const ksText = textLabels.find((t) => t.props.text?.toString().includes('KS contattore di stop'));
    expect(ksText).toBeDefined();
    const rm1Text = textLabels.find((t) => t.props.text?.toString().includes('RM1_A'));
    expect(rm1Text).toBeDefined();

    // Verify wires have valid points and kinds
    for (const wire of doc.wires) {
      expect(wire.pts.length).toBe(2);
      expect(['phase', 'pos', 'neutral', 'pe']).toContain(wire.kind);
    }
  });

  it('verifies the imported circuit seamlessly executes in the simulation engine', () => {
    const doc = parseCadeSimu(content);

    const initialState = { ...createInitialSimState(), running: true };
    // Step simulation 5 times
    let state = initialState;
    for (let i = 0; i < 5; i++) {
      state = stepSimulation(doc, state, 0.05);
    }

    // Check that potentials are computed and simulation runs without errors
    expect(Object.keys(state.nodePotentials).length).toBeGreaterThan(0);
    expect(state.running).toBe(true);
  });

  it('correctly imports circuit from "dispersione verso terra.cad" (resistors, switches, fuses, RCD, and 40xx wires)', async () => {
    const dispersioneSampleData = await import('./testDispersioneCad.json');
    const cadText = dispersioneSampleData.default.cadText;
    const doc = parseCadeSimu(cadText);

    // 1. Wires must be parsed (previously were 0 because types were 4000, 4009, 4010, 4018)
    expect(doc.wires.length).toBeGreaterThanOrEqual(60);
    const kinds = new Set(doc.wires.map((w) => w.kind));
    expect(kinds.has('phase')).toBe(true);
    expect(kinds.has('neutral')).toBe(true);
    expect(kinds.has('pe')).toBe(true);

    // 2. Circuit 1 (Images 3 & 4): Single-phase circuit with Resistor -R and RCD -F
    const resistor1p = doc.elements.find((e) => e.def === 'resistor_1p' && e.tag === '-R');
    expect(resistor1p).toBeDefined();
    expect(resistor1p?.x).toBe(110);
    expect(resistor1p?.y).toBe(310);

    // RCD -F must be 2-pole (1P+N), not 3P
    const rcd1p = doc.elements.find((e) => e.def === 'rcd_differential_1p_n' && e.tag === '-F');
    expect(rcd1p).toBeDefined();
    expect(rcd1p?.x).toBe(120);
    expect(rcd1p?.y).toBe(180);

    // 3. Circuit 2 (Images 1 & 2): 3-phase motor power circuit
    // Fuses -F (type 5003)
    const fuse3p = doc.elements.find((e) => e.def === 'fuse_3p' && e.tag === '-F');
    expect(fuse3p).toBeDefined();
    expect(fuse3p?.x).toBe(620);
    expect(fuse3p?.y).toBe(160);

    // Switch -S (type 2004)
    const switch3p = doc.elements.find((e) => e.def === 'switch_disconnector_3p' && e.tag === '-S');
    expect(switch3p).toBeDefined();
    expect(switch3p?.x).toBe(620);
    expect(switch3p?.y).toBe(230);

    // Thermal relay -F (type 6007)
    const thermalRelay = doc.elements.find((e) => e.def === 'thermal_relay_power' && e.tag === '-F');
    expect(thermalRelay).toBeDefined();
    expect(thermalRelay?.x).toBe(620);
    expect(thermalRelay?.y).toBe(300);

    // Motor -M (type 1000)
    const motor = doc.elements.find((e) => e.def === 'motor_3p_async' && e.tag === '-M');
    expect(motor).toBeDefined();
    expect(motor?.x).toBe(620);
    expect(motor?.y).toBe(430);

    // Auxiliary contact -S3
    const btnS3 = doc.elements.find((e) => e.tag === '-S3');
    expect(btnS3).toBeDefined();

    // 4. Verify terminal connectivity to wires in Circuit 1:
    // RCD input 1 at (110, 150) should connect to a wire endpoint
    const rcdInputWire = doc.wires.find((w) =>
      w.pts.some((p) => p.x === 110 && p.y === 150)
    );
    expect(rcdInputWire).toBeDefined();

    // RCD output 2 at (110, 210) should connect to a wire endpoint
    const rcdOutputWire = doc.wires.find((w) =>
      w.pts.some((p) => p.x === 110 && p.y === 210)
    );
    expect(rcdOutputWire).toBeDefined();

    // Resistor terminal 1 at (110, 290) and terminal 2 at (110, 340) must connect to wire endpoints
    const rInWire = doc.wires.find((w) =>
      w.pts.some((p) => p.x === 110 && p.y === 290)
    );
    expect(rInWire).toBeDefined();
    const rOutWire = doc.wires.find((w) =>
      w.pts.some((p) => p.x === 110 && p.y === 340)
    );
    expect(rOutWire).toBeDefined();

    // 5. Verify terminal connectivity in Circuit 2:
    // Fuses top at (600, 140) and bottom at (600, 180)
    expect(doc.wires.some((w) => w.pts.some((p) => p.x === 600 && p.y === 140))).toBe(true);
    expect(doc.wires.some((w) => w.pts.some((p) => p.x === 600 && p.y === 180))).toBe(true);

    // Switch top at (600, 210) and bottom at (600, 250)
    expect(doc.wires.some((w) => w.pts.some((p) => p.x === 600 && p.y === 210))).toBe(true);
    expect(doc.wires.some((w) => w.pts.some((p) => p.x === 600 && p.y === 250))).toBe(true);

    // Motor U1 terminal at (600, 400) and PE terminal at (660, 400)
    expect(doc.wires.some((w) => w.pts.some((p) => p.x === 600 && p.y === 400))).toBe(true);
    expect(doc.wires.some((w) => w.pts.some((p) => p.x === 660 && p.y === 400))).toBe(true);
  });
});
