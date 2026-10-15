import React, { useRef } from 'react';
import { Doc, SheetFormat } from '../model/types';
import { SimState } from '../engine/simulation';
import {
  Play,
  Square,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FilePlus,
  FolderOpen,
  Save,
  Printer,
  FileText,
} from 'lucide-react';

interface Props {
  doc: Doc;
  onDocChange: (doc: Doc) => void;
  simState: SimState;
  onStartSim: () => void;
  onStopSim: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPrint: () => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
}

export const Toolbar: React.FC<Props> = ({
  doc,
  onDocChange,
  simState,
  onStartSim,
  onStopSim,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onPrint,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomFit,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheet format change handler
  const handleFormatChange = (newFormat: SheetFormat) => {
    onDocChange({
      ...doc,
      sheet: { ...doc.sheet, format: newFormat },
    });
  };

  const handleOrientationChange = (orientation: 'landscape' | 'portrait') => {
    onDocChange({
      ...doc,
      sheet: { ...doc.sheet, orientation },
    });
  };

  // Export JSON file
  const handleSaveJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(doc, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `${doc.sheet.title || 'schema'}.json`;
    a.click();
  };

  // Open JSON file
  const handleOpenJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const loaded = JSON.parse(event.target?.result as string);
        if (loaded.elements && loaded.wires && loaded.sheet) {
          onDocChange(loaded);
        } else {
          alert('Il file non sembra uno schema valido.');
        }
      } catch (err) {
        alert('Errore nel parsing del file JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 16px',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderBottom: '1px solid #334155',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleOpenJson}
      />

      {/* Brand & Document info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: 14,
            }}
          >
            ⚡
          </div>
          <div>
            <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '0.5px' }}>
              Electro<span style={{ color: '#38bdf8' }}>Forge</span>
            </span>
          </div>
        </div>

        {/* Separator */}
        <div style={{ width: 1, height: 24, backgroundColor: '#334155' }} />

        {/* File actions */}
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            title="Nuovo Schema"
            style={btnStyle}
            onClick={() => {
              if (confirm('Vuoi creare un nuovo schema vuoto?')) {
                onDocChange({
                  app: 'electroforge',
                  version: 1,
                  sheet: { ...doc.sheet, title: 'Nuovo Schema' },
                  elements: [],
                  wires: [],
                });
              }
            }}
          >
            <FilePlus size={16} /> Nuovo
          </button>
          <button
            title="Apri file JSON"
            style={btnStyle}
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={16} /> Apri
          </button>
          <button title="Salva file JSON" style={btnStyle} onClick={handleSaveJson}>
            <Save size={16} /> Salva
          </button>
          <button
            title="Stampa Foglio di Disegno / Esporta PDF (Ctrl+P)"
            style={btnStyle}
            onClick={onPrint}
          >
            <Printer size={16} /> Stampa
          </button>
        </div>
      </div>

      {/* Format & Dimensions Selector (A4 <-> A3) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: '#0f172a', padding: '4px 10px', borderRadius: 6 }}>
        <FileText size={15} color="#94a3b8" />
        <span style={{ fontSize: 12, color: '#94a3b8' }}>Foglio:</span>
        <select
          value={doc.sheet.format}
          onChange={(e) => handleFormatChange(e.target.value as SheetFormat)}
          style={selectStyle}
        >
          <option value="A4">A4 (Piccolo)</option>
          <option value="A3">A3 (Consigliato per schemi grandi)</option>
          <option value="A2">A2 (Molto grande)</option>
        </select>

        <select
          value={doc.sheet.orientation}
          onChange={(e) => handleOrientationChange(e.target.value as 'landscape' | 'portrait')}
          style={selectStyle}
        >
          <option value="landscape">Orizzontale</option>
          <option value="portrait">Verticale</option>
        </select>
      </div>

      {/* History & Zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          title="Annulla (Ctrl+Z)"
          style={{ ...btnStyle, opacity: canUndo ? 1 : 0.4 }}
          disabled={!canUndo}
          onClick={onUndo}
        >
          <RotateCcw size={15} />
        </button>
        <button
          title="Ripristina (Ctrl+Y)"
          style={{ ...btnStyle, opacity: canRedo ? 1 : 0.4 }}
          disabled={!canRedo}
          onClick={onRedo}
        >
          <RotateCw size={15} />
        </button>

        <div style={{ width: 1, height: 20, backgroundColor: '#334155', margin: '0 4px' }} />

        <button title="Zoom Indietro" style={btnStyle} onClick={onZoomOut}>
          <ZoomOut size={15} />
        </button>
        <span style={{ fontSize: 12, minWidth: 42, textAlign: 'center', color: '#cbd5e1' }}>
          {Math.round(zoom * 100)}%
        </span>
        <button title="Zoom Avanti" style={btnStyle} onClick={onZoomIn}>
          <ZoomIn size={15} />
        </button>
        <button title="Adatta allo schermo" style={btnStyle} onClick={onZoomFit}>
          <Maximize2 size={15} />
        </button>
      </div>

      {/* Simulation Controls (Play / Stop) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {!simState.running ? (
          <button
            onClick={onStartSim}
            style={{
              ...simBtnStyle,
              backgroundColor: '#16a34a',
              color: '#ffffff',
              boxShadow: '0 0 10px rgba(22,163,74,0.4)',
            }}
          >
            <Play size={17} fill="#ffffff" />
            <span>AVVIA SIMULAZIONE</span>
          </button>
        ) : (
          <button
            onClick={onStopSim}
            style={{
              ...simBtnStyle,
              backgroundColor: '#dc2626',
              color: '#ffffff',
              boxShadow: '0 0 10px rgba(220,38,38,0.4)',
            }}
          >
            <Square size={16} fill="#ffffff" />
            <span>STOP SIMULAZIONE</span>
          </button>
        )}
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 10px',
  backgroundColor: '#334155',
  color: '#f8fafc',
  border: 'none',
  borderRadius: 5,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background 0.15s ease',
};

const selectStyle: React.CSSProperties = {
  backgroundColor: '#1e293b',
  color: '#f8fafc',
  border: '1px solid #475569',
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 12,
  outline: 'none',
  cursor: 'pointer',
};

const simBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 16px',
  borderRadius: 6,
  border: 'none',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
  letterSpacing: '0.5px',
};
