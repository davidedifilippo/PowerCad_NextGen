import React, { useState, useEffect, useCallback } from 'react';
import { Doc, ComponentDef, Pt, WireKind, Element, Wire } from './model/types';
import { SAMPLE_DIRECT_START } from './samples/directStart';
import { createInitialSimState, stepSimulation, SimState } from './engine/simulation';
import { getSheetDimensions, snap, snapPt } from './utils/geometry';
import { Toolbar } from './ui/Toolbar';
import { WireToolbar } from './ui/WireToolbar';
import { ComponentPalette } from './ui/ComponentPalette';
import { SchematicCanvas } from './editor/SchematicCanvas';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { Renderer } from './editor/Renderer';

export interface ClipboardContent {
  elements: Element[];
  wires: Wire[];
  basePoint: Pt;
}

export const App: React.FC = () => {
  // Document state with history for Undo/Redo
  const [doc, setDoc] = useState<Doc>(SAMPLE_DIRECT_START);
  const [history, setHistory] = useState<Doc[]>([]);
  const [redoStack, setRedoStack] = useState<Doc[]>([]);

  // Simulation state
  const [simState, setSimState] = useState<SimState>(createInitialSimState());

  // Multi-Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedId = selectedIds.size === 1 ? Array.from(selectedIds)[0] : null;

  // Placement & Active Tools
  const [activeDefToPlace, setActiveDefToPlace] = useState<ComponentDef | null>(null);
  const [activeWireTool, setActiveWireTool] = useState<WireKind | null>(null);

  // Clipboard for Copy / Paste
  const [clipboard, setClipboard] = useState<ClipboardContent | null>(null);

  // Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<Pt>({ x: 40, y: 30 });

  // Update doc with optional history tracking (recordHistory=false during intermediate drag steps)
  const handleDocChange = useCallback(
    (newDoc: Doc, recordHistory: boolean = true) => {
      if (recordHistory) {
        setHistory((prev) => [...prev.slice(-40), doc]);
        setRedoStack([]);
      }
      setDoc(newDoc);
    },
    [doc]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || simState.running) return;
    const previous = history[history.length - 1];
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setRedoStack((prev) => [doc, ...prev]);
    setDoc(previous);
    setSelectedIds(new Set());
  }, [history, doc, simState.running]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0 || simState.running) return;
    const next = redoStack[0];
    setRedoStack((prev) => prev.slice(1));
    setHistory((prev) => [...prev, doc]);
    setDoc(next);
    setSelectedIds(new Set());
  }, [redoStack, doc, simState.running]);

  // Simulation execution loop
  useEffect(() => {
    if (!simState.running || simState.paused) return;

    const interval = setInterval(() => {
      setSimState((prevState) => stepSimulation(doc, prevState, 0.05));
    }, 50); // 20 Hz update loop

    return () => clearInterval(interval);
  }, [simState.running, simState.paused, doc]);

  const handleStartSim = () => {
    setSelectedIds(new Set());
    setActiveDefToPlace(null);
    setActiveWireTool(null);
    // Initialize simulation state and immediately run first step
    const initial = { ...createInitialSimState(), running: true };
    setSimState(stepSimulation(doc, initial, 0.05));
  };

  const handleStopSim = () => {
    setSimState(createInitialSimState());
  };

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0 || simState.running) return;
    const newElements = doc.elements.filter((el) => !selectedIds.has(el.id));
    const newWires = doc.wires.filter((w) => !selectedIds.has(w.id));
    handleDocChange({ ...doc, elements: newElements, wires: newWires });
    setSelectedIds(new Set());
  }, [selectedIds, simState.running, doc, handleDocChange]);

  const handleCopy = useCallback(() => {
    if (selectedIds.size === 0) return;
    const elements = doc.elements
      .filter((el) => selectedIds.has(el.id))
      .map((el) => ({ ...el, props: { ...el.props } }));
    const wires = doc.wires
      .filter((w) => selectedIds.has(w.id))
      .map((w) => ({ ...w, pts: w.pts.map((p) => ({ ...p })) }));

    if (elements.length === 0 && wires.length === 0) return;

    const xs: number[] = [];
    const ys: number[] = [];
    for (const el of elements) {
      xs.push(el.x);
      ys.push(el.y);
    }
    for (const w of wires) {
      for (const p of w.pts) {
        xs.push(p.x);
        ys.push(p.y);
      }
    }

    const basePoint = { x: snap(Math.min(...xs)), y: snap(Math.min(...ys)) };
    setClipboard({ elements, wires, basePoint });
  }, [selectedIds, doc]);

  const handlePaste = useCallback(
    (destPt?: Pt) => {
      if (!clipboard || simState.running) return;

      const target = destPt
        ? snapPt(destPt)
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

      const newIds = new Set<string>([
        ...newElements.map((el) => el.id),
        ...newWires.map((w) => w.id),
      ]);

      handleDocChange({
        ...doc,
        elements: [...doc.elements, ...newElements],
        wires: [...doc.wires, ...newWires],
      });

      setSelectedIds(newIds);
    },
    [clipboard, simState.running, doc, handleDocChange]
  );

  // Print handler
  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // Keyboard shortcuts: Ctrl+P (Print), Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndo();
        return;
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || e.key === 'Y' || (e.shiftKey && (e.key === 'z' || e.key === 'Z')))
      ) {
        e.preventDefault();
        handleRedo();
        return;
      }
    };
    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [handlePrint, handleUndo, handleRedo]);

  // Zoom helpers
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.2, 4.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z * 0.8, 0.25));
  const handleZoomFit = () => {
    const { w: sheetW, h: sheetH } = getSheetDimensions(doc.sheet.format, doc.sheet.orientation);
    const containerW = window.innerWidth - 320 - 280;
    const containerH = window.innerHeight - 56;
    const scale = Math.min(containerW / sheetW, containerH / sheetH) * 0.9;
    setZoom(Math.max(0.3, Math.min(scale, 1.5)));
    setPan({ x: 30, y: 30 });
  };

  const { w: sheetW, h: sheetH } = getSheetDimensions(doc.sheet.format, doc.sheet.orientation);

  return (
    <>
      {/* 1. Main Interactive Screen Application UI */}
      <div
        className="app-screen-ui"
        style={{ display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh', overflow: 'hidden' }}
      >
        {/* Top Application Toolbar */}
        <Toolbar
          doc={doc}
          onDocChange={handleDocChange}
          simState={simState}
          onStartSim={handleStartSim}
          onStopSim={handleStopSim}
          canUndo={history.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onPrint={handlePrint}
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomFit={handleZoomFit}
        />

        {/* Cavi & Connessioni Sub-Toolbar (matching CADe_SIMU) */}
        <WireToolbar
          activeWireTool={activeWireTool}
          onSelectWireTool={(tool) => {
            setActiveWireTool(tool);
            if (tool) {
              setActiveDefToPlace(null);
              setSelectedIds(new Set());
            }
          }}
          disabled={simState.running}
        />

        {/* Main Workspace Area */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {/* Left Component Palette */}
          <ComponentPalette
            activeDef={activeDefToPlace}
            onSelectDef={(def) => {
              setActiveDefToPlace(def);
              if (def) {
                setSelectedIds(new Set());
                setActiveWireTool(null);
              }
            }}
            disabled={simState.running}
          />

          {/* Central Schematic Canvas */}
          <SchematicCanvas
            doc={doc}
            onDocChange={handleDocChange}
            simState={simState}
            onSimStateChange={setSimState}
            selectedIds={selectedIds}
            onSelectIds={setSelectedIds}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedIds(id ? new Set([id]) : new Set());
              if (id) setActiveDefToPlace(null);
            }}
            activeDefToPlace={activeDefToPlace}
            onPlacedDef={() => setActiveDefToPlace(null)}
            activeWireTool={activeWireTool}
            onSelectWireTool={setActiveWireTool}
            clipboard={clipboard}
            onCopySelected={handleCopy}
            onPaste={handlePaste}
            onDeleteSelected={handleDeleteSelected}
            zoom={zoom}
            onZoomChange={setZoom}
            pan={pan}
            onPanChange={setPan}
          />

          {/* Right Properties & Settings Panel */}
          <PropertiesPanel
            selectedId={selectedId}
            selectedIds={selectedIds}
            doc={doc}
            onDocChange={handleDocChange}
            onDeleteSelected={handleDeleteSelected}
            onCopySelected={handleCopy}
          />
        </div>
      </div>

      {/* 2. Pure Vector Drawing Sheet for Printing and PDF Export (Borders + Cartiglio ISO 7200 + Schematic) */}
      <div className="print-only" id="electroforge-print-sheet">
        <style>{`
          @media print {
            @page {
              size: ${doc.sheet.format} ${doc.sheet.orientation};
              margin: 4mm;
            }
          }
        `}</style>
        <svg
          viewBox={`0 0 ${sheetW} ${sheetH}`}
          width="100%"
          height="100%"
          style={{ display: 'block', backgroundColor: '#ffffff' }}
        >
          <Renderer
            doc={doc}
            simState={createInitialSimState()}
            selectedId={null}
            selectedIds={new Set()}
          />
        </svg>
      </div>
    </>
  );
};
