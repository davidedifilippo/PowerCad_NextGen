import React, { useRef, useState, useEffect } from 'react';
import { Doc, Element, Wire, ComponentDef, Pt, WireKind } from '../model/types';
import { registry } from '../library/registry';
import {
  snapPt,
  snap,
  dist,
  Box,
  isElementInBox,
  isWireInBox,
  isPointOnSegment,
  localToWorld,
} from '../utils/geometry';
import { SimState } from '../engine/simulation';
import { Renderer } from './Renderer';
import { ContextMenu } from '../ui/ContextMenu';
import { WIRE_COLOR_MAP } from '../ui/WireToolbar';
import { ClipboardContent } from '../App';

interface Props {
  doc: Doc;
  onDocChange: (newDoc: Doc, recordHistory?: boolean) => void;
  simState: SimState;
  onSimStateChange: React.Dispatch<React.SetStateAction<SimState>>;
  selectedIds: Set<string>;
  onSelectIds: (ids: Set<string>) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  activeDefToPlace: ComponentDef | null;
  onPlacedDef: () => void;
  activeWireTool?: WireKind | null;
  onSelectWireTool?: (tool: WireKind | null) => void;
  clipboard: ClipboardContent | null;
  onCopySelected: () => void;
  onPaste?: (destPt?: Pt) => void;
  onDeleteSelected: () => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  pan: Pt;
  onPanChange: (p: Pt) => void;
  onEditTitleBlock?: () => void;
}

export const SchematicCanvas: React.FC<Props> = ({
  doc,
  onDocChange,
  simState,
  onSimStateChange,
  selectedIds,
  onSelectIds,
  selectedId,
  onSelect,
  activeDefToPlace,
  onPlacedDef,
  activeWireTool,
  onSelectWireTool,
  clipboard,
  onCopySelected,
  onPaste: _onPasteProp,
  onDeleteSelected,
  zoom,
  onZoomChange,
  pan,
  onPanChange,
  onEditTitleBlock,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan state
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Pt>({ x: 0, y: 0 });

  // Marquee selection box state
  const [selectionBox, setSelectionBox] = useState<Box | null>(null);

  // Pre-placement rotation state (press R while hovering a component to rotate before dropping!)
  const [placementRot, setPlacementRot] = useState<0 | 90 | 180 | 270>(0);

  useEffect(() => {
    setPlacementRot(0);
  }, [activeDefToPlace]);

  // Floating pasted selection state (attached to mouse until released with a click)
  interface FloatingSelection {
    startWorld: Pt;
    elementIds: Set<string>;
    wireIds: Set<string>;
    origElemPositions: Map<string, Pt>;
    origWirePts: Map<string, Pt[]>;
  }
  const [floatingSelection, setFloatingSelection] = useState<FloatingSelection | null>(null);

  // Drag state (elements, individual wire segments with orthogonal sliding, wire stretch handles, multi-selection move, or box-select)
  type DragState =
    | {
        type: 'element';
        id: string;
        startScreen: Pt;
        origElemPos: Pt;
        wasSelectedAtStart: boolean;
        isDragging: boolean;
        hasRecordedHistory: boolean;
      }
    | {
        type: 'wire';
        id: string;
        startScreen: Pt;
        origPts: Pt[];
        slideMode: 'horizontal-slide' | 'vertical-slide' | 'free';
        connectedEnds: { wireId: string; pointIndex: number; origPt: Pt }[];
        wasSelectedAtStart: boolean;
        isDragging: boolean;
        hasRecordedHistory: boolean;
      }
    | {
        type: 'wire-handle';
        wireId: string;
        pointIndex: number;
        startScreen: Pt;
        origPts: Pt[];
        isDragging: boolean;
        hasRecordedHistory: boolean;
      }
    | {
        type: 'selection-move';
        startScreen: Pt;
        origElemPositions: Map<string, Pt>;
        origWirePts: Map<string, Pt[]>;
        isDragging: boolean;
        hasRecordedHistory: boolean;
      }
    | {
        type: 'box-select';
        startWorld: Pt;
        currentWorld: Pt;
      };

  const dragRef = useRef<DragState | null>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    elemId?: string | null;
    worldPos?: Pt;
  } | null>(null);

  // Wire routing state
  const [wireDraft, setWireDraft] = useState<Pt[]>([]);
  const [wireStartAxis, setWireStartAxis] = useState<'vertical' | 'horizontal' | null>(null);
  const [draftWireType, setDraftWireType] = useState<{ kind: WireKind; color: string } | null>(null);
  const [mouseWorld, setMouseWorld] = useState<Pt | null>(null);

  // Convert screen coordinates to world coordinates
  const screenToWorld = (screenX: number, screenY: number): Pt => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / zoom;
    const y = (screenY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Find nearest terminal or unselected wire tip within magnetic snap radius
  const findNearestTerminal = (
    worldPt: Pt,
    maxDist = 12
  ): {
    elem?: Element;
    termId?: string;
    label?: string;
    worldPos: Pt;
  } | null => {
    let best: {
      elem?: Element;
      termId?: string;
      label?: string;
      worldPos: Pt;
      d: number;
    } | null = null;

    // 1. Check all component terminals
    for (const elem of doc.elements) {
      const def = registry.get(elem.def);
      if (!def) continue;
      for (const term of def.terminals) {
        const tWorld = localToWorld(elem.x, elem.y, term, elem.rot);
        const d = dist(worldPt, tWorld);
        if (d <= maxDist && (!best || d < best.d)) {
          const label = elem.tag ? `${elem.tag}.${term.label || term.id}` : term.label || term.id;
          best = {
            elem,
            termId: term.id,
            label,
            worldPos: snapPt(tWorld),
            d,
          };
        }
      }
    }

    // 2. Check endpoints (tips) of wires (so user can restart or connect at any wire tip!)
    for (const wire of doc.wires) {
      if (wire.pts.length === 0) continue;
      // When not actively drafting a wire, skip selected wires so their blue resize handles work normally
      if (wireDraft.length === 0 && !activeWireTool && selectedIds.has(wire.id)) continue;
      const endpoints = [wire.pts[0], wire.pts[wire.pts.length - 1]];
      for (const ep of endpoints) {
        const d = dist(worldPt, ep);
        // When not drafting, use a tighter radius on wire tips (7px, or 5px on shared corners)
        // so clicking the body of short segments selects the segment cleanly
        let allowedDist = maxDist;
        if (wireDraft.length === 0 && !activeWireTool) {
          const isSharedCorner = doc.wires.some(
            (other) =>
              other.id !== wire.id &&
              other.pts.length > 0 &&
              (dist(other.pts[0], ep) < 2 || dist(other.pts[other.pts.length - 1], ep) < 2)
          );
          allowedDist = Math.min(maxDist, isSharedCorner ? 5 : 7);
        }
        if (d <= allowedDist && (!best || d < best.d)) {
          best = {
            worldPos: snapPt(ep),
            d,
          };
        }
      }
    }

    return best;
  };

  // Infer wire kind & color based on terminal source potentials, terminal labels, or connecting wires
  const inferWireTypeAtPoint = (
    point: Pt,
    specificElem?: Element,
    specificTermId?: string
  ): { kind: WireKind; color: string } | null => {
    // 1. If explicit element and termId are provided
    if (specificElem && specificTermId) {
      const def = registry.get(specificElem.def);
      if (def) {
        // A. Source component potentials
        if (def.behavior.type === 'source' && def.behavior.potentials) {
          const pot = def.behavior.potentials[specificTermId];
          if (pot === 'L1') return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
          if (pot === 'L2') return { kind: 'phase_l2', color: WIRE_COLOR_MAP['phase_l2'] };
          if (pot === 'L3') return { kind: 'phase_l3', color: WIRE_COLOR_MAP['phase_l3'] };
          if (pot === 'L') return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
          if (pot === 'N') return { kind: 'neutral', color: WIRE_COLOR_MAP['neutral'] };
          if (pot === 'PE') return { kind: 'pe', color: WIRE_COLOR_MAP['pe'] };
          if (pot === '+24V' || pot === '+') return { kind: 'pos', color: WIRE_COLOR_MAP['pos'] };
          if (pot === '0V' || pot === '-') return { kind: 'neg', color: WIRE_COLOR_MAP['neg'] };
        }

        // B. Terminal label / id matching
        const term = def.terminals.find((t) => t.id === specificTermId);
        const label = (term?.label || specificTermId).toUpperCase().trim();

        if (label === 'PE' || label.startsWith('PE')) return { kind: 'pe', color: WIRE_COLOR_MAP['pe'] };
        if (label === 'N' || label === 'NEUTRO') return { kind: 'neutral', color: WIRE_COLOR_MAP['neutral'] };
        if (label === 'L1' || label === 'U' || label === 'U1' || label === 'U2') return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
        if (label === 'L2' || label === 'V' || label === 'V1' || label === 'V2') return { kind: 'phase_l2', color: WIRE_COLOR_MAP['phase_l2'] };
        if (label === 'L3' || label === 'W' || label === 'W1' || label === 'W2') return { kind: 'phase_l3', color: WIRE_COLOR_MAP['phase_l3'] };
        if (label === 'L' || label === 'FASE') return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
        if (label === '+' || label === '+24V' || label === 'PLUS') return { kind: 'pos', color: WIRE_COLOR_MAP['pos'] };
        if (label === '-' || label === '0V' || label === 'MINUS') return { kind: 'neg', color: WIRE_COLOR_MAP['neg'] };

        // C. Multi-pole numbered terminal conventions (e.g. 1-2=L1, 3-4=L2, 5-6=L3, 7-8=N for 3P+N; or 1-2=L, 3-4=N for 1P+N)
        const is3P_N = def.id.includes('3p_n') || def.terminals.some((t) => t.id === '7' || t.label === '7' || t.label === 'N');
        const is3P = !is3P_N && (def.id.includes('3p') || def.id.includes('three') || def.terminals.length >= 6);
        const is1P_N = def.id.includes('1p_n');

        if (is3P_N) {
          if (['1', '2'].includes(specificTermId)) return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
          if (['3', '4'].includes(specificTermId)) return { kind: 'phase_l2', color: WIRE_COLOR_MAP['phase_l2'] };
          if (['5', '6'].includes(specificTermId)) return { kind: 'phase_l3', color: WIRE_COLOR_MAP['phase_l3'] };
          if (['7', '8'].includes(specificTermId)) return { kind: 'neutral', color: WIRE_COLOR_MAP['neutral'] };
        } else if (is3P) {
          if (['1', '2'].includes(specificTermId)) return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
          if (['3', '4'].includes(specificTermId)) return { kind: 'phase_l2', color: WIRE_COLOR_MAP['phase_l2'] };
          if (['5', '6'].includes(specificTermId)) return { kind: 'phase_l3', color: WIRE_COLOR_MAP['phase_l3'] };
        } else if (is1P_N) {
          if (['1', '2'].includes(specificTermId)) return { kind: 'phase', color: WIRE_COLOR_MAP['phase'] };
          if (['3', '4'].includes(specificTermId)) return { kind: 'neutral', color: WIRE_COLOR_MAP['neutral'] };
        }
      }
    }

    // 2. Check nearest terminal if specificElem was not supplied
    const near = findNearestTerminal(point, 12);
    if (near?.elem && near.termId) {
      return inferWireTypeAtPoint(point, near.elem, near.termId);
    }

    // 3. Check if point is on an existing wire or near wire tip -> inherit wire's kind and color
    for (const w of doc.wires) {
      if (w.pts.length < 2) continue;
      for (let i = 0; i < w.pts.length - 1; i++) {
        if (isPointOnSegment(point, w.pts[i], w.pts[i + 1], 6)) {
          return { kind: w.kind || 'aux', color: w.color || WIRE_COLOR_MAP[w.kind || 'aux'] };
        }
      }
    }

    return null;
  };

  // Compute smart orthogonal corner point based on initial pull direction from start
  const computeOrthogonalCorner = (start: Pt, targetPt: Pt): Pt => {
    const axis =
      wireStartAxis ??
      (Math.abs(targetPt.y - start.y) >= Math.abs(targetPt.x - start.x)
        ? 'vertical'
        : 'horizontal');
    return axis === 'vertical'
      ? { x: start.x, y: targetPt.y }
      : { x: targetPt.x, y: start.y };
  };

  // Helper to complete in-progress wire(s) as independent 2-point orthogonal segments
  const completeWire = (rawTargetPt: Pt) => {
    if (wireDraft.length === 0) return;
    const start = wireDraft[wireDraft.length - 1];
    const targetPt = snapPt(rawTargetPt);
    if (dist(start, targetPt) < 2) {
      setWireDraft([]);
      setWireStartAxis(null);
      setDraftWireType(null);
      return;
    }
    const corner = computeOrthogonalCorner(start, targetPt);
    const hasCorner = dist(start, corner) > 2 && dist(corner, targetPt) > 2;
    const ts = Date.now();

    if (activeWireTool === '3p_vert') {
      const offsets = [-20, 0, 20];
      const kinds: WireKind[] = ['phase', 'phase_l2', 'phase_l3'];
      const colors = [WIRE_COLOR_MAP['phase'], WIRE_COLOR_MAP['phase_l2'], WIRE_COLOR_MAP['phase_l3']];
      const newWires: Wire[] = [];
      offsets.forEach((dx, i) => {
        const wireKind = kinds[i];
        const wireColor = colors[i];
        if (hasCorner) {
          newWires.push(
            {
              id: `wire_${ts}_${i}_a`,
              kind: wireKind,
              color: wireColor,
              pts: [
                { x: start.x + dx, y: start.y },
                { x: corner.x + dx, y: corner.y },
              ],
            },
            {
              id: `wire_${ts}_${i}_b`,
              kind: wireKind,
              color: wireColor,
              pts: [
                { x: corner.x + dx, y: corner.y },
                { x: targetPt.x + dx, y: targetPt.y },
              ],
            }
          );
        } else {
          newWires.push({
            id: `wire_${ts}_${i}`,
            kind: wireKind,
            color: wireColor,
            pts: [
              { x: start.x + dx, y: start.y },
              { x: targetPt.x + dx, y: targetPt.y },
            ],
          });
        }
      });
      onDocChange({ ...doc, wires: [...doc.wires, ...newWires] });
    } else if (activeWireTool === '3p_horiz') {
      const offsets = [-20, 0, 20];
      const kinds: WireKind[] = ['phase', 'phase_l2', 'phase_l3'];
      const colors = [WIRE_COLOR_MAP['phase'], WIRE_COLOR_MAP['phase_l2'], WIRE_COLOR_MAP['phase_l3']];
      const newWires: Wire[] = [];
      offsets.forEach((dy, i) => {
        const wireKind = kinds[i];
        const wireColor = colors[i];
        if (hasCorner) {
          newWires.push(
            {
              id: `wire_${ts}_${i}_a`,
              kind: wireKind,
              color: wireColor,
              pts: [
                { x: start.x, y: start.y + dy },
                { x: corner.x, y: corner.y + dy },
              ],
            },
            {
              id: `wire_${ts}_${i}_b`,
              kind: wireKind,
              color: wireColor,
              pts: [
                { x: corner.x, y: corner.y + dy },
                { x: targetPt.x, y: targetPt.y + dy },
              ],
            }
          );
        } else {
          newWires.push({
            id: `wire_${ts}_${i}`,
            kind: wireKind,
            color: wireColor,
            pts: [
              { x: start.x, y: start.y + dy },
              { x: targetPt.x, y: targetPt.y + dy },
            ],
          });
        }
      });
      onDocChange({ ...doc, wires: [...doc.wires, ...newWires] });
    } else {
      const kind = activeWireTool || draftWireType?.kind || 'aux';
      const color = activeWireTool ? WIRE_COLOR_MAP[activeWireTool] : (draftWireType?.color || WIRE_COLOR_MAP[kind]);
      const newWires: Wire[] = hasCorner
        ? [
            {
              id: `wire_${ts}_a`,
              kind,
              color,
              pts: [start, corner],
            },
            {
              id: `wire_${ts}_b`,
              kind,
              color,
              pts: [corner, targetPt],
            },
          ]
        : [
            {
              id: `wire_${ts}`,
              kind,
              color,
              pts: [start, targetPt],
            },
          ];
      onDocChange({ ...doc, wires: [...doc.wires, ...newWires] });
    }
    setWireDraft([]);
    setWireStartAxis(null);
    setDraftWireType(null);
  };

  // Magnetic hovered terminal (when not placing a component or panning)
  const hoveredTerminal = (() => {
    if (!mouseWorld || simState.running || activeDefToPlace || isPanning) return null;
    const near = findNearestTerminal(mouseWorld, 12);
    if (!near) return null;
    return {
      x: near.worldPos.x,
      y: near.worldPos.y,
      label: near.label,
    };
  })();

  // Live dynamic wire preview with magnetic terminal snapping & smart orthogonal L-bend
  const displayDraft = (() => {
    if (wireDraft.length === 0) return [];
    if (!mouseWorld) return wireDraft;
    const start = wireDraft[wireDraft.length - 1];
    const nearTerm = findNearestTerminal(mouseWorld, 12);
    const snapped = nearTerm ? nearTerm.worldPos : snapPt(mouseWorld);
    const corner = computeOrthogonalCorner(start, snapped);
    if (dist(start, corner) > 2 && dist(corner, snapped) > 2) {
      return [start, corner, snapped];
    }
    return [start, snapped];
  })();

  // Paste clipboard and enter dynamic floating placement mode (follows mouse until clicked!)
  const pasteClipboard = (destPt?: Pt) => {
    if (!clipboard || simState.running) return;

    const target = destPt
      ? snapPt(destPt)
      : mouseWorld
      ? snapPt(mouseWorld)
      : { x: clipboard.basePoint.x + 30, y: clipboard.basePoint.y + 30 };

    const dx = target.x - clipboard.basePoint.x;
    const dy = target.y - clipboard.basePoint.y;

    const timestamp = Date.now();
    const newElements: Element[] = clipboard.elements.map((el, idx) => ({
      ...el,
      id: `elem_${timestamp}_${idx}`,
      x: snap(el.x + dx),
      y: snap(el.y + dy),
      props: { ...el.props },
    }));

    const newWires: Wire[] = clipboard.wires.map((w, idx) => ({
      ...w,
      id: `wire_${timestamp}_${idx}`,
      pts: w.pts.map((p) => ({ x: snap(p.x + dx), y: snap(p.y + dy) })),
    }));

    const newElementIds = new Set(newElements.map((el) => el.id));
    const newWireIds = new Set(newWires.map((w) => w.id));
    const newSelectedIds = new Set([...newElementIds, ...newWireIds]);

    const origElemPositions = new Map<string, Pt>();
    for (const el of newElements) {
      origElemPositions.set(el.id, { x: el.x, y: el.y });
    }
    const origWirePts = new Map<string, Pt[]>();
    for (const w of newWires) {
      origWirePts.set(w.id, w.pts.map((p) => ({ ...p })));
    }

    onDocChange({
      ...doc,
      elements: [...doc.elements, ...newElements],
      wires: [...doc.wires, ...newWires],
    });

    onSelectIds(newSelectedIds);

    // Enter floating placement mode so the selection moves with mouse until clicked!
    setFloatingSelection({
      startWorld: target,
      elementIds: newElementIds,
      wireIds: newWireIds,
      origElemPositions,
      origWirePts,
    });
  };

  // Keyboard shortcuts: Delete, R (rotate), Esc, Ctrl+C, Ctrl+V, Ctrl+X
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      // Copy: Ctrl+C / Cmd+C
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C') && !simState.running) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          onCopySelected();
        }
        return;
      }

      // Cut: Ctrl+X / Cmd+X
      if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X') && !simState.running) {
        if (selectedIds.size > 0) {
          e.preventDefault();
          onCopySelected();
          onDeleteSelected();
        }
        return;
      }

      // Paste: Ctrl+V / Cmd+V
      if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V') && !simState.running) {
        e.preventDefault();
        pasteClipboard(mouseWorld || undefined);
        return;
      }

      // Delete: Delete / Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIds.size > 0 && !simState.running) {
        e.preventDefault();
        onDeleteSelected();
        setContextMenu(null);
        return;
      }

      // Rotate: R (rotates ghost preview before placement, or selected elements on canvas)
      if ((e.key === 'r' || e.key === 'R') && !simState.running) {
        if (activeDefToPlace) {
          e.preventDefault();
          setPlacementRot((prev) => ((prev + 90) % 360) as 0 | 90 | 180 | 270);
          return;
        }
        if (selectedIds.size > 0) {
          e.preventDefault();
          const updated = doc.elements.map((el) => {
            if (!selectedIds.has(el.id)) return el;
            const nextRot = ((el.rot + 90) % 360) as 0 | 90 | 180 | 270;
            return { ...el, rot: nextRot };
          });
          onDocChange({ ...doc, elements: updated });
          return;
        }
      }

      // Escape
      if (e.key === 'Escape') {
        if (floatingSelection) {
          setFloatingSelection(null);
          return;
        }
        setWireDraft([]);
        setWireStartAxis(null);
        setDraftWireType(null);
        setSelectionBox(null);
        onPlacedDef();
        onSelectWireTool?.(null);
        onSelectIds(new Set());
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedIds,
    doc,
    onDocChange,
    onSelectIds,
    onDeleteSelected,
    onCopySelected,
    clipboard,
    floatingSelection,
    mouseWorld,
    simState.running,
    activeDefToPlace,
    onPlacedDef,
    onSelectWireTool,
  ]);

  // Global mouseup safeguard so dragging NEVER gets stuck to the cursor
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsPanning(false);
      setSelectionBox(null);
      dragRef.current = null;
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.25), 4.0);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
      const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
      onPanChange({ x: newPanX, y: newPanY });
    }
    onZoomChange(newZoom);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Close context menu on any outside click
    if (contextMenu) setContextMenu(null);

    // If currently floating pasted selection, clicking drops and releases it!
    if (floatingSelection && e.button === 0) {
      setFloatingSelection(null);
      return;
    }

    // Middle mouse button or alt/shift key -> Pan
    if (e.button === 1 || e.altKey || e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (simState.running) return;

    const world = screenToWorld(e.clientX, e.clientY);
    const snapped = snapPt(world);

    // If placing a new component from palette (uses placementRot rotatable via R!)
    if (activeDefToPlace && e.button === 0) {
      const newElem: Element = {
        id: `elem_${Date.now()}`,
        def: activeDefToPlace.id,
        x: snapped.x,
        y: snapped.y,
        rot: placementRot,
        tag: activeDefToPlace.tagPrefix
          ? `${activeDefToPlace.tagPrefix}${doc.elements.filter((el) => el.def === activeDefToPlace.id).length + 1}`
          : '',
        props: {
          ...(activeDefToPlace.props || []).reduce(
            (acc, p) => ({ ...acc, [p.key]: p.default }),
            {}
          ),
          ...(activeDefToPlace.initialProps || {}),
        },
      };
      onDocChange({ ...doc, elements: [...doc.elements, newElem] });
      onSelectIds(new Set([newElem.id]));
      onPlacedDef();
      return;
    }

    const nearTerm = findNearestTerminal(world, 12);

    // If drafting a wire
    if (wireDraft.length > 0 && e.button === 0) {
      completeWire(nearTerm ? nearTerm.worldPos : snapped);
      return;
    }

    // If clicking within magnetic snap range of any terminal or unselected wire tip, start wire immediately
    if (nearTerm && e.button === 0) {
      setWireDraft([nearTerm.worldPos]);
      setWireStartAxis(null);
      const inferred = inferWireTypeAtPoint(nearTerm.worldPos, nearTerm.elem, nearTerm.termId);
      setDraftWireType(inferred);
      return;
    }

    // If activeWireTool is selected and wireDraft is empty, clicking starts wire routing
    if (activeWireTool && e.button === 0) {
      setWireDraft([snapped]);
      setWireStartAxis(null);
      setDraftWireType(null);
      return;
    }

    // Left click on empty canvas background -> initiate box / marquee selection
    if (e.button === 0) {
      dragRef.current = {
        type: 'box-select',
        startWorld: world,
        currentWorld: world,
      };
      setSelectionBox({ x1: world.x, y1: world.y, x2: world.x, y2: world.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    setMouseWorld(world);

    // Dynamically lock initial pull axis (horizontal vs vertical) when drawing a wire
    if (wireDraft.length > 0 && !simState.running) {
      const start = wireDraft[wireDraft.length - 1];
      const sWorld = snapPt(world);
      const dx = Math.abs(sWorld.x - start.x);
      const dy = Math.abs(sWorld.y - start.y);
      if (dx < 10 && dy < 10) {
        if (wireStartAxis !== null) setWireStartAxis(null);
      } else if (dy === 0 && dx >= 10) {
        if (wireStartAxis !== 'horizontal') setWireStartAxis('horizontal');
      } else if (dx === 0 && dy >= 10) {
        if (wireStartAxis !== 'vertical') setWireStartAxis('vertical');
      } else if (wireStartAxis === null) {
        setWireStartAxis(dx > dy ? 'horizontal' : 'vertical');
      }
    }

    if (isPanning) {
      onPanChange({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    // If currently in floating paste mode, smoothly move the pasted elements with mouse (without spamming Undo history)!
    if (floatingSelection) {
      const snapped = snapPt(world);
      const dx = snapped.x - floatingSelection.startWorld.x;
      const dy = snapped.y - floatingSelection.startWorld.y;

      const origElemPositions = floatingSelection.origElemPositions;
      const origWirePts = floatingSelection.origWirePts;

      const updatedElements = doc.elements.map((el) => {
        const orig = origElemPositions.get(el.id);
        if (!orig) return el;
        return { ...el, x: orig.x + dx, y: orig.y + dy };
      });

      const updatedWires = doc.wires.map((w) => {
        const orig = origWirePts.get(w.id);
        if (!orig) return w;
        return {
          ...w,
          pts: orig.map((p) => ({ x: p.x + dx, y: p.y + dy })),
        };
      });

      onDocChange({ ...doc, elements: updatedElements, wires: updatedWires }, false);
      return;
    }

    if (!dragRef.current || simState.running) return;

    // 1. Marquee selection drag
    if (dragRef.current.type === 'box-select') {
      const newBox: Box = {
        x1: dragRef.current.startWorld.x,
        y1: dragRef.current.startWorld.y,
        x2: world.x,
        y2: world.y,
      };
      setSelectionBox(newBox);

      // Select any elements or wires enclosed by or intersecting the box
      const newSelected = new Set<string>();
      for (const el of doc.elements) {
        if (isElementInBox(el, newBox)) {
          newSelected.add(el.id);
        }
      }
      for (const w of doc.wires) {
        if (isWireInBox(w.pts, newBox)) {
          newSelected.add(w.id);
        }
      }
      onSelectIds(newSelected);
      return;
    }

    // 2. Dragging elements, wires, or multi-selection
    // Note: For individual wires, only allow moving if the wire was ALREADY selected before mousedown!
    if (dragRef.current.type === 'wire' && !dragRef.current.wasSelectedAtStart) {
      return;
    }

    const dScreen = Math.hypot(
      e.clientX - dragRef.current.startScreen.x,
      e.clientY - dragRef.current.startScreen.y
    );

    if (!dragRef.current.isDragging && dScreen > 4) {
      dragRef.current.isDragging = true;
    }

    if (dragRef.current.isDragging) {
      const dx = (e.clientX - dragRef.current.startScreen.x) / zoom;
      const dy = (e.clientY - dragRef.current.startScreen.y) / zoom;
      const snapDx = snap(dx);
      const snapDy = snap(dy);
      const shouldRecordHistory = !dragRef.current.hasRecordedHistory;
      dragRef.current.hasRecordedHistory = true;

      if (dragRef.current.type === 'selection-move') {
        const origElemPositions = dragRef.current.origElemPositions;
        const origWirePts = dragRef.current.origWirePts;

        const updatedElements = doc.elements.map((el) => {
          const orig = origElemPositions.get(el.id);
          if (!orig) return el;
          return { ...el, x: orig.x + snapDx, y: orig.y + snapDy };
        });

        const updatedWires = doc.wires.map((w) => {
          const orig = origWirePts.get(w.id);
          if (!orig) return w;
          return {
            ...w,
            pts: orig.map((p) => ({ x: p.x + snapDx, y: p.y + snapDy })),
          };
        });

        onDocChange(
          { ...doc, elements: updatedElements, wires: updatedWires },
          shouldRecordHistory
        );
      } else if (dragRef.current.type === 'element') {
        const elemId = dragRef.current.id;
        const newX = snap(dragRef.current.origElemPos.x + dx);
        const newY = snap(dragRef.current.origElemPos.y + dy);

        const updated = doc.elements.map((el) => {
          if (el.id !== elemId) return el;
          return { ...el, x: newX, y: newY };
        });
        onDocChange({ ...doc, elements: updated }, shouldRecordHistory);
      } else if (dragRef.current.type === 'wire') {
        const { id: wireId, origPts, slideMode, connectedEnds } = dragRef.current;
        const effDx = slideMode === 'vertical-slide' ? 0 : snapDx;
        const effDy = slideMode === 'horizontal-slide' ? 0 : snapDy;

        const updated = doc.wires.map((w) => {
          if (w.id === wireId) {
            return {
              ...w,
              pts: origPts.map((p) => ({
                x: p.x + effDx,
                y: p.y + effDy,
              })),
            };
          }
          const matchingEnds = connectedEnds.filter((ce) => ce.wireId === w.id);
          if (matchingEnds.length > 0) {
            const newPts = w.pts.map((p, idx) => {
              const ce = matchingEnds.find((m) => m.pointIndex === idx);
              if (ce) {
                return {
                  x: ce.origPt.x + effDx,
                  y: ce.origPt.y + effDy,
                };
              }
              return p;
            });
            return { ...w, pts: newPts };
          }
          return w;
        });
        onDocChange({ ...doc, wires: updated }, shouldRecordHistory);
      } else if (dragRef.current.type === 'wire-handle') {
        const { wireId, pointIndex, origPts } = dragRef.current;
        const snapped = snapPt(world);

        const updated = doc.wires.map((w) => {
          if (w.id !== wireId) return w;
          const newPts = origPts.map((p, idx) => {
            if (idx === pointIndex) {
              // Keep 2-point orthogonal segments orthogonal when stretching their handles
              if (origPts.length === 2) {
                const isHoriz =
                  Math.abs(origPts[0].y - origPts[1].y) < 1 &&
                  Math.abs(origPts[0].x - origPts[1].x) >= 1;
                const isVert =
                  Math.abs(origPts[0].x - origPts[1].x) < 1 &&
                  Math.abs(origPts[0].y - origPts[1].y) >= 1;
                if (isHoriz) return { x: snapped.x, y: origPts[pointIndex].y };
                if (isVert) return { x: origPts[pointIndex].x, y: snapped.y };
              }
              return { x: snapped.x, y: snapped.y };
            }
            if (origPts.length === 3 && idx === 1) {
              if (pointIndex === 0) {
                const isHorizontalFirst = origPts[0].y === origPts[1].y;
                return isHorizontalFirst
                  ? { x: origPts[1].x, y: snapped.y }
                  : { x: snapped.x, y: origPts[1].y };
              }
              if (pointIndex === 2) {
                const isHorizontalFirst = origPts[0].y === origPts[1].y;
                return isHorizontalFirst
                  ? { x: snapped.x, y: origPts[1].y }
                  : { x: origPts[1].x, y: snapped.y };
              }
            }
            return p;
          });
          return { ...w, pts: newPts };
        });
        onDocChange({ ...doc, wires: updated }, shouldRecordHistory);
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsPanning(false);

    // If user dragged a wire from a terminal/point and released the mouse at another location, complete it!
    if (wireDraft.length > 0 && !simState.running && e.button === 0) {
      const world = screenToWorld(e.clientX, e.clientY);
      const nearTerm = findNearestTerminal(world, 12);
      const targetPt = nearTerm ? nearTerm.worldPos : snapPt(world);
      if (dist(targetPt, wireDraft[0]) >= 10) {
        completeWire(targetPt);
        dragRef.current = null;
        return;
      }
    }

    if (dragRef.current) {
      if (dragRef.current.type === 'box-select') {
        if (selectionBox) {
          const dx = Math.abs(selectionBox.x2 - selectionBox.x1);
          const dy = Math.abs(selectionBox.y2 - selectionBox.y1);
          if (dx < 5 && dy < 5) {
            // Single click on empty canvas -> clear selection
            onSelectIds(new Set());
          }
        }
        setSelectionBox(null);
      } else if (!dragRef.current.isDragging) {
        // Single click selection
        if (dragRef.current.type === 'element' || dragRef.current.type === 'wire') {
          const clickedId = dragRef.current.id;
          if (dragRef.current.wasSelectedAtStart && selectedIds.size === 1) {
            // Second click releases / deselects
            onSelectIds(new Set());
          } else {
            onSelectIds(new Set([clickedId]));
          }
        }
      }
      dragRef.current = null;
    }
  };

  // MouseDown on an element
  const handleElementMouseDown = (elem: Element, e: React.MouseEvent) => {
    e.stopPropagation();

    if (floatingSelection && e.button === 0) {
      setFloatingSelection(null);
      return;
    }

    if (simState.running) return;

    // If user clicked near a terminal on the element, start or finish wire directly!
    const world = screenToWorld(e.clientX, e.clientY);
    const nearTerm = findNearestTerminal(world, 10);
    if (nearTerm && e.button === 0) {
      if (wireDraft.length === 0) {
        setWireDraft([nearTerm.worldPos]);
        setWireStartAxis(null);
        const inferred = inferWireTypeAtPoint(nearTerm.worldPos, nearTerm.elem, nearTerm.termId);
        setDraftWireType(inferred);
      } else {
        completeWire(nearTerm.worldPos);
      }
      return;
    }

    if (activeWireTool || wireDraft.length > 0) return;

    if (e.button === 0) {
      const isAlreadySelected = selectedIds.has(elem.id);

      // If clicked element is part of multi-selection, drag whole selection!
      if (isAlreadySelected && selectedIds.size > 1) {
        const origElemPositions = new Map<string, Pt>();
        for (const el of doc.elements) {
          if (selectedIds.has(el.id)) origElemPositions.set(el.id, { x: el.x, y: el.y });
        }
        const origWirePts = new Map<string, Pt[]>();
        for (const w of doc.wires) {
          if (selectedIds.has(w.id)) origWirePts.set(w.id, w.pts.map((p) => ({ ...p })));
        }

        dragRef.current = {
          type: 'selection-move',
          startScreen: { x: e.clientX, y: e.clientY },
          origElemPositions,
          origWirePts,
          isDragging: false,
          hasRecordedHistory: false,
        };
      } else {
        // If not already selected, immediately select it for fast visual feedback
        if (!isAlreadySelected) {
          onSelectIds(new Set([elem.id]));
        }

        dragRef.current = {
          type: 'element',
          id: elem.id,
          startScreen: { x: e.clientX, y: e.clientY },
          origElemPos: { x: elem.x, y: elem.y },
          wasSelectedAtStart: isAlreadySelected,
          isDragging: false,
          hasRecordedHistory: false,
        };
      }
    }
  };

  // MouseDown on a wire
  const handleWireMouseDown = (wire: Wire, e: React.MouseEvent) => {
    e.stopPropagation();

    if (floatingSelection && e.button === 0) {
      setFloatingSelection(null);
      return;
    }

    if (simState.running) return;

    const world = screenToWorld(e.clientX, e.clientY);

    if (wireDraft.length > 0 && e.button === 0) {
      const nearTerm = findNearestTerminal(world, 12);
      completeWire(nearTerm ? nearTerm.worldPos : snapPt(world));
      return;
    }

    if (e.button === 0) {
      const isAlreadySelected = selectedIds.has(wire.id);

      // If wire is NOT selected, clicking/dragging near its tip starts a new wire from that tip!
      if (!isAlreadySelected) {
        const nearTerm = findNearestTerminal(world, 12);
        if (nearTerm) {
          setWireDraft([nearTerm.worldPos]);
          setWireStartAxis(null);
          const inferred = inferWireTypeAtPoint(nearTerm.worldPos, nearTerm.elem, nearTerm.termId);
          setDraftWireType(inferred);
          return;
        }
      }

      if (activeWireTool) {
        setWireDraft([snapPt(world)]);
        setWireStartAxis(null);
        setDraftWireType(null);
        return;
      }

      // If clicking a legacy multi-segment wire (pts.length > 2), split it into individual 2-point segments
      // so the user can select/delete/slide the exact horizontal or vertical segment they clicked!
      if (wire.pts.length > 2) {
        const segments: Wire[] = [];
        let clickedSegId = `${wire.id}_s0`;
        for (let i = 0; i < wire.pts.length - 1; i++) {
          const segId = `${wire.id}_s${i}`;
          const pA = wire.pts[i];
          const pB = wire.pts[i + 1];
          segments.push({
            id: segId,
            kind: wire.kind,
            color: wire.color,
            pts: [{ ...pA }, { ...pB }],
          });
          if (isPointOnSegment(world, pA, pB, 8)) {
            clickedSegId = segId;
          }
        }
        const newWires = doc.wires.flatMap((w) => (w.id === wire.id ? segments : [w]));
        onDocChange({ ...doc, wires: newWires }, false);
        onSelectIds(new Set([clickedSegId]));
        return;
      }

      if (isAlreadySelected && selectedIds.size > 1) {
        const origElemPositions = new Map<string, Pt>();
        for (const el of doc.elements) {
          if (selectedIds.has(el.id)) origElemPositions.set(el.id, { x: el.x, y: el.y });
        }
        const origWirePts = new Map<string, Pt[]>();
        for (const w of doc.wires) {
          if (selectedIds.has(w.id)) origWirePts.set(w.id, w.pts.map((p) => ({ ...p })));
        }

        dragRef.current = {
          type: 'selection-move',
          startScreen: { x: e.clientX, y: e.clientY },
          origElemPositions,
          origWirePts,
          isDragging: false,
          hasRecordedHistory: false,
        };
      } else {
        // Compute orthogonal sliding connections (connected perpendicular wire endpoints)
        const connectedEnds: { wireId: string; pointIndex: number; origPt: Pt }[] = [];
        let slideMode: 'horizontal-slide' | 'vertical-slide' | 'free' = 'free';

        if (wire.pts.length === 2) {
          const [p0, p1] = wire.pts;
          const isVertical = Math.abs(p0.x - p1.x) < 1 && Math.abs(p0.y - p1.y) >= 1;
          const isHorizontal = Math.abs(p0.y - p1.y) < 1 && Math.abs(p0.x - p1.x) >= 1;

          for (const other of doc.wires) {
            if (other.id === wire.id || other.pts.length < 2) continue;
            const endIndices = [0, other.pts.length - 1];
            for (const idx of endIndices) {
              const ep = other.pts[idx];
              const adj = idx === 0 ? other.pts[1] : other.pts[other.pts.length - 2];
              if (!isPointOnSegment(ep, p0, p1, 2)) continue;
              if (isVertical && Math.abs(ep.y - adj.y) < 1) {
                connectedEnds.push({ wireId: other.id, pointIndex: idx, origPt: { ...ep } });
              } else if (isHorizontal && Math.abs(ep.x - adj.x) < 1) {
                connectedEnds.push({ wireId: other.id, pointIndex: idx, origPt: { ...ep } });
              }
            }
          }

          if (isVertical && connectedEnds.length > 0) {
            slideMode = 'horizontal-slide';
          } else if (isHorizontal && connectedEnds.length > 0) {
            slideMode = 'vertical-slide';
          }
        }

        dragRef.current = {
          type: 'wire',
          id: wire.id,
          startScreen: { x: e.clientX, y: e.clientY },
          origPts: wire.pts.map((p) => ({ ...p })),
          slideMode,
          connectedEnds,
          wasSelectedAtStart: isAlreadySelected,
          isDragging: false,
          hasRecordedHistory: false,
        };
      }
    }
  };

  // MouseDown on wire endpoint handle (to stretch wire)
  const handleWireHandleMouseDown = (wire: Wire, pointIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();

    if (floatingSelection && e.button === 0) {
      setFloatingSelection(null);
      return;
    }

    if (simState.running) return;

    if (e.button === 0) {
      dragRef.current = {
        type: 'wire-handle',
        wireId: wire.id,
        pointIndex,
        startScreen: { x: e.clientX, y: e.clientY },
        origPts: wire.pts.map((p) => ({ ...p })),
        isDragging: false,
        hasRecordedHistory: false,
      };
    }
  };

  // Right-click Context Menu on an element
  const handleElementContextMenu = (elem: Element, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (simState.running) return;

    if (floatingSelection) {
      setFloatingSelection(null);
    }

    if (!selectedIds.has(elem.id)) {
      onSelectIds(new Set([elem.id]));
    }

    const world = screenToWorld(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elemId: elem.id,
      worldPos: world,
    });
  };

  // Click on element (during simulation only)
  const handleElementClick = (elem: Element, e: React.MouseEvent) => {
    e.stopPropagation();

    if (floatingSelection) {
      setFloatingSelection(null);
      return;
    }

    if (simState.running) {
      const def = registry.get(elem.def);
      if (!def) return;

      if (def.behavior.type === 'contact') {
        if (def.behavior.actuation === 'momentary') {
          onSimStateChange((prev) => ({
            ...prev,
            elementStates: { ...prev.elementStates, [elem.id]: true },
          }));
          setTimeout(() => {
            onSimStateChange((prev) => ({
              ...prev,
              elementStates: { ...prev.elementStates, [elem.id]: false },
            }));
          }, 400);
        } else if (def.behavior.actuation === 'latching') {
          const defaultState = def.behavior.defaultOn ?? false;
          onSimStateChange((prev) => {
            const current = prev.elementStates[elem.id] ?? defaultState;
            return {
              ...prev,
              elementStates: { ...prev.elementStates, [elem.id]: !current },
            };
          });
        } else if (def.behavior.actuation === 'linked') {
          onSimStateChange((prev) => {
            const current = prev.activeOutputs[elem.tag] ?? false;
            return {
              ...prev,
              activeOutputs: { ...prev.activeOutputs, [elem.tag]: !current },
            };
          });
        }
      } else if (def.behavior.type === 'thermal') {
        onSimStateChange((prev) => {
          const current = prev.elementStates[elem.id] ?? false;
          return {
            ...prev,
            elementStates: { ...prev.elementStates, [elem.id]: !current },
            activeOutputs: { ...prev.activeOutputs, [elem.tag]: !current },
          };
        });
      } else if (
        (def.behavior.type === 'logic' && def.behavior.op === 'input') ||
        def.behavior.type === 'pneumatic'
      ) {
        onSimStateChange((prev) => {
          const current = prev.elementStates[elem.id] ?? false;
          return {
            ...prev,
            elementStates: { ...prev.elementStates, [elem.id]: !current },
          };
        });
      }
    }
  };

  // MouseDown on terminal handle -> start drag-to-wire or finish click-to-wire
  const handleTerminalMouseDown = (
    _elem: Element,
    _termId: string,
    worldPos: Pt,
    _e: React.MouseEvent
  ) => {
    if (floatingSelection) {
      setFloatingSelection(null);
      return;
    }

    if (simState.running) return;

    const snapped = snapPt(worldPos);

    if (wireDraft.length === 0) {
      setWireDraft([snapped]);
      setWireStartAxis(null);
      const inferred = inferWireTypeAtPoint(snapped, _elem, _termId);
      setDraftWireType(inferred);
    } else {
      completeWire(snapped);
    }
  };

  // MouseUp on terminal handle -> complete drag-to-wire if dragged from another terminal/point
  const handleTerminalMouseUp = (
    _elem: Element,
    _termId: string,
    worldPos: Pt,
    e: React.MouseEvent
  ) => {
    if (simState.running || wireDraft.length === 0) return;
    const snapped = snapPt(worldPos);
    if (dist(snapped, wireDraft[0]) >= 5) {
      e.stopPropagation();
      completeWire(snapped);
    }
  };

  // Click on terminal handle (fallback for accessibility/synthetic clicks)
  const handleTerminalClick = (_elem: Element, _termId: string, _worldPos: Pt) => {
    // Handled by handleTerminalMouseDown / handleTerminalMouseUp
  };

  const handleWireClick = (_wire: Wire, e: React.MouseEvent) => {
    e.stopPropagation();

    if (floatingSelection) {
      setFloatingSelection(null);
      return;
    }

    if (simState.running) return;

    if (wireDraft.length > 0) {
      const world = screenToWorld(e.clientX, e.clientY);
      const snapped = snapPt(world);
      completeWire(snapped);
      return;
    }

    if (activeWireTool && wireDraft.length === 0) {
      const world = screenToWorld(e.clientX, e.clientY);
      const snapped = snapPt(world);
      setWireDraft([snapped]);
      setWireStartAxis(null);
      return;
    }
  };

  const handleWireContextMenu = (wire: Wire, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (simState.running) return;

    if (floatingSelection) {
      setFloatingSelection(null);
    }

    if (!selectedIds.has(wire.id)) {
      onSelectIds(new Set([wire.id]));
    }

    const world = screenToWorld(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elemId: wire.id,
      worldPos: world,
    });
  };

  // Right-click on empty canvas
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (simState.running) return;

    if (floatingSelection) {
      setFloatingSelection(null);
    }

    const world = screenToWorld(e.clientX, e.clientY);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      elemId: null,
      worldPos: world,
    });
  };

  // Compute ghost element preview when placing a component
  const ghostElement = (() => {
    if (!activeDefToPlace || !mouseWorld || simState.running) return null;
    const snapped = snapPt(mouseWorld);
    return {
      def: activeDefToPlace,
      x: snapped.x,
      y: snapped.y,
      rot: placementRot,
      tag: activeDefToPlace.tagPrefix
        ? `${activeDefToPlace.tagPrefix}${doc.elements.filter((el) => el.def === activeDefToPlace.id).length + 1}`
        : '',
      props: {
        ...(activeDefToPlace.props || []).reduce(
          (acc, p) => ({ ...acc, [p.key]: p.default }),
          {}
        ),
        ...(activeDefToPlace.initialProps || {}),
      },
    };
  })();

  return (
    <div
      ref={containerRef}
      className="schematic-canvas-container"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setMouseWorld(null);
        setSelectionBox(null);
      }}
      onContextMenu={handleCanvasContextMenu}
      style={{
        flex: 1,
        height: '100%',
        backgroundColor: '#cbd5e1', // Clean neutral CAD workspace background
        overflow: 'hidden',
        position: 'relative',
        cursor: isPanning
          ? 'grabbing'
          : activeDefToPlace
          ? 'copy'
          : activeWireTool || wireDraft.length > 0 || hoveredTerminal
          ? 'crosshair'
          : floatingSelection
          ? 'move'
          : 'default',
        userSelect: 'none',
      }}
    >
      <svg
        width="100%"
        height="100%"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Viewport Transform (Pan & Zoom) */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          <Renderer
            doc={doc}
            simState={simState}
            selectedId={selectedId}
            selectedIds={selectedIds}
            selectionBox={selectionBox}
            onElementClick={handleElementClick}
            onElementMouseDown={handleElementMouseDown}
            onElementContextMenu={handleElementContextMenu}
            onWireClick={handleWireClick}
            onWireMouseDown={handleWireMouseDown}
            onWireHandleMouseDown={handleWireHandleMouseDown}
            onWireContextMenu={handleWireContextMenu}
            onTerminalClick={handleTerminalClick}
            onTerminalMouseDown={handleTerminalMouseDown}
            onTerminalMouseUp={handleTerminalMouseUp}
            wireDraft={displayDraft}
            draftColor={activeWireTool ? WIRE_COLOR_MAP[activeWireTool] : draftWireType?.color || WIRE_COLOR_MAP['aux']}
            ghostElement={ghostElement}
            hoveredTerminal={hoveredTerminal}
            onEditTitleBlock={onEditTitleBlock}
          />
        </g>
      </svg>

      {/* Floating Right-Click Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          elemId={contextMenu.elemId}
          worldPos={contextMenu.worldPos}
          selectedIds={selectedIds}
          doc={doc}
          onDocChange={onDocChange}
          onClose={() => setContextMenu(null)}
          onDeleteSelected={onDeleteSelected}
          onCopySelected={onCopySelected}
          onPaste={(dest) => pasteClipboard(dest)}
          hasClipboard={clipboard !== null}
        />
      )}
    </div>
  );
};
