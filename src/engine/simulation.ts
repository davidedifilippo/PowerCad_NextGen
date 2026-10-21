import { Doc, Element, Pt, SheetPage } from '../model/types';
import { PlcMemory, createInitialPlcMemory, runPlcScanCycle } from '../plc/stRuntime';
import { getDocPages, getActivePageIndex } from '../utils/pageUtils';
import { registry } from '../library/registry';
import { localToWorld, ptKey, isPointOnSegment } from '../utils/geometry';

export interface SimFault {
  type: 'ground_fault' | 'short_circuit' | 'rcd_tripped';
  message: string;
  elemId?: string;
  tag?: string;
  timestamp?: number;
}

export interface SimState {
  running: boolean;
  paused: boolean;
  /** Interactive state of elements: pressed buttons, toggled switches, tripped thermals */
  elementStates: Record<string, boolean>;
  /** Which coils / loads / motors are active in the current step */
  activeOutputs: Record<string, boolean>;
  /** Timers progress in seconds for TON coils: tag -> elapsed seconds */
  timerProgress: Record<string, number>;
  /** Net potentials for visualization: point key -> potential name (L, N, PE, +24V, etc.) */
  nodePotentials: Record<string, string>;
  /** Wire IDs that are energized */
  energizedWires: Set<string>;
  stepCount: number;
  /** Active electrical fault if simulation was interrupted (unprotected ground fault or short circuit) */
  fault?: SimFault | null;
  /** Notification alert when a protection tripped (e.g. differential breaker / RCD tripped) */
  faultAlert?: SimFault | null;
  plcMemories?: Record<string, PlcMemory>;
}

export function createInitialSimState(): SimState {
  return {
    running: false,
    paused: false,
    elementStates: {},
    activeOutputs: {},
    timerProgress: {},
    nodePotentials: {},
    energizedWires: new Set(),
    stepCount: 0,
    fault: null,
    faultAlert: null,
    plcMemories: {},
  };
}

/** Union-Find helper for electrical nets */
class DisjointSet {
  private parent = new Map<string, string>();

  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let p = this.parent.get(x)!;
    if (p !== x) {
      p = this.find(p);
      this.parent.set(x, p);
    }
    return p;
  }

  union(a: string, b: string) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA !== rootB) {
      this.parent.set(rootA, rootB);
    }
  }
}

/** Builds conductivity graph for wires and closed component contacts */
function buildConductivityGraph(
  pages: SheetPage[],
  allNetworkPointsByPage: Map<number, Pt[]>,
  elemTermKeys: Map<string, Map<string, string>>,
  activeOutputs: Record<string, boolean>,
  elementStates: Record<string, boolean>,
  ignoredElementIds?: Set<string>,
  isMultiPage: boolean = false
): DisjointSet {
  const dsu = new DisjointSet();

  const getPtKey = (p: Pt, pageIdx: number): string =>
    isMultiPage ? `p${pageIdx}:${p.x},${p.y}` : ptKey(p);

  // Wires and T-junction branching per page
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const pts = allNetworkPointsByPage.get(pIdx) || [];

    for (const wire of page.wires) {
      for (let i = 0; i < wire.pts.length - 1; i++) {
        const p1 = wire.pts[i];
        const p2 = wire.pts[i + 1];
        dsu.union(getPtKey(p1, pIdx), getPtKey(p2, pIdx));

        for (const pt of pts) {
          if (isPointOnSegment(pt, p1, p2)) {
            dsu.union(getPtKey(p1, pIdx), getPtKey(pt, pIdx));
          }
        }
      }
    }

    // Connect terminals through closed contacts / conductors within this page
    for (const elem of page.elements) {
      if (ignoredElementIds?.has(elem.id)) continue;
      const def = registry.get(elem.def);
      if (!def) continue;
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;

      const beh = def.behavior;

      if (beh.type === 'plc') {
        // Internal bus bridges for VIN1-VIN2 and GND1-GND2
        const kVin1 = terms.get('VIN1'), kVin2 = terms.get('VIN2');
        if (kVin1 && kVin2) dsu.union(kVin1, kVin2);
        const kGnd1 = terms.get('GND1'), kGnd2 = terms.get('GND2');
        if (kGnd1 && kGnd2) dsu.union(kGnd1, kGnd2);

        // Relay outputs closed by PLC runtime logic
        beh.relays.forEach((pair, idx) => {
          const qKey = elem.id + '_q' + (idx + 1);
          if (activeOutputs[qKey]) {
            const k1 = terms.get(pair[0]);
            const k2 = terms.get(pair[1]);
            if (k1 && k2) dsu.union(k1, k2);
          }
        });
      }

      if (beh.type === 'conductor') {
        if (elementStates[elem.id] === false) continue;
        for (const [t1, t2] of beh.pairs) {
          const k1 = terms.get(t1);
          const k2 = terms.get(t2);
          if (k1 && k2) dsu.union(k1, k2);
        }
      } else if (beh.type === 'thermal') {
        for (const [t1, t2] of beh.pairs) {
          const k1 = terms.get(t1);
          const k2 = terms.get(t2);
          if (k1 && k2) dsu.union(k1, k2);
        }
      } else if (beh.type === 'contact') {
        let isClosedNO = false;
        let isClosedNC = false;

        if (beh.actuation === 'momentary') {
          const pressed = Boolean(elementStates[elem.id]);
          isClosedNO = pressed;
          isClosedNC = !pressed;
        } else if (beh.actuation === 'latching') {
          const toggled = Boolean(
            elementStates[elem.id] ?? (beh.defaultOn ?? false)
          );
          isClosedNO = toggled;
          isClosedNC = !toggled;
        } else if (beh.actuation === 'linked') {
          const isCoilActive = (elem.tag && Boolean(activeOutputs[elem.tag])) || Boolean(activeOutputs[elem.id]);
          isClosedNO = isCoilActive;
          isClosedNC = !isCoilActive;
        }

        if (beh.ssrReversing) {
          const fwdActive = Boolean(activeOutputs[elem.id + '_fwd']);
          const revActive = Boolean(activeOutputs[elem.id + '_rev']);
          if (fwdActive) {
            const k1 = terms.get('1'), k2 = terms.get('2');
            const k3 = terms.get('3'), k4 = terms.get('4');
            const k5 = terms.get('5'), k6 = terms.get('6');
            if (k1 && k2) dsu.union(k1, k2);
            if (k3 && k4) dsu.union(k3, k4);
            if (k5 && k6) dsu.union(k5, k6);
          } else if (revActive) {
            const k1 = terms.get('1'), k6 = terms.get('6');
            const k3 = terms.get('3'), k4 = terms.get('4');
            const k5 = terms.get('5'), k2 = terms.get('2');
            if (k1 && k6) dsu.union(k1, k6);
            if (k3 && k4) dsu.union(k3, k4);
            if (k5 && k2) dsu.union(k5, k2);
          }
        }

        if (beh.no) {
          for (const [t1, t2] of beh.no) {
            const k1 = terms.get(t1);
            const k2 = terms.get(t2);
            if (k1 && k2 && isClosedNO) dsu.union(k1, k2);
          }
        }
        if (beh.nc) {
          for (const [t1, t2] of beh.nc) {
            const k1 = terms.get(t1);
            const k2 = terms.get(t2);
            if (k1 && k2 && isClosedNC) dsu.union(k1, k2);
          }
        }
      }
    }
  }

  // Cross-page Wire Reference Markers (ref_marker_output and ref_marker_input)
  const refOutputs = new Map<string, string[]>();
  const refInputs = new Map<string, string[]>();

  for (const page of pages) {
    for (const elem of page.elements) {
      if (elem.def === 'ref_marker_output') {
        const refName = String(elem.props?.ref || '').trim();
        const terms = elemTermKeys.get(elem.id);
        const k = terms?.get('1');
        if (refName && k) {
          if (!refOutputs.has(refName)) refOutputs.set(refName, []);
          refOutputs.get(refName)!.push(k);
        }
      } else if (elem.def === 'ref_marker_input') {
        const refName = String(elem.props?.ref || '').trim();
        const terms = elemTermKeys.get(elem.id);
        const k = terms?.get('1');
        if (refName && k) {
          if (!refInputs.has(refName)) refInputs.set(refName, []);
          refInputs.get(refName)!.push(k);
        }
      }
    }
  }

  for (const [refName, outKeys] of refOutputs.entries()) {
    const inKeys = refInputs.get(refName);
    if (!inKeys) continue;
    for (const kOut of outKeys) {
      for (const kIn of inKeys) {
        dsu.union(kOut, kIn);
      }
    }
  }

  return dsu;
}

/**
 * Executes one electrical simulation step (solves circuit potentials, coil activations, timer advances,
 * and detects ground leakage faults / short circuits with automatic differential breaker tripping).
 */
export function stepSimulation(doc: Doc, state: SimState, dtSec: number = 0.05): SimState {
  if (state.fault && (!state.running || state.paused)) {
    return state;
  }

  const pages = getDocPages(doc);
  const isMultiPage = pages.length > 1;
  const activePageIndex = getActivePageIndex(doc);

  const getPtKey = (p: Pt, pageIdx: number): string =>
    isMultiPage ? `p${pageIdx}:${p.x},${p.y}` : ptKey(p);

  // Collect all network points per page
  const allNetworkPointsByPage = new Map<number, Pt[]>();
  for (let i = 0; i < pages.length; i++) allNetworkPointsByPage.set(i, []);

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const pts = allNetworkPointsByPage.get(pIdx)!;
    for (const wire of page.wires) {
      for (const p of wire.pts) pts.push(p);
    }
  }

  // Map elements and their absolute terminal positions across all pages
  const elemTermKeys = new Map<string, Map<string, string>>();
  const allElements: Element[] = [];

  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    const pts = allNetworkPointsByPage.get(pIdx)!;

    for (const elem of page.elements) {
      allElements.push(elem);
      const def = registry.get(elem.def);
      if (!def) continue;
      const termMap = new Map<string, string>();
      for (const term of def.terminals) {
        const world = localToWorld(elem.x, elem.y, term, elem.rot);
        const key = getPtKey(world, pIdx);
        termMap.set(term.id, key);
        pts.push(world);
      }
      elemTermKeys.set(elem.id, termMap);
    }
  }

  // Collect terminal keys for Phase sources, Earth PE, and Neutral
  const phaseTermKeys: string[] = [];
  const peTermKeys: string[] = [];
  const neutralTermKeys: string[] = [];
  const potentialNetKeys = new Map<string, string[]>();

  for (const elem of allElements) {
    const def = registry.get(elem.def);
    if (!def) continue;
    const terms = elemTermKeys.get(elem.id);
    if (!terms) continue;

    if (def.behavior.type === 'source') {
      for (const [termId, pot] of Object.entries(def.behavior.potentials)) {
        const k = terms.get(termId);
        if (!k) continue;
        if (pot === 'L' || pot.startsWith('L') || pot === '+24V') {
          phaseTermKeys.push(k);
        } else if (pot === 'PE') {
          peTermKeys.push(k);
        } else if (pot === 'N') {
          neutralTermKeys.push(k);
        }

        let pGroup = pot;
        if (pot === '+24V' || pot === '+') pGroup = 'DC+';
        else if (pot === '0V' || pot === '-') pGroup = 'DC-';

        if (!potentialNetKeys.has(pGroup)) {
          potentialNetKeys.set(pGroup, []);
        }
        potentialNetKeys.get(pGroup)!.push(k);
      }
    }
  }

  let elementStates = { ...state.elementStates };
  let activeOutputs = { ...state.activeOutputs };
  let faultAlert: SimFault | null = state.faultAlert ?? null;
  let fault: SimFault | null = null;
  let running = state.running;
  let paused = state.paused;

  // Initial connectivity check for ground faults & short circuits
  const checkGraph = buildConductivityGraph(pages, allNetworkPointsByPage, elemTermKeys, activeOutputs, elementStates, undefined, isMultiPage);
  const phaseRoots = new Set(phaseTermKeys.map((k) => checkGraph.find(k)));
  const peRoots = new Set(peTermKeys.map((k) => checkGraph.find(k)));
  const hasDirectGroundFault = [...phaseRoots].some((r) => peRoots.has(r));

  let loadFaultElem: Element | null = null;
  if (!hasDirectGroundFault) {
    for (const elem of allElements) {
      const def = registry.get(elem.def);
      if (!def || def.behavior.type !== 'load') continue;
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;
      const ka = terms.get(def.behavior.a);
      const kb = terms.get(def.behavior.b);
      if (!ka || !kb) continue;
      const rootA = checkGraph.find(ka);
      const rootB = checkGraph.find(kb);
      const aIsPhase = phaseRoots.has(rootA);
      const bIsPhase = phaseRoots.has(rootB);
      const aIsPe = peRoots.has(rootA);
      const bIsPe = peRoots.has(rootB);
      if ((aIsPhase && bIsPe) || (bIsPhase && aIsPe)) {
        loadFaultElem = elem;
        break;
      }
    }
  }

  const isGroundFault = hasDirectGroundFault || Boolean(loadFaultElem);

  if (isGroundFault) {
    // Find all closed RCDs (differenziali)
    const closedRcds = allElements.filter((elem) => {
      const def = registry.get(elem.def);
      if (!def) return false;
      const isRcd = elem.def.startsWith('rcd_') || (def.behavior as any).isRCD === true;
      if (!isRcd) return false;
      return Boolean(elementStates[elem.id] ?? (def.behavior as any).defaultOn ?? false);
    });

    let protectingRcd: Element | null = null;
    for (const rcd of closedRcds) {
      const testGraph = buildConductivityGraph(pages, allNetworkPointsByPage, elemTermKeys, activeOutputs, elementStates, new Set([rcd.id]), isMultiPage);
      const testPhaseRoots = new Set(phaseTermKeys.map((k) => testGraph.find(k)));
      const testPeRoots = new Set(peTermKeys.map((k) => testGraph.find(k)));

      if (hasDirectGroundFault) {
        if (![...testPhaseRoots].some((r) => testPeRoots.has(r))) {
          protectingRcd = rcd;
          break;
        }
      } else if (loadFaultElem) {
        const terms = elemTermKeys.get(loadFaultElem.id);
        if (terms) {
          const def = registry.get(loadFaultElem.def)!;
          const beh = def.behavior as any;
          const ka = terms.get(beh.a);
          const kb = terms.get(beh.b);
          const rootA = ka ? testGraph.find(ka) : null;
          const rootB = kb ? testGraph.find(kb) : null;
          const stillPhase = (rootA && testPhaseRoots.has(rootA)) || (rootB && testPhaseRoots.has(rootB));
          if (!stillPhase) {
            protectingRcd = rcd;
            break;
          }
        }
      }
    }

    if (protectingRcd) {
      // Differential breaker tripped! Open its contacts
      elementStates[protectingRcd.id] = false;
      faultAlert = {
        type: 'rcd_tripped',
        message: `Interruttore differenziale ${protectingRcd.tag || '-F'} scattato per dispersione verso terra!`,
        elemId: protectingRcd.id,
        tag: protectingRcd.tag,
        timestamp: Date.now(),
      };
    } else {
      // Unprotected ground fault -> Halt simulation
      fault = {
        type: 'ground_fault',
        message: 'Dispersione verso terra rilevata! Nessuna protezione differenziale presente: simulazione interrotta per sicurezza.',
        timestamp: Date.now(),
      };
      running = false;
      paused = true;
    }
  }

  // Check short-circuits (Phase-Neutral, Phase-Phase, DC+/-, Converter/Transformer outputs)
  if (!fault && !isGroundFault) {
    const incompatiblePairs: { p1: string; p2: string; desc: string }[] = [
      // Phase-Neutral
      { p1: 'L', p2: 'N', desc: 'Corto circuito Fase-Neutro' },
      { p1: 'L1', p2: 'N', desc: 'Corto circuito Fase L1-Neutro' },
      { p1: 'L2', p2: 'N', desc: 'Corto circuito Fase L2-Neutro' },
      { p1: 'L3', p2: 'N', desc: 'Corto circuito Fase L3-Neutro' },
      // Phase-Phase
      { p1: 'L1', p2: 'L2', desc: 'Corto circuito Fase L1-L2' },
      { p1: 'L2', p2: 'L3', desc: 'Corto circuito Fase L2-L3' },
      { p1: 'L1', p2: 'L3', desc: 'Corto circuito Fase L1-L3' },
      // DC
      { p1: 'DC+', p2: 'DC-', desc: 'Corto circuito DC (+/-)' },
    ];

    const findShortInGraph = (graph: DisjointSet): { desc: string; keysA: string[]; keysB: string[] } | null => {
      // 1. Primary source incompatible pairs
      for (const pair of incompatiblePairs) {
        const keysA = potentialNetKeys.get(pair.p1);
        const keysB = potentialNetKeys.get(pair.p2);
        if (!keysA || !keysB) continue;

        const rootsA = keysA.map((k) => graph.find(k));
        const rootsB = new Set(keysB.map((k) => graph.find(k)));

        if (rootsA.some((r) => rootsB.has(r))) {
          return { desc: pair.desc, keysA, keysB };
        }
      }

      // 2. Converters & Transformers output short-circuits
      for (const elem of allElements) {
        const def = registry.get(elem.def);
        if (!def || def.behavior.type !== 'converter') continue;
        const terms = elemTermKeys.get(elem.id);
        if (!terms) continue;

        const beh = def.behavior;

        // Check if converter input is energized in this graph
        const inputPots: (string | undefined)[] = beh.inputs.map((tid) => {
          const k = terms.get(tid);
          if (!k) return undefined;
          const root = graph.find(k);
          for (const [pot, keys] of potentialNetKeys.entries()) {
            for (const srcKey of keys) {
              if (graph.find(srcKey) === root) return pot;
            }
          }
          // Also check if fed by another active converter (e.g. transformer feeding a power supply)
          for (const other of doc.elements) {
            if (other.id === elem.id) continue;
            const otherDef = registry.get(other.def);
            if (!otherDef || otherDef.behavior.type !== 'converter') continue;
            const otherTerms = elemTermKeys.get(other.id);
            if (!otherTerms) continue;
            for (const [otherTid, otherPot] of Object.entries(otherDef.behavior.outputs)) {
              const otherK = otherTerms.get(otherTid);
              if (otherK && graph.find(otherK) === root) {
                return otherPot;
              }
            }
          }
          return undefined;
        });

        const isEnergized =
          inputPots.length === 2
            ? isVoltageDifference(inputPots[0], inputPots[1])
            : inputPots.length >= 3
            ? Boolean(inputPots[0] && inputPots[1] && inputPots[2] && inputPots[0] !== inputPots[1] && inputPots[1] !== inputPots[2] && inputPots[0] !== inputPots[2])
            : false;

        if (!isEnergized) continue;

        const outEntries = Object.entries(beh.outputs);

        // Check DC (+/-)
        const posEntry = outEntries.find(([_, pot]) => pot === '+24V' || pot === '+' || pot === 'DC+');
        const negEntry = outEntries.find(([_, pot]) => pot === '0V' || pot === '-' || pot === 'DC-');
        if (posEntry && negEntry) {
          const kPos = terms.get(posEntry[0]);
          const kNeg = terms.get(negEntry[0]);
          if (kPos && kNeg && graph.find(kPos) === graph.find(kNeg)) {
            return {
              desc: `Corto circuito DC (+/-) sull'uscita di ${elem.tag || def.name}`,
              keysA: [kPos],
              keysB: [kNeg],
            };
          }
        }

        // Check Single-Phase AC (L and N)
        const lEntry = outEntries.find(([_, pot]) => pot === 'L');
        const nEntry = outEntries.find(([_, pot]) => pot === 'N');
        if (lEntry && nEntry) {
          const kL = terms.get(lEntry[0]);
          const kN = terms.get(nEntry[0]);
          if (kL && kN && graph.find(kL) === graph.find(kN)) {
            return {
              desc: `Corto circuito secondario Fase-Neutro sull'uscita di ${elem.tag || def.name}`,
              keysA: [kL],
              keysB: [kN],
            };
          }
        }

        // Check Three-Phase AC (L1, L2, L3)
        const l1Entry = outEntries.find(([_, pot]) => pot === 'L1');
        const l2Entry = outEntries.find(([_, pot]) => pot === 'L2');
        const l3Entry = outEntries.find(([_, pot]) => pot === 'L3');
        if (l1Entry && l2Entry && l3Entry) {
          const k1 = terms.get(l1Entry[0]);
          const k2 = terms.get(l2Entry[0]);
          const k3 = terms.get(l3Entry[0]);
          if (k1 && k2 && graph.find(k1) === graph.find(k2)) {
            return {
              desc: `Corto circuito secondario L1-L2 sull'uscita di ${elem.tag || def.name}`,
              keysA: [k1],
              keysB: [k2],
            };
          }
          if (k2 && k3 && graph.find(k2) === graph.find(k3)) {
            return {
              desc: `Corto circuito secondario L2-L3 sull'uscita di ${elem.tag || def.name}`,
              keysA: [k2],
              keysB: [k3],
            };
          }
          if (k1 && k3 && graph.find(k1) === graph.find(k3)) {
            return {
              desc: `Corto circuito secondario L1-L3 sull'uscita di ${elem.tag || def.name}`,
              keysA: [k1],
              keysB: [k3],
            };
          }
        }
      }

      return null;
    };

    const detectedShort = findShortInGraph(checkGraph);

    if (detectedShort) {
      const closedProtections = allElements.filter((elem) => {
        const def = registry.get(elem.def);
        if (!def) return false;
        const isProtection =
          elem.def.startsWith('fuse_') ||
          elem.def.startsWith('mcb_') ||
          elem.def.startsWith('disconnector_') ||
          elem.def.startsWith('rcd_') ||
          (def.behavior as any).isRCD === true;
        if (!isProtection) return false;
        const isClosed = elem.def.startsWith('fuse_')
          ? elementStates[elem.id] !== false
          : Boolean(elementStates[elem.id] ?? (def.behavior as any).defaultOn ?? false);
        return isClosed;
      });

      let protectingDevice: Element | null = null;
      for (const dev of closedProtections) {
        const testGraph = buildConductivityGraph(pages, allNetworkPointsByPage, elemTermKeys, activeOutputs, elementStates, new Set([dev.id]), isMultiPage);
        const remainingShort = findShortInGraph(testGraph);
        if (!remainingShort) {
          protectingDevice = dev;
          break;
        }
      }

      if (protectingDevice) {
        elementStates[protectingDevice.id] = false;
        const isFuse = protectingDevice.def.startsWith('fuse_');
        const isRcd =
          protectingDevice.def.startsWith('rcd_') ||
          (registry.get(protectingDevice.def)?.behavior as any)?.isRCD === true;
        const deviceName = isFuse ? 'Fusibile' : isRcd ? 'Interruttore differenziale' : 'Interruttore';
        faultAlert = {
          type: 'short_circuit',
          message: `${deviceName} ${protectingDevice.tag || '-F'} scattato per ${detectedShort.desc.toLowerCase()}!`,
          elemId: protectingDevice.id,
          tag: protectingDevice.tag,
          timestamp: Date.now(),
        };
      } else {
        fault = {
          type: 'short_circuit',
          message: `${detectedShort.desc} rilevato! Nessuna protezione presente: simulazione interrotta per sicurezza.`,
          timestamp: Date.now(),
        };
        running = false;
        paused = true;
      }
    }
  }

  if (fault) {
    return {
      ...state,
      running: false,
      paused: true,
      elementStates,
      fault,
      faultAlert: null,
      stepCount: state.stepCount + 1,
    };
  }

  // Multi-pass relaxation to handle feedback loops (e.g. self-holding contactors / autoritenuta)
  const timerProgress = { ...state.timerProgress };
  let netPotentials: Record<string, string> = {};

  const MAX_ITERATIONS = 5;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Re-create conductivity graph for this iteration
    const stepDsu = buildConductivityGraph(pages, allNetworkPointsByPage, elemTermKeys, activeOutputs, elementStates, undefined, isMultiPage);

    // Inject potentials from sources and active converters
    const netPotentialMap = new Map<string, string>();
    for (const elem of allElements) {
      const def = registry.get(elem.def);
      if (!def) continue;
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;

      if (def.behavior.type === 'source') {
        for (const [termId, pot] of Object.entries(def.behavior.potentials)) {
          const k = terms.get(termId);
          if (k) {
            const root = stepDsu.find(k);
            netPotentialMap.set(root, pot);
          }
        }
      } else if (def.behavior.type === 'converter' && activeOutputs[elem.id]) {
        for (const [termId, pot] of Object.entries(def.behavior.outputs)) {
          const k = terms.get(termId);
          if (k) {
            const root = stepDsu.find(k);
            netPotentialMap.set(root, pot);
          }
        }
      } else if (def.behavior.type === 'logic') {
        const isLogicActive =
          def.behavior.op === 'input'
            ? Boolean(state.elementStates[elem.id])
            : Boolean(activeOutputs[elem.id]);
        if (isLogicActive && def.behavior.outputs) {
          for (const termId of def.behavior.outputs) {
            const k = terms.get(termId);
            if (k) {
              const root = stepDsu.find(k);
              netPotentialMap.set(root, '+24V');
            }
          }
        }
      }
    }

    // Ensure PE wires get potential 'PE' even without a pwr_pe source
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const page = pages[pIdx];
      for (const wire of page.wires) {
        if (wire.kind === 'pe' && wire.pts.length > 0) {
          const root = stepDsu.find(getPtKey(wire.pts[0], pIdx));
          if (!netPotentialMap.has(root)) {
            netPotentialMap.set(root, 'PE');
          }
        }
      }
    }

    // Read potentials for all terminals & nodes
    netPotentials = {};
    for (let pIdx = 0; pIdx < pages.length; pIdx++) {
      const pts = allNetworkPointsByPage.get(pIdx) || [];
      for (const pt of pts) {
        const k = getPtKey(pt, pIdx);
        const root = stepDsu.find(k);
        const pot = netPotentialMap.get(root);
        if (pot) netPotentials[k] = pot;
      }
    }

    // Now evaluate loads and coils
    const newActiveOutputs: Record<string, boolean> = {};

    for (const elem of allElements) {
      const def = registry.get(elem.def);
      if (!def) continue;
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;

      const beh = def.behavior;

      if (beh.type === 'coil') {
        const ka = terms.get(beh.a);
        const kb = terms.get(beh.b);
        const potA = ka ? netPotentials[ka] : undefined;
        const potB = kb ? netPotentials[kb] : undefined;

        // Coil is energized if there is potential difference between A and B
        const energized = isVoltageDifference(potA, potB);

        if (beh.mode === 'mono') {
          if (energized) {
            newActiveOutputs[elem.id] = true;
            if (elem.tag) newActiveOutputs[elem.tag] = true;
          }
        } else if (beh.mode === 'ton') {
          const delaySec = Number(elem.props?.delay ?? 3);
          if (energized) {
            const current = (timerProgress[elem.tag] ?? 0) + (iter === 0 ? dtSec : 0);
            timerProgress[elem.tag] = current;
            if (current >= delaySec) {
              newActiveOutputs[elem.tag] = true;
            }
          } else {
            timerProgress[elem.tag] = 0;
          }
        } else if (beh.mode === 'tof') {
          const delaySec = Number(elem.props?.delay ?? 3);
          if (energized) {
            newActiveOutputs[elem.tag] = true;
            timerProgress[elem.tag] = delaySec;
          } else {
            const current = (timerProgress[elem.tag] ?? 0) - (iter === 0 ? dtSec : 0);
            if (current > 0) {
              timerProgress[elem.tag] = current;
              newActiveOutputs[elem.tag] = true;
            } else {
              timerProgress[elem.tag] = 0;
            }
          }
        } else if (beh.mode === 'blink') {
          const delaySec = Number(elem.props?.delay ?? 1);
          if (energized) {
            const current = ((timerProgress[elem.tag] ?? 0) + (iter === 0 ? dtSec : 0)) % (delaySec * 2);
            timerProgress[elem.tag] = current;
            if (current < delaySec) {
              newActiveOutputs[elem.tag] = true;
            }
          } else {
            timerProgress[elem.tag] = 0;
          }
        } else if (beh.mode === 'latch') {
          const kb1 = terms.get('B1');
          const potB1 = kb1 ? netPotentials[kb1] : undefined;
          const setEnergized = isVoltageDifference(potA, potB);
          const resetEnergized = isVoltageDifference(potB1, potB);

          const currentLatched = state.elementStates[elem.id] ?? false;
          let nextLatched = currentLatched;
          if (setEnergized) nextLatched = true;
          if (resetEnergized) nextLatched = false;

          state.elementStates[elem.id] = nextLatched;
          if (nextLatched) newActiveOutputs[elem.tag] = true;
        }
      } else if (beh.type === 'load') {
        const ka = terms.get(beh.a);
        const kb = terms.get(beh.b);
        const potA = ka ? netPotentials[ka] : undefined;
        const potB = kb ? netPotentials[kb] : undefined;
        if (isVoltageDifference(potA, potB)) {
          if (beh.kind === 'lamp_flasher') {
            const period = Number(elem.props?.period ?? 1);
            const current = ((timerProgress[elem.id] ?? 0) + (iter === 0 ? dtSec : 0)) % (period * 2);
            timerProgress[elem.id] = current;
            if (current < period) {
              newActiveOutputs[elem.id] = true;
            }
          } else {
            newActiveOutputs[elem.id] = true;
            if (elem.tag) newActiveOutputs[elem.tag] = true;
          }
        } else {
          if (beh.kind === 'lamp_flasher') {
            timerProgress[elem.id] = 0;
          }
        }
      } else if (beh.type === 'motor3') {
        const ku = terms.get(beh.u);
        const kv = terms.get(beh.v);
        const kw = terms.get(beh.w);
        const pU = ku ? netPotentials[ku] : undefined;
        const pV = kv ? netPotentials[kv] : undefined;
        const pW = kw ? netPotentials[kw] : undefined;
        // Running if all 3 distinct phases are present
        if (pU && pV && pW && pU !== pV && pV !== pW && pU !== pW) {
          newActiveOutputs[elem.id] = true;
        }
      } else if (beh.type === 'motor3yd') {
        const pU1 = terms.get(beh.u1) ? netPotentials[terms.get(beh.u1)!] : undefined;
        const pV1 = terms.get(beh.v1) ? netPotentials[terms.get(beh.v1)!] : undefined;
        const pW1 = terms.get(beh.w1) ? netPotentials[terms.get(beh.w1)!] : undefined;
        const pU2 = terms.get(beh.u2) ? netPotentials[terms.get(beh.u2)!] : undefined;
        const pV2 = terms.get(beh.v2) ? netPotentials[terms.get(beh.v2)!] : undefined;
        const pW2 = terms.get(beh.w2) ? netPotentials[terms.get(beh.w2)!] : undefined;
        const has1 = Boolean(pU1 && pV1 && pW1 && pU1 !== pV1 && pV1 !== pW1 && pU1 !== pW1);
        const has2 = Boolean(pU2 && pV2 && pW2 && pU2 !== pV2 && pV2 !== pW2 && pU2 !== pW2);
        if (has1 || has2) {
          newActiveOutputs[elem.id] = true;
        }
      } else if (beh.type === 'contact') {
        if ((beh.actuation === 'momentary' || beh.actuation === 'latching') && state.elementStates[elem.id] && elem.tag) {
          newActiveOutputs[elem.tag] = true;
        }
        if (beh.coil) {
          const ka = terms.get(beh.coil.a);
          const kb = terms.get(beh.coil.b);
          const potA = ka ? netPotentials[ka] : undefined;
          const potB = kb ? netPotentials[kb] : undefined;
          if (isVoltageDifference(potA, potB)) {
            newActiveOutputs[elem.id] = true;
            if (elem.tag) newActiveOutputs[elem.tag] = true;
          }
        }
        if (beh.ssrReversing) {
          const kA1 = terms.get('A1');
          const kA2 = terms.get('A2');
          const kA3 = terms.get('A3');
          const pA1 = kA1 ? netPotentials[kA1] : undefined;
          const pA2 = kA2 ? netPotentials[kA2] : undefined;
          const pA3 = kA3 ? netPotentials[kA3] : undefined;
          const fwd = isVoltageDifference(pA1, pA2);
          const rev = isVoltageDifference(pA3, pA2);
          if (fwd) {
            newActiveOutputs[elem.id + '_fwd'] = true;
            newActiveOutputs[elem.id] = true;
            if (elem.tag) newActiveOutputs[elem.tag] = true;
          }
          if (rev) {
            newActiveOutputs[elem.id + '_rev'] = true;
            newActiveOutputs[elem.id] = true;
            if (elem.tag) newActiveOutputs[elem.tag] = true;
          }
        }
        if (beh.phaseLoss) {
          const k1 = terms.get(beh.phaseLoss.l1);
          const k2 = terms.get(beh.phaseLoss.l2);
          const k3 = terms.get(beh.phaseLoss.l3);
          const p1 = k1 ? netPotentials[k1] : undefined;
          const p2 = k2 ? netPotentials[k2] : undefined;
          const p3 = k3 ? netPotentials[k3] : undefined;
          let healthy = Boolean(p1 && p2 && p3 && p1 !== p2 && p2 !== p3 && p1 !== p3);
          if (beh.phaseLoss.n) {
            const kn = terms.get(beh.phaseLoss.n);
            const pn = kn ? netPotentials[kn] : undefined;
            if (!pn || pn !== 'N') healthy = false;
          }
          if (healthy) {
            newActiveOutputs[elem.id] = true;
            if (elem.tag) newActiveOutputs[elem.tag] = true;
          }
        }
      } else if (beh.type === 'thermal') {
        if ((state.elementStates[elem.id] || state.activeOutputs[elem.tag] || activeOutputs[elem.tag]) && elem.tag) {
          newActiveOutputs[elem.tag] = true;
        }
      } else if (beh.type === 'plc') {
        // Verify 12/24V DC power supply on VIN and GND
        const vinTerms = beh.vin.map((tid) => terms.get(tid)).filter(Boolean) as string[];
        const gndTerms = beh.gnd.map((tid) => terms.get(tid)).filter(Boolean) as string[];
        const vinPots = vinTerms.map((k) => netPotentials[k]).filter(Boolean);
        const gndPots = gndTerms.map((k) => netPotentials[k]).filter(Boolean);

        let isPowered = false;
        for (const vp of vinPots) {
          for (const gp of gndPots) {
            if (isVoltageDifference(vp, gp)) {
              isPowered = true;
              break;
            }
          }
          if (isPowered) break;
          // Fallback if connected to +24V rail
          if (vp === '+24V' || vp === '+') {
            isPowered = true;
            break;
          }
        }

        if (isPowered) {
          newActiveOutputs[elem.id] = true;
          newActiveOutputs[elem.id + '_pwr'] = true;
          newActiveOutputs[elem.id + '_run'] = true;
          if (elem.tag) newActiveOutputs[elem.tag] = true;

          // Read digital and analog input terminals
          const inputs: Record<string, boolean | number> = {};
          beh.inputs.forEach((inId) => {
            const tk = terms.get(inId);
            const p = tk ? netPotentials[tk] : undefined;
            const isHigh = Boolean(p && (p.startsWith('L') || p === '+24V' || p === '+' || p === '1'));
            inputs[inId] = isHigh;
            if (isHigh) {
              newActiveOutputs[elem.id + '_' + inId.toLowerCase()] = true;
            }
          });

          // Fetch or initialize PLC memory
          const curMem = state.plcMemories?.[elem.id] || createInitialPlcMemory();
          const code = String(elem.props?.stCode || beh.defaultProgram || '');
          const result = runPlcScanCycle(code, inputs, curMem, dtSec);
          if (state.plcMemories) {
            state.plcMemories[elem.id] = result.memory;
          }

          // Drive relay contacts Q1..Q4 based on PLC outputs
          beh.relays.forEach((_, idx) => {
            const qName = 'Q' + (idx + 1);
            if (result.outputs[qName]) {
              newActiveOutputs[elem.id + '_q' + (idx + 1)] = true;
            }
          });
        }
      } else if (beh.type === 'converter') {
        const inputPots = beh.inputs.map((tid) => {
          const k = terms.get(tid);
          return k ? netPotentials[k] : undefined;
        });
        let isEnergized = false;
        if (inputPots.length === 2) {
          isEnergized = isVoltageDifference(inputPots[0], inputPots[1]);
        } else if (inputPots.length >= 3) {
          const [p1, p2, p3] = inputPots;
          isEnergized = Boolean(p1 && p2 && p3 && p1 !== p2 && p2 !== p3 && p1 !== p3);
        }
        if (isEnergized) {
          newActiveOutputs[elem.id] = true;
        }
      } else if (beh.type === 'logic') {
        const isHigh = (tid: string) => {
          const k = terms.get(tid);
          const pot = k ? netPotentials[k] : undefined;
          return Boolean(pot && (pot.startsWith('L') || pot === '+24V'));
        };
        const ins = beh.inputs ?? [];
        let outHigh = false;
        switch (beh.op) {
          case 'input':
            outHigh = Boolean(state.elementStates[elem.id]);
            break;
          case 'output':
          case 'display':
          case 'or':
          case 'tff':
          case 'counter':
          case 'decoder':
            outHigh = ins.some(isHigh);
            break;
          case 'and':
            outHigh = ins.length > 0 && ins.every(isHigh);
            break;
          case 'not':
            outHigh = ins.length > 0 && !isHigh(ins[0]);
            break;
          case 'xor':
            outHigh = ins.filter(isHigh).length % 2 === 1;
            break;
          case 'nand':
            outHigh = !(ins.length > 0 && ins.every(isHigh));
            break;
          case 'nor':
            outHigh = !ins.some(isHigh);
            break;
          case 'sr': {
            const setH = ins[0] ? isHigh(ins[0]) : false;
            const rstH = ins[1] ? isHigh(ins[1]) : false;
            let latched = state.elementStates[elem.id] ?? false;
            if (setH) latched = true;
            if (rstH) latched = false;
            state.elementStates[elem.id] = latched;
            outHigh = latched;
            break;
          }
          case 'ton': {
            const delaySec = Number(elem.props?.delay ?? 2);
            if (ins[0] && isHigh(ins[0])) {
              const cur = (timerProgress[elem.id] ?? 0) + (iter === 0 ? dtSec : 0);
              timerProgress[elem.id] = cur;
              outHigh = cur >= delaySec;
            } else {
              timerProgress[elem.id] = 0;
            }
            break;
          }
          case 'tof': {
            const delaySec = Number(elem.props?.delay ?? 2);
            if (ins[0] && isHigh(ins[0])) {
              timerProgress[elem.id] = delaySec;
              outHigh = true;
            } else {
              const cur = (timerProgress[elem.id] ?? 0) - (iter === 0 ? dtSec : 0);
              if (cur > 0) {
                timerProgress[elem.id] = cur;
                outHigh = true;
              } else {
                timerProgress[elem.id] = 0;
              }
            }
            break;
          }
          case 'pulse':
          case 'blink': {
            const delaySec = Number(elem.props?.delay ?? 0.8);
            if (ins[0] && isHigh(ins[0])) {
              const cur = ((timerProgress[elem.id] ?? 0) + (iter === 0 ? dtSec : 0)) % (delaySec * 2);
              timerProgress[elem.id] = cur;
              outHigh = cur < delaySec;
            } else {
              timerProgress[elem.id] = 0;
            }
            break;
          }
        }
        if (outHigh) {
          newActiveOutputs[elem.id] = true;
          if (elem.tag) newActiveOutputs[elem.tag] = true;
        }
      }
    }

    // Second pass in iteration: evaluate electro-pneumatic actuators (driven by -M solenoid coils and driving -B sensors)
    for (const elem of allElements) {
      const def = registry.get(elem.def);
      if (!def || def.behavior.type !== 'pneumatic') continue;
      const beh = def.behavior;

      const solA = String(elem.props?.solenoidA ?? beh.defaultSolenoidA ?? '').trim();
      const solB = String(elem.props?.solenoidB ?? beh.defaultSolenoidB ?? '').trim();
      const sensA = String(elem.props?.sensorA ?? beh.defaultSensorRetracted ?? '').trim();
      const sensB = String(elem.props?.sensorB ?? beh.defaultSensorExtended ?? '').trim();
      const valveMode = String(elem.props?.valveMode ?? 'bistable');

      const isSolAEnergized = Boolean(solA && (newActiveOutputs[solA] || activeOutputs[solA]));
      const isSolBEnergized = Boolean(solB && (newActiveOutputs[solB] || activeOutputs[solB]));

      let isActuated = Boolean(state.elementStates[elem.id]);
      if (valveMode === 'monostable') {
        if (isSolAEnergized) {
          isActuated = true;
        } else if (state.elementStates[elem.id] === undefined) {
          isActuated = false;
        }
      } else {
        if (isSolAEnergized && !isSolBEnergized) {
          isActuated = true;
          state.elementStates[elem.id] = true;
        } else if (isSolBEnergized && !isSolAEnergized) {
          isActuated = false;
          state.elementStates[elem.id] = false;
        }
      }

      if (isActuated) {
        newActiveOutputs[elem.id] = true;
        if (elem.tag) newActiveOutputs[elem.tag] = true;
        if (sensB) newActiveOutputs[sensB] = true;
      } else {
        if (sensA) newActiveOutputs[sensA] = true;
      }
    }

    activeOutputs = newActiveOutputs;
  }

  // Determine energized wires for visual feedback across all pages
  const energizedWires = new Set<string>();
  for (let pIdx = 0; pIdx < pages.length; pIdx++) {
    const page = pages[pIdx];
    for (const wire of page.wires) {
      for (const p of wire.pts) {
        const key = getPtKey(p, pIdx);
        const pot = netPotentials[key];
        if (pot && (pot.startsWith('L') || pot === '+24V' || pot === '+')) {
          energizedWires.add(wire.id);
          break;
        }
      }
    }
  }

  // Populate active page potentials with simple ptKey for renderer compatibility
  if (isMultiPage) {
    const activePage = pages[activePageIndex];
    if (activePage) {
      for (const wire of activePage.wires) {
        for (const p of wire.pts) {
          const fullKey = `p${activePageIndex}:${p.x},${p.y}`;
          if (netPotentials[fullKey]) {
            netPotentials[ptKey(p)] = netPotentials[fullKey];
          }
        }
      }
      for (const elem of activePage.elements) {
        const def = registry.get(elem.def);
        if (!def) continue;
        for (const term of def.terminals) {
          const world = localToWorld(elem.x, elem.y, term, elem.rot);
          const fullKey = `p${activePageIndex}:${world.x},${world.y}`;
          if (netPotentials[fullKey]) {
            netPotentials[ptKey(world)] = netPotentials[fullKey];
          }
        }
      }
    }
  }

  return {
    ...state,
    running,
    paused,
    elementStates,
    activeOutputs,
    timerProgress,
    nodePotentials: netPotentials,
    energizedWires,
    fault: null,
    faultAlert,
    stepCount: state.stepCount + 1,
  };
}

/** Check if two potentials provide valid voltage difference (e.g. L vs N, L vs PE, or +24V vs 0V) */
function isVoltageDifference(p1?: string, p2?: string): boolean {
  if (!p1 || !p2 || p1 === p2) return false;
  // AC Phase vs Neutral or Protective Earth (PE)
  if (
    (p1.startsWith('L') && (p2 === 'N' || p2 === 'PE' || p2.startsWith('L'))) ||
    (p2.startsWith('L') && (p1 === 'N' || p1 === 'PE' || p1.startsWith('L')))
  ) {
    return true;
  }
  // DC + vs -
  if ((p1 === '+24V' && p2 === '0V') || (p1 === '0V' && p2 === '+24V')) {
    return true;
  }
  return false;
}
