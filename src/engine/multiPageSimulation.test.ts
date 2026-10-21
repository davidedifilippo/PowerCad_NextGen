import { describe, it, expect } from 'vitest';
import { Doc } from '../model/types';
import { createInitialSimState, stepSimulation } from './simulation';
import { getDocPages, getActivePageIndex, addPage, switchPage, renamePage, deletePage, updateDocContent } from '../utils/pageUtils';

describe('Multi-Page Schematic Architecture & Cross-Page Simulation', () => {
  it('manages pages correctly with pageUtils: add, switch, rename, delete', () => {
    let doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Progetto Test Multi-Foglio',
        title: 'Foglio Principale',
        author: 'Tester',
        date: '2026-10-21',
        revision: '1',
        sheetNo: '1',
      },
      elements: [{ id: 'el1', def: 'pwr_l', x: 100, y: 100, rot: 0, tag: 'L1', props: {} }],
      wires: [],
    };

    // Initial state: 1 page synthesized
    expect(getDocPages(doc).length).toBe(1);
    expect(getActivePageIndex(doc)).toBe(0);

    // Add Page 2
    doc = addPage(doc, 'Circuito di Comando');
    expect(getDocPages(doc).length).toBe(2);
    expect(getActivePageIndex(doc)).toBe(1);
    expect(getDocPages(doc)[1].title).toBe('Circuito di Comando');
    expect(doc.elements.length).toBe(0); // new page starts empty

    // Place element on Page 2 and sync
    doc = updateDocContent(doc, [{ id: 'el2', def: 'coil_mono', x: 200, y: 200, rot: 0, tag: '-KM1', props: {} }], []);
    expect(doc.elements.length).toBe(1);
    expect(getDocPages(doc)[1].elements.length).toBe(1);

    // Switch back to Page 1
    doc = switchPage(doc, 0);
    expect(getActivePageIndex(doc)).toBe(0);
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].id).toBe('el1');

    // Switch back to Page 2
    doc = switchPage(doc, 1);
    expect(getActivePageIndex(doc)).toBe(1);
    expect(doc.elements.length).toBe(1);
    expect(doc.elements[0].id).toBe('el2');

    // Rename Page 2
    doc = renamePage(doc, 1, 'Comando PLC');
    expect(getDocPages(doc)[1].title).toBe('Comando PLC');

    // Delete Page 2
    doc = deletePage(doc, 1);
    expect(getDocPages(doc).length).toBe(1);
    expect(getActivePageIndex(doc)).toBe(0);
    expect(doc.elements[0].id).toBe('el1');
  });

  it('simulates cross-page tag synchronization: coil on Page 2 drives contactor contacts on Page 1', () => {
    // Page 1: 3-Phase power supply + Contactor 3P power contacts (-KM1) + 3-phase motor (M1)
    // Page 2: 24V DC power supply + Pushbutton (-SB1) + Coil (-KM1)
    const doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Multi-Page Test',
        title: 'Schema Generale',
        author: 'Tester',
        date: '2026-10-21',
        revision: '1',
        sheetNo: '1',
      },
      elements: [],
      wires: [],
      pages: [
        {
          id: 'page_power',
          title: 'Potenza Trifase',
          elements: [
            { id: 'pwr_3p', def: 'pwr_3p', x: 100, y: 100, rot: 0, tag: 'L1-L2-L3', props: {} },
            { id: 'contactor_pwr', def: 'contactor_power_3p', x: 100, y: 200, rot: 0, tag: '-KM1', props: {} },
            { id: 'motor1', def: 'motor_3p_async', x: 100, y: 300, rot: 0, tag: '-M1', props: {} },
          ],
          wires: [
            // L1 (80, 110) to contactor 1 (80, 170)
            { id: 'wp1', pts: [{ x: 80, y: 110 }, { x: 80, y: 170 }] },
            // L2 (100, 110) to contactor 3 (100, 170)
            { id: 'wp2', pts: [{ x: 100, y: 110 }, { x: 100, y: 170 }] },
            // L3 (120, 110) to contactor 5 (120, 170)
            { id: 'wp3', pts: [{ x: 120, y: 110 }, { x: 120, y: 170 }] },
            // Contactor 2 (80, 230) to motor U1 (80, 270)
            { id: 'wp4', pts: [{ x: 80, y: 230 }, { x: 80, y: 270 }] },
            // Contactor 4 (100, 230) to motor V1 (100, 270)
            { id: 'wp5', pts: [{ x: 100, y: 230 }, { x: 100, y: 270 }] },
            // Contactor 6 (120, 230) to motor W1 (120, 270)
            { id: 'wp6', pts: [{ x: 120, y: 230 }, { x: 120, y: 270 }] },
          ],
        },
        {
          id: 'page_control',
          title: 'Circuito di Comando',
          elements: [
            { id: 'pwr_pos', def: 'pwr_dc_plus', x: 100, y: 100, rot: 0, tag: '+24V', props: {} },
            { id: 'pwr_neg', def: 'pwr_dc_minus', x: 200, y: 100, rot: 0, tag: '0V', props: {} },
            // Button -SB1 at (100, 180): term 13 at (100, 160), term 14 at (100, 200)
            { id: 'btn_start', def: 'btn_no', x: 100, y: 180, rot: 0, tag: '-SB1', props: {} },
            // Coil -KM1 at (100, 260): term A1 at (100, 240), term A2 at (100, 280)
            { id: 'coil_km1', def: 'coil_standard', x: 100, y: 260, rot: 0, tag: '-KM1', props: {} },
          ],
          wires: [
            // +24V (100, 110) to button 13 (100, 160)
            { id: 'wc1', pts: [{ x: 100, y: 110 }, { x: 100, y: 160 }] },
            // Button 14 (100, 200) to Coil A1 (100, 240)
            { id: 'wc2', pts: [{ x: 100, y: 200 }, { x: 100, y: 240 }] },
            // 0V (200, 110) to Coil A2 (100, 280)
            { id: 'wc3', pts: [{ x: 200, y: 110 }, { x: 200, y: 280 }, { x: 100, y: 280 }] },
          ],
        },
      ],
      activePageIndex: 0,
    };

    // Step 1: When start button is NOT pressed, coil is off and motor is NOT running
    const state0 = stepSimulation(doc, { ...createInitialSimState(), running: true }, 0.05);
    expect(state0.activeOutputs['-KM1']).toBeUndefined();
    expect(state0.activeOutputs['motor1']).toBeUndefined();

    // Step 2: User presses button -SB1 on Page 2
    const statePressed = {
      ...state0,
      elementStates: { ...state0.elementStates, btn_start: true },
    };
    const state1 = stepSimulation(doc, statePressed, 0.05);

    // Coil on Page 2 is energized!
    expect(state1.activeOutputs['coil_km1']).toBe(true);
    expect(state1.activeOutputs['-KM1']).toBe(true);

    // Contactor contacts on Page 1 closed, powering Motor M1 on Page 1!
    expect(state1.activeOutputs['motor1']).toBe(true);
  });

  it('simulates cross-page wire reference markers (ref_marker_output -> ref_marker_input)', () => {
    // Page 1: Power source fed into a ref_marker_output with ref: 'BUS_L1'
    // Page 2: ref_marker_input with ref: 'BUS_L1' feeding a lamp connected to Neutral
    const doc: Doc = {
      app: 'cadesimu-next',
      version: 1,
      sheet: {
        format: 'A4',
        orientation: 'landscape',
        project: 'Wire Ref Test',
        title: 'Ref Marker Test',
        author: 'Tester',
        date: '2026-10-21',
        revision: '1',
        sheetNo: '1',
      },
      elements: [],
      wires: [],
      pages: [
        {
          id: 'p1',
          title: 'Alimentazione',
          elements: [
            { id: 'pwr_l', def: 'pwr_l', x: 100, y: 100, rot: 0, tag: 'L1', props: {} },
            // ref_marker_output at (100, 200): term '1' at (80, 200)
            { id: 'marker_out', def: 'ref_marker_output', x: 100, y: 200, rot: 0, tag: '', props: { ref: 'BUS_L1' } },
          ],
          wires: [
            // Wire L1 (100, 110) to marker_out terminal 1 (80, 200)
            { id: 'w1', pts: [{ x: 100, y: 110 }, { x: 80, y: 110 }, { x: 80, y: 200 }] },
          ],
        },
        {
          id: 'p2',
          title: 'Carichi',
          elements: [
            // ref_marker_input at (100, 100): term '1' at (120, 100)
            { id: 'marker_in', def: 'ref_marker_input', x: 100, y: 100, rot: 0, tag: '', props: { ref: 'BUS_L1' } },
            // Neutral supply on page 2 at (200, 100): term N at (200, 110)
            { id: 'pwr_n', def: 'pwr_n', x: 200, y: 100, rot: 0, tag: 'N', props: {} },
            // Lamp at (150, 200): term X1 at (150, 180), term X2 at (150, 220)
            { id: 'lamp1', def: 'pilot_lamp', x: 150, y: 200, rot: 0, tag: '-H1', props: {} },
          ],
          wires: [
            // Marker In (120, 100) to Lamp X1 (150, 180)
            { id: 'w2', pts: [{ x: 120, y: 100 }, { x: 150, y: 100 }, { x: 150, y: 180 }] },
            // Neutral (200, 110) to Lamp X2 (150, 220)
            { id: 'w3', pts: [{ x: 200, y: 110 }, { x: 200, y: 220 }, { x: 150, y: 220 }] },
          ],
        },
      ],
      activePageIndex: 1,
    };

    const sim = stepSimulation(doc, { ...createInitialSimState(), running: true }, 0.05);
    // Lamp on page 2 must be energized via the cross-page BUS_L1 reference marker!
    expect(sim.activeOutputs['lamp1']).toBe(true);
  });
});
