import { describe, it, expect } from 'vitest';
import { SAMPLE_UNDERVOLTAGE_RELEASE } from './undervoltageRelease';
import { validateDRC } from '../ai/cadCommands';
import { stepSimulation, createInitialSimState } from '../engine/simulation';
import { switchPage } from '../utils/pageUtils';

describe('Rilevazione Tensione Bassa (Multi-sheet Project)', () => {
  it('contiene esattamente 2 fogli separati come richiesto dall\'utente', () => {
    expect(SAMPLE_UNDERVOLTAGE_RELEASE.pages).toBeDefined();
    expect(SAMPLE_UNDERVOLTAGE_RELEASE.pages!.length).toBe(2);
    expect(SAMPLE_UNDERVOLTAGE_RELEASE.pages![0].title).toContain('MONOFASE');
    expect(SAMPLE_UNDERVOLTAGE_RELEASE.pages![1].title).toContain('TRIFASE');
  });

  it('supera il Design Rule Check (DRC) con 0 errori sul Foglio 1 (Monofase)', () => {
    const docP1 = {
      ...SAMPLE_UNDERVOLTAGE_RELEASE,
      elements: SAMPLE_UNDERVOLTAGE_RELEASE.pages![0].elements,
      wires: SAMPLE_UNDERVOLTAGE_RELEASE.pages![0].wires,
    };
    const issues = validateDRC(docP1);
    expect(issues).toEqual([]);
  });

  it('supera il Design Rule Check (DRC) con 0 errori sul Foglio 2 (Trifase)', () => {
    const docP2 = {
      ...SAMPLE_UNDERVOLTAGE_RELEASE,
      elements: SAMPLE_UNDERVOLTAGE_RELEASE.pages![1].elements,
      wires: SAMPLE_UNDERVOLTAGE_RELEASE.pages![1].wires,
    };
    const issues = validateDRC(docP2);
    expect(issues).toEqual([]);
  });

  it('simula correttamente lo sgancio di minima tensione monofase sul Foglio 1', () => {
    const docP1 = {
      ...SAMPLE_UNDERVOLTAGE_RELEASE,
      elements: SAMPLE_UNDERVOLTAGE_RELEASE.pages![0].elements,
      wires: SAMPLE_UNDERVOLTAGE_RELEASE.pages![0].wires,
      activePageIndex: 0,
    };

    let state = createInitialSimState();
    state.running = true;
    // Fusibili e salvamotore armati
    state.elementStates['fuse_1'] = true;
    state.elementStates['mcb_1'] = true;

    // Condizione nominale: interruttore di simulazione -S1 chiuso (NC)
    let res = stepSimulation(docP1, state, 0.05);
    expect(res.activeOutputs['-F2']).toBe(true);
    expect(res.activeOutputs['motor_1']).toBe(true);

    // Simulazione caduta di tensione: apertura di -S1
    state = res;
    state.elementStates['sw_1'] = true; // aperto
    res = stepSimulation(docP1, state, 0.05);
    expect(res.activeOutputs['-F2']).toBeFalsy();
    expect(res.activeOutputs['motor_1']).toBeFalsy();
  });

  it('simula correttamente lo sgancio per mancanza di fase trifase sul Foglio 2', () => {
    const docP2 = switchPage(SAMPLE_UNDERVOLTAGE_RELEASE, 1);

    let state = createInitialSimState();
    state.running = true;
    state.elementStates['fuse_2'] = true;
    state.elementStates['mcb_2'] = true;

    // Condizione nominale: tutte e 3 le fasi presenti (-S2, -S3, -S4 chiusi)
    let res = stepSimulation(docP2, state, 0.05);
    expect(res.activeOutputs['-F4']).toBe(true);
    expect(res.activeOutputs['motor_2']).toBe(true);

    // Simulazione mancanza fase L1: apertura di -S2
    state = res;
    state.elementStates['sw_s2'] = true; // aperto
    res = stepSimulation(docP2, state, 0.05);
    expect(res.activeOutputs['-F4']).toBeFalsy();
    expect(res.activeOutputs['motor_2']).toBeFalsy();

    // Ripristino L1 e caduta fase L2: apertura di -S3
    state.elementStates['sw_s2'] = false;
    state.elementStates['sw_s3'] = true;
    res = stepSimulation(docP2, state, 0.05);
    expect(res.activeOutputs['-F4']).toBeFalsy();
    expect(res.activeOutputs['motor_2']).toBeFalsy();
  });
});
