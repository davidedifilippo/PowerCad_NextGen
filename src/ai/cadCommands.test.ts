import { describe, it, expect } from 'vitest';
import {
  getCircuitSummary,
  executeCadActions,
  resolveTerminal,
  routeManhattanWire,
  validateDRC,
} from './cadCommands';
import { SAMPLE_DIRECT_START } from '../samples/directStart';
import { Doc } from '../model/types';

describe('CAD AI Commands Engine', () => {
  it('generates a rich and compact circuit summary', () => {
    const summary = getCircuitSummary(SAMPLE_DIRECT_START);
    expect(summary.title).toBe(SAMPLE_DIRECT_START.sheet.title);
    expect(summary.components.length).toBe(SAMPLE_DIRECT_START.elements.length);
    expect(summary.wireCount).toBe(SAMPLE_DIRECT_START.wires.length);

    // Verify first component has worldPos for its terminals
    const first = summary.components[0];
    expect(first.terminals.length).toBeGreaterThan(0);
    expect(typeof first.terminals[0].worldPos.x).toBe('number');
  });

  it('resolves terminals by formatted specifier (e.g. -KM1:13)', () => {
    const res = resolveTerminal(SAMPLE_DIRECT_START, '-KM1:13');
    expect(res).not.toBeNull();
    expect(res?.elem.tag).toBe('-KM1');
    expect(res?.termId).toBe('13');
  });

  it('generates an orthogonal Manhattan wire route', () => {
    const route = routeManhattanWire({ x: 100, y: 100 }, { x: 200, y: 250 });
    expect(route.length).toBe(3);
    expect(route[0]).toEqual({ x: 100, y: 100 });
    expect(route[1]).toEqual({ x: 100, y: 250 });
    expect(route[2]).toEqual({ x: 200, y: 250 });
  });

  it('adds a component, connects terminals, and sets PLC code through actions', () => {
    const initialDoc: Doc = {
      app: 'powercad-nextgen',
      version: 1,
      sheet: { ...SAMPLE_DIRECT_START.sheet },
      elements: [],
      wires: [],
    };

    const result = executeCadActions(initialDoc, [
      {
        action: 'add_component',
        def: 'coil_standard',
        x: 100,
        y: 200,
        tag: '-KM1',
      },
      {
        action: 'add_component',
        def: 'pilot_lamp',
        x: 200,
        y: 200,
        tag: '-H1',
      },
      {
        action: 'connect_terminals',
        from: '-KM1:A1',
        to: '-H1:X1',
        kind: 'aux',
      },
      {
        action: 'add_component',
        def: 'plc_arduino_opta',
        x: 300,
        y: 300,
        tag: '-PLC1',
      },
      {
        action: 'set_plc_code',
        idOrTag: '-PLC1',
        code: 'Q1 := I1;',
      },
    ]);

    expect(result.errors).toEqual([]);
    expect(result.successCount).toBe(5);
    expect(result.doc.elements.length).toBe(3);
    expect(result.doc.wires.length).toBe(1);

    const opta = result.doc.elements.find((el) => el.tag === '-PLC1');
    expect(opta?.props.stCode).toBe('Q1 := I1;');
  });

  it('detects DRC issue when a contact has no matching coil', () => {
    const docWithOrphanContact: Doc = {
      app: 'powercad-nextgen',
      version: 1,
      sheet: { ...SAMPLE_DIRECT_START.sheet },
      elements: [
        {
          id: 'c1',
          def: 'contact_no',
          x: 100,
          y: 100,
          rot: 0,
          tag: '-KM99',
          props: {},
        },
      ],
      wires: [],
    };

    const issues = validateDRC(docWithOrphanContact);
    expect(issues.length).toBe(1);
    expect(issues[0]).toContain('-KM99');
  });

  it('correctly handles remove_component with id and replaces power source', () => {
    const actions = [
      {
        action: 'remove_component' as const,
        id: 'src_pwr',
      },
      {
        action: 'add_component' as const,
        def: 'pwr_3p_pe',
        x: 130,
        y: 100,
        tag: 'LINEA',
      },
      {
        action: 'connect_terminals' as const,
        from: 'LINEA:L1',
        to: '-Q1:1',
        kind: 'power',
      },
    ];

    const result = executeCadActions(SAMPLE_DIRECT_START, actions);
    expect(result.errors).toEqual([]);
    expect(result.successCount).toBe(3);

    // Verify src_pwr was removed and pwr_3p_pe was added
    expect(result.doc.elements.find((el) => el.id === 'src_pwr')).toBeUndefined();
    const newSrc = result.doc.elements.find((el) => el.def === 'pwr_3p_pe');
    expect(newSrc).toBeDefined();
    expect(newSrc?.tag).toBe('LINEA');

    // Verify terminal connection between LINEA:L1 and -Q1:1
    const lineL1Term = resolveTerminal(result.doc, 'LINEA:L1');
    const q1Term = resolveTerminal(result.doc, '-Q1:1');
    expect(lineL1Term).not.toBeNull();
    expect(q1Term).not.toBeNull();
  });
});
