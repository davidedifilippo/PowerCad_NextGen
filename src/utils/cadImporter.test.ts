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
});
