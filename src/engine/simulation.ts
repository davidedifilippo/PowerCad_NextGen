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
          const pressed = Boolean(state.elementStates[elem.id] || (elem.tag && activeOutputs[elem.tag]));
          isClosedNO = pressed;
          isClosedNC = !pressed;
        } else if (beh.actuation === 'latching') {
          // If defaultOn was true (like a closed breaker), state true means toggled open
          const toggled = Boolean(
            (state.elementStates[elem.id] ?? (beh.defaultOn ?? false)) ||
              (elem.tag && activeOutputs[elem.tag])
          );
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

    // Inject potentials from sources and active converters
    const netPotentialMap = new Map<string, string>();
    for (const elem of doc.elements) {
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

    // Read potentials for all terminals & nodes
    netPotentials = {};
    for (const pt of allNetworkPoints) {
      const k = ptKey(pt);
      const root = stepDsu.find(k);
      const pot = netPotentialMap.get(root);
      if (pot) netPotentials[k] = pot;
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
      } else if (beh.type === 'contact' && (beh.actuation === 'momentary' || beh.actuation === 'latching')) {
        if (state.elementStates[elem.id] && elem.tag) {
          newActiveOutputs[elem.tag] = true;
        }
      } else if (beh.type === 'thermal') {
        if (state.elementStates[elem.id] && elem.tag) {
          newActiveOutputs[elem.tag] = true;
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
    for (const elem of doc.elements) {
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
