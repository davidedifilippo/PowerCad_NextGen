import React, { useState, useEffect, useCallback } from 'react';
import { Doc, ComponentDef, Pt, WireKind, Element, Wire } from './model/types';
import { SAMPLE_DIRECT_START } from './samples/directStart';
import { createInitialSimState, stepSimulation, SimState } from './engine/simulation';
import { getSheetDimensions, snap, snapPt } from './utils/geometry';
import { Toolbar } from './ui/Toolbar';
import { WireToolbar, WIRE_COLOR_MAP } from './ui/WireToolbar';
import { ComponentPalette } from './ui/ComponentPalette';
import { SchematicCanvas } from './editor/SchematicCanvas';
import { PropertiesPanel } from './ui/PropertiesPanel';
import { Renderer } from './editor/Renderer';
import { AlertTriangle, ShieldAlert, X, CheckCircle2 } from 'lucide-react';
import { registry } from './library/registry';
import { TextModal, TextConfig } from './ui/TextModal';
import { CartiglioModal } from './ui/CartiglioModal';
import { PlcCodeModal } from './ui/PlcCodeModal';
import { SaveDialogModal } from './ui/SaveDialogModal';
import { RecentProjectsModal } from './ui/RecentProjectsModal';
import { AiCopilotDrawer } from './ui/AiCopilotDrawer';
import { useMcpBridge } from './mcp/useMcpBridge';
import { PageBar } from './ui/PageBar';
import { getDocPages, normalizeDocWithPages } from './utils/pageUtils';
import { saveDocToHandle, FileSaveResult } from './utils/fileSystemUtils';
import { addRecentProject } from './utils/recentProjects';

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
  const [showTextModal, setShowTextModal] = useState<boolean>(false);
  const [showCartiglioModal, setShowCartiglioModal] = useState<boolean>(false);
  const [plcModalElement, setPlcModalElement] = useState<Element | null>(null);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [showRecentsModal, setShowRecentsModal] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [currentFileHandle, setCurrentFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [currentFileName, setCurrentFileName] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleConfirmText = (config: TextConfig) => {
    const textDef = registry.get('text_label');
    if (!textDef) return;
    const defToPlace: ComponentDef = {
      ...textDef,
      initialProps: {
        text: config.text,
        size: config.size,
        bold: config.bold ? 'true' : 'false',
        italic: config.italic ? 'true' : 'false',
        color: config.color,
        frame: config.frame,
      },
    };
    setSelectedIds(new Set());
    setActiveWireTool(null);
    setActiveDefToPlace(defToPlace);
    setShowTextModal(false);
  };

  // Clipboard for Copy / Paste
  const [clipboard, setClipboard] = useState<ClipboardContent | null>(null);

  // Viewport (Zoom & Pan)
  const [zoom, setZoom] = useState<number>(0.9);
  const [pan, setPan] = useState<Pt>({ x: 40, y: 30 });

  // Update doc with optional history tracking (recordHistory=false during intermediate drag steps)
  const handleDocChange = useCallback(
    (newDoc: Doc, recordHistory: boolean = true) => {
      const normalized = normalizeDocWithPages(newDoc);
      if (recordHistory) {
        setHistory((prev) => [...prev.slice(-40), doc]);
        setRedoStack([]);
      }
      setDoc(normalized);
    },
    [doc]
  );

  const handleSavePlcCode = (elementId: string, newStCode: string) => {
    const updated = doc.elements.map((el) =>
      el.id === elementId ? { ...el, props: { ...el.props, stCode: newStCode } } : el
    );
    handleDocChange({ ...doc, elements: updated });
    // Also update active modal element reference
    setPlcModalElement((prev) => (prev && prev.id === elementId ? { ...prev, props: { ...prev.props, stCode: newStCode } } : prev));
  };

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  const handleQuickSave = useCallback(async () => {
    if (currentFileHandle) {
      const res = await saveDocToHandle(doc, currentFileHandle);
      if (res.success) {
        addRecentProject(doc, res.fileName || currentFileName || 'schema.json');
        showToast(`Schema salvato su "${res.fileName}"`);
        return;
      }
    }
    setShowSaveModal(true);
  }, [doc, currentFileHandle, currentFileName, showToast]);

  const handleSaveSuccess = (result: FileSaveResult) => {
    if (result.handle) {
      setCurrentFileHandle(result.handle);
    }
    if (result.fileName) {
      setCurrentFileName(result.fileName);
      showToast(`Salvato con successo: "${result.fileName}"`);
    }
  };

  const handleOpenRecent = (recentDoc: Doc, fileName: string) => {
    handleDocChange(recentDoc);
    setCurrentFileName(fileName);
    setCurrentFileHandle(null);
    showToast(`Caricato progetto: "${fileName}"`);
  };

  // Global keyboard shortcut for Ctrl+S / Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleQuickSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleQuickSave]);

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

  // Real-time MCP Server Bridge (ws://localhost:4321)
  const { isMcpConnected } = useMcpBridge({
    doc,
    onDocChange: handleDocChange,
    simState,
    onSimStateChange: setSimState,
    onStartSim: handleStartSim,
    onStopSim: handleStopSim,
    currentFileName,
  });

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
          onOpenTextModal={() => setShowTextModal(true)}
          onOpenCartiglioModal={() => setShowCartiglioModal(true)}
          onSave={handleQuickSave}
          onSaveAs={() => setShowSaveModal(true)}
          onOpenRecents={() => setShowRecentsModal(true)}
          onToggleCopilot={() => setIsCopilotOpen((prev) => !prev)}
          isCopilotOpen={isCopilotOpen}
          isMcpConnected={isMcpConnected}
          currentFileName={currentFileName}
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
              // If wires are currently selected, convert them to this wire kind
              if (
                selectedIds.size > 0 &&
                tool !== '3p_vert' &&
                tool !== '3p_horiz' &&
                tool !== '3p_vert_staggered' &&
                tool !== '3p_horiz_staggered'
              ) {
                const hasWires = doc.wires.some((w) => selectedIds.has(w.id));
                if (hasWires) {
                  const updatedWires = doc.wires.map((w) =>
                    selectedIds.has(w.id)
                      ? { ...w, kind: tool, color: WIRE_COLOR_MAP[tool] }
                      : w
                  );
                  handleDocChange({ ...doc, wires: updatedWires });
                }
              }
              setSelectedIds(new Set());
            }
          }}
          disabled={simState.running}
        />

        {/* Multi-Page Navigation Bar */}
        <PageBar
          doc={doc}
          onDocChange={(newDoc) => {
            setSelectedIds(new Set());
            handleDocChange(newDoc);
          }}
          isSimRunning={simState.running}
        />

        {/* Main Workspace Area */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
          {/* Floating Fault Alert (e.g. Unprotected Ground Fault or Short Circuit) */}
          {simState.fault && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                backgroundColor: '#991b1b',
                color: '#ffffff',
                padding: '12px 20px',
                borderRadius: 8,
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid #f87171',
                maxWidth: 620,
              }}
            >
              <AlertTriangle size={24} color="#fca5a5" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.45 }}>
                <strong style={{ display: 'block', fontSize: 13.5, marginBottom: 2 }}>ATTENZIONE: GUASTO RILEVATO</strong>
                {simState.fault.message}
              </div>
              <button
                onClick={() => setSimState((prev) => ({ ...prev, fault: null }))}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: 4,
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Chiudi
              </button>
            </div>
          )}

          {/* Floating Protection Trip Toast (e.g. Differential Breaker / RCD Tripped) */}
          {simState.faultAlert && !simState.fault && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                backgroundColor: '#854d0e',
                color: '#fef08a',
                padding: '11px 18px',
                borderRadius: 8,
                boxShadow: '0 8px 26px rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                border: '1px solid #facc15',
                maxWidth: 600,
              }}
            >
              <ShieldAlert size={22} color="#fef08a" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4, color: '#fefce8' }}>
                <strong style={{ display: 'block', fontSize: 13, marginBottom: 2, color: '#fef08a' }}>
                  PROTEZIONE INTERVENUTA
                </strong>
                {simState.faultAlert.message}
              </div>
              <button
                onClick={() => setSimState((prev) => ({ ...prev, faultAlert: null }))}
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <X size={14} /> OK
              </button>
            </div>
          )}

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
            onEditTitleBlock={() => setShowCartiglioModal(true)}
            onOpenPlcEditor={(el) => setPlcModalElement(el)}
          />

          {/* Right Properties & Settings Panel */}
          <PropertiesPanel
            selectedId={selectedId}
            selectedIds={selectedIds}
            doc={doc}
            onDocChange={handleDocChange}
            onDeleteSelected={handleDeleteSelected}
            onCopySelected={handleCopy}
            onOpenPlcEditor={(el) => setPlcModalElement(el)}
          />
        </div>
      </div>

      {/* 2. Pure Vector Drawing Sheet for Printing and PDF Export (Borders + Cartiglio ISO 7200 + Schematic) */}
      <div className="print-only" id="powercad-print-sheet">
        <style>{`
          @media print {
            @page {
              size: ${doc.sheet.format} ${doc.sheet.orientation};
              margin: 4mm;
            }
            .print-page {
              page-break-after: always;
              height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
            }
          }
        `}</style>
        {getDocPages(doc).map((pageItem, pIdx, arr) => {
          const pageDoc: Doc = {
            ...doc,
            elements: pageItem.elements,
            wires: pageItem.wires,
            sheet: {
              ...doc.sheet,
              title: pageItem.title || doc.sheet.title,
              sheetNo: `${pIdx + 1}/${arr.length}`,
            },
          };
          return (
            <div key={pageItem.id} className="print-page">
              <svg
                viewBox={`0 0 ${sheetW} ${sheetH}`}
                width="100%"
                height="100%"
                style={{ display: 'block', backgroundColor: '#ffffff' }}
              >
                <Renderer
                  doc={pageDoc}
                  simState={createInitialSimState()}
                  selectedId={null}
                  selectedIds={new Set()}
                />
              </svg>
            </div>
          );
        })}
      </div>

      {/* 3. Text Insertion & Configuration Modal */}
      <TextModal
        isOpen={showTextModal}
        onClose={() => setShowTextModal(false)}
        onConfirm={handleConfirmText}
      />

      {/* 4. Title Block / Cartiglio Editing Modal */}
      <CartiglioModal
        isOpen={showCartiglioModal}
        onClose={() => setShowCartiglioModal(false)}
        sheet={doc.sheet}
        onSave={(newSheet) => handleDocChange({ ...doc, sheet: newSheet })}
      />

      {/* 5. PLC IEC 61131-3 Structured Text Modal */}
      <PlcCodeModal
        isOpen={Boolean(plcModalElement)}
        onClose={() => setPlcModalElement(null)}
        element={plcModalElement}
        simState={simState}
        onSave={handleSavePlcCode}
      />

      {/* 6. Save As Modal (draw.io style with Device/Drive choice) */}
      <SaveDialogModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        doc={doc}
        currentFileName={currentFileName}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* 7. Recent Projects Modal */}
      <RecentProjectsModal
        isOpen={showRecentsModal}
        onClose={() => setShowRecentsModal(false)}
        onOpenProject={handleOpenRecent}
      />

      {/* 8. AI Copilot Drawer */}
      <AiCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        doc={doc}
        onDocChange={handleDocChange}
        simState={simState}
      />

      {/* Floating Save / Action Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#0f172a',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: 8,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 2000,
            border: '1px solid #334155',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <CheckCircle2 size={18} color="#22c55e" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
};
