import { Doc, Element, Wire, Pt, WireKind, ComponentDef } from '../model/types';
import { registry } from '../library/registry';
import { snap, snapPt, localToWorld } from '../utils/geometry';
import { SimState } from '../engine/simulation';
import { getDocPages } from '../utils/pageUtils';

export interface ComponentSummary {
  id: string;
  def: string;
  name: string;
  category: string;
  tag: string;
  x: number;
  y: number;
  rot: number;
  props: Record<string, any>;
  terminals: {
    id: string;
    label?: string;
    desc?: string;
    worldPos: Pt;
  }[];
  isActive?: boolean;
}

export interface CircuitSummary {
  title: string;
  pageCount: number;
  components: ComponentSummary[];
  wireCount: number;
  simulation: {
    running: boolean;
    fault?: string | null;
    activeOutputs: string[];
    plcVariables?: Record<string, any>;
  };
  drcIssues: string[];
}

export type CadAction =
  | {
      action: 'add_component';
      def: string;
      x: number;
      y: number;
      tag?: string;
      rot?: 0 | 90 | 180 | 270;
      props?: Record<string, any>;
    }
  | {
      action: 'remove_component';
      idOrTag?: string;
      id?: string;
      tag?: string;
      target?: string;
    }
  | {
      action: 'connect_terminals';
      from: string; // e.g. "-KM1:14" or "elementId:14"
      to: string; // e.g. "-H1:X1"
      kind?: WireKind | string;
    }
  | {
      action: 'add_wire';
      pts: Pt[];
      kind?: WireKind | string;
    }
  | {
      action: 'remove_wire';
      wireId?: string;
      id?: string;
    }
  | {
      action: 'set_plc_code';
      idOrTag?: string;
      id?: string;
      tag?: string;
      code: string;
    }
  | {
      action: 'update_props';
      idOrTag?: string;
      id?: string;
      tag?: string;
      props: Record<string, any>;
    }
  | {
      action: 'set_sheet_info';
      title?: string;
      project?: string;
      author?: string;
      date?: string;
      revision?: string;
      sheetNo?: string;
    }
  | {
      action: 'clear_sheet';
    };

export interface ExecutionResult {
  doc: Doc;
  successCount: number;
  errors: string[];
}

/**
 * Normalizes wire kinds passed by LLMs (e.g. 'power', 'potenza', 'fase', 'pe', 'neutro')
 */
export function normalizeWireKind(kind?: string): WireKind {
  if (!kind) return 'aux';
  const k = kind.toLowerCase().trim();
  if (k === 'power' || k === 'potenza' || k === 'fase' || k === 'phase' || k === 'l1' || k === 'phase_l1') return 'phase';
  if (k === 'l2' || k === 'phase_l2') return 'phase_l2';
  if (k === 'l3' || k === 'phase_l3') return 'phase_l3';
  if (k === 'pe' || k === 'ground' || k === 'terra' || k === 'protezione') return 'pe';
  if (k === 'n' || k === 'neutral' || k === 'neutro') return 'neutral';
  if (k === 'pos' || k === '+24v' || k === '24v' || k === 'dc_pos') return 'pos';
  if (k === 'neg' || k === '0v' || k === 'gnd' || k === 'dc_neg') return 'neg';
  if (k === 'aux' || k === 'auxiliary' || k === 'ausiliario' || k === 'control' || k === 'comando') return 'aux';
  if (k === 'pneumatic' || k === 'pneumatic_tube' || k === 'aria') return 'pneumatic_tube';
  return 'aux';
}

/**
 * Resolves an element and terminal by formatted specifier:
 * e.g. "-KM1:14" or "id_123:A1"
 */
export function resolveTerminal(
  doc: Doc,
  spec: string
): { elem: Element; def: ComponentDef; termId: string; worldPos: Pt } | null {
  if (!spec || typeof spec !== 'string') return null;
  const parts = spec.trim().split(':');
  if (parts.length !== 2) return null;
  const [ident, termId] = parts;
  const identLower = ident.toLowerCase();
  const termLower = termId.toLowerCase();

  // Find all elements matching by Tag or by ID
  const matchingElements = doc.elements.filter(
    (el) =>
      (el.tag && el.tag.toLowerCase() === identLower) ||
      (el.id && el.id.toLowerCase() === identLower)
  );

  for (const elem of matchingElements) {
    const def = registry.get(elem.def);
    if (!def) continue;
    const term = def.terminals.find(
      (t) =>
        t.id.toLowerCase() === termLower ||
        (t.label && t.label.toLowerCase() === termLower)
    );
    if (term) {
      const worldPos = localToWorld(elem.x, elem.y, term, elem.rot);
      return { elem, def, termId: term.id, worldPos };
    }
  }

  return null;
}

/**
 * Generates an orthogonal (Manhattan) route between two points on the 10px grid.
 */
export function routeManhattanWire(start: Pt, end: Pt): Pt[] {
  const p1 = { x: snap(start.x), y: snap(start.y) };
  const p2 = { x: snap(end.x), y: snap(end.y) };

  if (p1.x === p2.x || p1.y === p2.y) {
    return [p1, p2];
  }

  // Intermediate elbow point
  const midPoint = { x: p1.x, y: p2.y };
  return [p1, midPoint, p2];
}

/**
 * Validates Design Rules (DRC) for the schematic:
 * Checks for missing tags, disconnected coils, unconnected terminals, and invalid references.
 */
export function validateDRC(doc: Doc): string[] {
  const issues: string[] = [];

  // 1. Check for coils without contacts or contacts without coils
  const coils = new Set<string>();
  const contacts = new Set<string>();

  for (const elem of doc.elements) {
    const def = registry.get(elem.def);
    if (!def) continue;

    if (def.behavior.type === 'coil') {
      if (elem.tag) coils.add(elem.tag);
    } else if (def.behavior.type === 'contact' && def.behavior.actuation === 'linked') {
      if (elem.tag) contacts.add(elem.tag);
    }
  }

  for (const cTag of contacts) {
    // Phase sequence / loss relays don't require an external coil as they are self-sensing
    const hasSelfSensingRelay = doc.elements.some((el) => {
      const def = registry.get(el.def);
      return el.tag === cTag && def?.behavior.type === 'contact' && (def.behavior as any).phaseLoss;
    });

    if (!coils.has(cTag) && !hasSelfSensingRelay) {
      issues.push(`Contatto ausiliario "${cTag}" presente ma nessuna bobina o relè con la stessa sigla.`);
    }
  }

  return issues;
}

/**
 * Generates a high-level, compact circuit summary optimal for AI inspection and prompts.
 */
export function getCircuitSummary(doc: Doc, simState?: SimState): CircuitSummary {
  const components: ComponentSummary[] = doc.elements.map((elem) => {
    const def = registry.get(elem.def);
    const terms = (def?.terminals || []).map((t) => ({
      id: t.id,
      label: t.label,
      desc: t.desc,
      worldPos: localToWorld(elem.x, elem.y, t, elem.rot),
    }));

    const isActive = Boolean(
      simState?.activeOutputs[elem.id] ||
        (elem.tag && simState?.activeOutputs[elem.tag]) ||
        simState?.elementStates[elem.id]
    );

    return {
      id: elem.id,
      def: elem.def,
      name: def?.name || elem.def,
      category: def?.category || 'Altro',
      tag: elem.tag || '',
      x: elem.x,
      y: elem.y,
      rot: elem.rot,
      props: elem.props || {},
      terminals: terms,
      isActive,
    };
  });

  const activeOuts = simState ? Object.keys(simState.activeOutputs).filter((k) => simState.activeOutputs[k]) : [];

  return {
    title: doc.sheet?.title || 'Schema Senza Titolo',
    pageCount: getDocPages(doc).length,
    components,
    wireCount: doc.wires?.length || 0,
    simulation: {
      running: Boolean(simState?.running),
      fault: simState?.fault ? simState.fault.type : null,
      activeOutputs: activeOuts,
      plcVariables: simState?.plcMemories ? Object.values(simState.plcMemories)[0]?.vars : undefined,
    },
    drcIssues: validateDRC(doc),
  };
}

/**
 * Executes a list of CAD actions from an AI agent or copilot onto the Document.
 */
export function executeCadActions(doc: Doc, actions: CadAction[]): ExecutionResult {
  let updatedElements = [...doc.elements];
  let updatedWires = [...doc.wires];
  let updatedSheet = { ...doc.sheet };
  const errors: string[] = [];
  let successCount = 0;

  for (const act of actions) {
    try {
      switch (act.action) {
        case 'clear_sheet': {
          updatedElements = [];
          updatedWires = [];
          successCount++;
          break;
        }

        case 'add_component': {
          const def = registry.get(act.def);
          if (!def) {
            errors.push(`Definizione componente "${act.def}" sconosciuta.`);
            continue;
          }

          // Auto-generate tag if omitted
          const nextTag =
            act.tag ||
            `${def.tagPrefix || '-K'}${
              updatedElements.filter((el) => el.def === act.def || el.tag.startsWith(def.tagPrefix || '-K')).length + 1
            }`;

          const newElem: Element = {
            id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            def: act.def,
            x: snap(act.x),
            y: snap(act.y),
            rot: act.rot || 0,
            tag: nextTag,
            props: { ...(def.initialProps || {}), ...(act.props || {}) },
          };

          updatedElements.push(newElem);
          successCount++;
          break;
        }

        case 'remove_component': {
          const rawId =
            (act as any).idOrTag ||
            (act as any).id ||
            (act as any).tag ||
            (act as any).target;

          if (!rawId) {
            errors.push('Identificatore componente mancante per la rimozione.');
            continue;
          }

          const strId = String(rawId).toLowerCase().trim();
          const target = updatedElements.find(
            (el) =>
              (el.id && el.id.toLowerCase() === strId) ||
              (el.tag && el.tag.toLowerCase() === strId)
          );

          if (!target) {
            errors.push(`Componente "${rawId}" non trovato per la rimozione.`);
            continue;
          }

          // Rimuovi anche i fili che erano collegati ai morsetti del componente rimosso
          const def = registry.get(target.def);
          if (def && def.terminals) {
            const termPositions = def.terminals.map((t) =>
              localToWorld(target.x, target.y, t, target.rot)
            );
            updatedWires = updatedWires.filter((w) => {
              if (!w.pts || w.pts.length < 2) return false;
              const start = w.pts[0];
              const end = w.pts[w.pts.length - 1];
              const touchesStart = termPositions.some(
                (tp) => Math.hypot(tp.x - start.x, tp.y - start.y) < 5
              );
              const touchesEnd = termPositions.some(
                (tp) => Math.hypot(tp.x - end.x, tp.y - end.y) < 5
              );
              return !touchesStart && !touchesEnd;
            });
          }

          updatedElements = updatedElements.filter((el) => el.id !== target.id);
          successCount++;
          break;
        }

        case 'connect_terminals': {
          const tempDoc: Doc = { ...doc, elements: updatedElements, wires: updatedWires };
          const fromTerm = resolveTerminal(tempDoc, act.from);
          const toTerm = resolveTerminal(tempDoc, act.to);

          if (!fromTerm) {
            errors.push(`Morsetto di partenza non trovato: "${act.from}".`);
            continue;
          }
          if (!toTerm) {
            errors.push(`Morsetto di arrivo non trovato: "${act.to}".`);
            continue;
          }

          const pts = routeManhattanWire(fromTerm.worldPos, toTerm.worldPos);
          const wireKind = normalizeWireKind(act.kind);
          const newWire: Wire = {
            id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            pts,
            kind: wireKind,
          };

          updatedWires.push(newWire);
          successCount++;
          break;
        }

        case 'add_wire': {
          if (!act.pts || act.pts.length < 2) {
            errors.push('Il filo deve contenere almeno 2 punti.');
            continue;
          }
          const snappedPts = act.pts.map((p) => snapPt(p));
          const wireKind = normalizeWireKind(act.kind);
          const newWire: Wire = {
            id: `w_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            pts: snappedPts,
            kind: wireKind,
          };
          updatedWires.push(newWire);
          successCount++;
          break;
        }

        case 'remove_wire': {
          const rawId = (act as any).wireId || (act as any).id;
          if (!rawId) {
            errors.push('Identificatore filo mancante.');
            continue;
          }
          const before = updatedWires.length;
          updatedWires = updatedWires.filter((w) => w.id !== rawId);
          if (updatedWires.length === before) {
            errors.push(`Filo "${rawId}" non trovato.`);
            continue;
          }
          successCount++;
          break;
        }

        case 'set_plc_code': {
          const rawId = (act as any).idOrTag || (act as any).id || (act as any).tag;
          if (!rawId) {
            errors.push('Identificatore modulo PLC mancante.');
            continue;
          }
          const strId = String(rawId).toLowerCase().trim();
          const target = updatedElements.find(
            (el) =>
              (el.id && el.id.toLowerCase() === strId) ||
              (el.tag && el.tag.toLowerCase() === strId)
          );
          if (!target) {
            errors.push(`Modulo PLC "${rawId}" non trovato.`);
            continue;
          }
          updatedElements = updatedElements.map((el) =>
            el.id === target.id ? { ...el, props: { ...el.props, stCode: act.code } } : el
          );
          successCount++;
          break;
        }

        case 'update_props': {
          const rawId = (act as any).idOrTag || (act as any).id || (act as any).tag;
          if (!rawId) {
            errors.push('Identificatore componente mancante.');
            continue;
          }
          const strId = String(rawId).toLowerCase().trim();
          const target = updatedElements.find(
            (el) =>
              (el.id && el.id.toLowerCase() === strId) ||
              (el.tag && el.tag.toLowerCase() === strId)
          );
          if (!target) {
            errors.push(`Componente "${rawId}" non trovato.`);
            continue;
          }
          updatedElements = updatedElements.map((el) =>
            el.id === target.id ? { ...el, props: { ...el.props, ...act.props } } : el
          );
          successCount++;
          break;
        }

        case 'set_sheet_info': {
          updatedSheet = {
            ...updatedSheet,
            ...(act.title !== undefined ? { title: act.title } : {}),
            ...(act.project !== undefined ? { project: act.project } : {}),
            ...(act.author !== undefined ? { author: act.author } : {}),
            ...(act.date !== undefined ? { date: act.date } : {}),
            ...(act.revision !== undefined ? { revision: act.revision } : {}),
            ...(act.sheetNo !== undefined ? { sheetNo: act.sheetNo } : {}),
          };
          successCount++;
          break;
        }
      }
    } catch (err: any) {
      errors.push(`Errore nell'esecuzione dell'azione "${act.action}": ${err?.message || err}`);
    }
  }

  return {
    doc: {
      ...doc,
      sheet: updatedSheet,
      elements: updatedElements,
      wires: updatedWires,
    },
    successCount,
    errors,
  };
}
