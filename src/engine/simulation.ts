import { Doc } from '../model/types';
import { registry } from '../library/registry';
import { localToWorld, ptKey, isPointOnSegment } from '../utils/geometry';
import { Pt } from '../model/types';

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

/**
 * Executes one electrical simulation step (solves circuit potentials, coil activations, and timer advances).
 */
export function stepSimulation(doc: Doc, state: SimState, dtSec: number = 0.05): SimState {
  // Collect all network points (all wire vertices and all absolute terminal positions)
  const allNetworkPoints: Pt[] = [];
  for (const wire of doc.wires) {
    for (const p of wire.pts) allNetworkPoints.push(p);
  }

  // Map elements and their absolute terminal positions
  const elemTermKeys = new Map<string, Map<string, string>>();
  for (const elem of doc.elements) {
    const def = registry.get(elem.def);
    if (!def) continue;
    const termMap = new Map<string, string>();
    for (const term of def.terminals) {
      const world = localToWorld(elem.x, elem.y, term, elem.rot);
      const key = ptKey(world);
      termMap.set(term.id, key);
      allNetworkPoints.push(world);
    }
    elemTermKeys.set(elem.id, termMap);
  }

  // Multi-pass relaxation to handle feedback loops (e.g. self-holding contactors / autoritenuta)
  let activeOutputs = { ...state.activeOutputs };
  const timerProgress = { ...state.timerProgress };
  let netPotentials: Record<string, string> = {};

  const MAX_ITERATIONS = 5;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Re-create conductivity graph for this iteration
    const stepDsu = new DisjointSet();

    // Re-apply wires with T-junction branching support
    for (const wire of doc.wires) {
      for (let i = 0; i < wire.pts.length - 1; i++) {
        const p1 = wire.pts[i];
        const p2 = wire.pts[i + 1];
        stepDsu.union(ptKey(p1), ptKey(p2));

        // Connect any network point (other wire endpoint or terminal) that touches this segment
        for (const pt of allNetworkPoints) {
          if (isPointOnSegment(pt, p1, p2)) {
            stepDsu.union(ptKey(p1), ptKey(pt));
          }
        }
      }
    }

    // Connect terminals through closed contacts / conductors
    for (const elem of doc.elements) {
      const def = registry.get(elem.def);
      if (!def) continue;
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;

      const beh = def.behavior;

      if (beh.type === 'conductor') {
        for (const [t1, t2] of beh.pairs) {
          const k1 = terms.get(t1);
          const k2 = terms.get(t2);
          if (k1 && k2) stepDsu.union(k1, k2);
        }
      } else if (beh.type === 'thermal') {
        // Power poles conduct
        for (const [t1, t2] of beh.pairs) {
          const k1 = terms.get(t1);
          const k2 = terms.get(t2);
          if (k1 && k2) stepDsu.union(k1, k2);
        }
      } else if (beh.type === 'contact') {
        let isClosedNO = false;
        let isClosedNC = false;

        if (beh.actuation === 'momentary') {
          const pressed = state.elementStates[elem.id] ?? false;
          isClosedNO = pressed;
          isClosedNC = !pressed;
        } else if (beh.actuation === 'latching') {
          // If defaultOn was true (like a closed breaker), state true means toggled open
          const toggled = state.elementStates[elem.id] ?? (beh.defaultOn ?? false);
          isClosedNO = toggled;
          isClosedNC = !toggled;
        } else if (beh.actuation === 'linked') {
          // Driven by coil or thermal relay with matching tag
          const isCoilActive = activeOutputs[elem.tag] ?? false;
          isClosedNO = isCoilActive;
          isClosedNC = !isCoilActive;
        }

        if (beh.no) {
          for (const [t1, t2] of beh.no) {
            const k1 = terms.get(t1);
            const k2 = terms.get(t2);
            if (k1 && k2 && isClosedNO) stepDsu.union(k1, k2);
          }
        }
        if (beh.nc) {
          for (const [t1, t2] of beh.nc) {
            const k1 = terms.get(t1);
            const k2 = terms.get(t2);
            if (k1 && k2 && isClosedNC) stepDsu.union(k1, k2);
          }
        }
      }
    }

    // Inject potentials from sources
    const netPotentialMap = new Map<string, string>();
    for (const elem of doc.elements) {
      const def = registry.get(elem.def);
      if (!def || def.behavior.type !== 'source') continue;
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;

      for (const [termId, pot] of Object.entries(def.behavior.potentials)) {
        const k = terms.get(termId);
        if (k) {
          const root = stepDsu.find(k);
          netPotentialMap.set(root, pot);
        }
      }
    }

    // Read potentials for all terminals & nodes
    netPotentials = {};
    for (const elem of doc.elements) {
      const terms = elemTermKeys.get(elem.id);
      if (!terms) continue;
      for (const [_, k] of terms.entries()) {
        const root = stepDsu.find(k);
        const pot = netPotentialMap.get(root);
        if (pot) netPotentials[k] = pot;
      }
    }

    // Now evaluate loads and coils
    const newActiveOutputs: Record<string, boolean> = {};

    for (const elem of doc.elements) {
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
          if (energized) newActiveOutputs[elem.tag] = true;
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
        }
      } else if (beh.type === 'load') {
        const ka = terms.get(beh.a);
        const kb = terms.get(beh.b);
        const potA = ka ? netPotentials[ka] : undefined;
        const potB = kb ? netPotentials[kb] : undefined;
        if (isVoltageDifference(potA, potB)) {
          newActiveOutputs[elem.id] = true;
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
      }
    }

    activeOutputs = newActiveOutputs;
  }

  // Determine energized wires for visual feedback (highlight live phase/positive wires in red)
  const energizedWires = new Set<string>();
  for (const wire of doc.wires) {
    for (const p of wire.pts) {
      const key = ptKey(p);
      const pot = netPotentials[key];
      if (pot && (pot.startsWith('L') || pot === '+24V')) {
        energizedWires.add(wire.id);
        break;
      }
    }
  }

  return {
    ...state,
    activeOutputs,
    timerProgress,
    nodePotentials: netPotentials,
    energizedWires,
    stepCount: state.stepCount + 1,
  };
}

/** Check if two potentials provide valid voltage difference (e.g. L vs N, or +24V vs 0V) */
function isVoltageDifference(p1?: string, p2?: string): boolean {
  if (!p1 || !p2 || p1 === p2) return false;
  // AC Phase vs Neutral
  if (
    (p1.startsWith('L') && (p2 === 'N' || p2.startsWith('L'))) ||
    (p2.startsWith('L') && (p1 === 'N' || p1.startsWith('L')))
  ) {
    return true;
  }
  // DC + vs -
  if ((p1 === '+24V' && p2 === '0V') || (p1 === '0V' && p2 === '+24V')) {
    return true;
  }
  return false;
}
