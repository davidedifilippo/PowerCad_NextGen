import React, { useState, useRef } from 'react';
import { ComponentDef } from '../model/types';
import { registry } from '../library/registry';
import { PlusCircle, Upload, Download, Search } from 'lucide-react';

interface Props {
  activeDef: ComponentDef | null;
  onSelectDef: (def: ComponentDef | null) => void;
  disabled?: boolean;
}

export const ComponentPalette: React.FC<Props> = ({
  activeDef,
  onSelectDef,
  disabled,
}) => {
  const [selectedCat, setSelectedCat] = useState<string>('Tutti');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [customJsonInput, setCustomJsonInput] = useState<string>('');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['Tutti', ...registry.getCategories()];
  const allComponents = registry.getAll();

  const filteredComponents = allComponents.filter((comp) => {
    const matchesCat = selectedCat === 'Tutti' || comp.category === selectedCat;
    const matchesSearch =
      comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      comp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (comp.tagPrefix && comp.tagPrefix.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleExportLibrary = () => {
    const jsonStr = registry.exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'electroforge-components-library.json';
    a.click();
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = registry.importFromJson(event.target?.result as string);
      if (res.error) {
        alert(`Errore importazione: ${res.error}`);
      } else {
        alert(`Importati con successo ${res.count} componenti nella libreria!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddCustomJson = () => {
    const res = registry.importFromJson(customJsonInput);
    if (res.error) {
      setImportStatus(`❌ Errore: ${res.error}`);
    } else {
      setImportStatus(`✅ Aggiunti ${res.count} componenti!`);
      setTimeout(() => {
        setShowJsonModal(false);
        setImportStatus(null);
        setCustomJsonInput('');
      }, 1200);
    }
  };

  return (
    <div
      style={{
        width: 320,
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        zIndex: 10,
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleImportJsonFile}
      />

      {/* Header */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Libreria Componenti
          </h2>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              title="Aggiungi o importa nuovo componente JSON"
              style={iconBtnStyle}
              onClick={() => setShowJsonModal(true)}
            >
              <PlusCircle size={15} />
            </button>
            <button
              title="Importa libreria JSON da file"
              style={iconBtnStyle}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={15} />
            </button>
            <button
              title="Esporta tutta la libreria in formato JSON"
              style={iconBtnStyle}
              onClick={handleExportLibrary}
            >
              <Download size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            padding: '4px 8px',
            gap: 6,
          }}
        >
          <Search size={14} color="#94a3b8" />
          <input
            type="text"
            placeholder="Cerca per nome, sigla (-KM)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 12,
              width: '100%',
              color: '#1e293b',
            }}
          />
        </div>

        {/* Category Pills */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            overflowX: 'auto',
            marginTop: 10,
            paddingBottom: 4,
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: 14,
                border: 'none',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                backgroundColor: selectedCat === cat ? '#3b82f6' : '#f1f5f9',
                color: selectedCat === cat ? '#ffffff' : '#475569',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Component Grid with BIG and clear icons */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          alignContent: 'start',
        }}
      >
        {filteredComponents.map((comp) => {
          const isSelected = activeDef?.id === comp.id;
          return (
            <div
              key={comp.id}
              title={comp.description ? `${comp.name}\n${comp.description}` : comp.name}
              onClick={() => {
                if (disabled) return;
                onSelectDef(isSelected ? null : comp);
              }}
              style={{
                padding: '10px 8px',
                borderRadius: 8,
                backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                border: isSelected ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                boxShadow: isSelected ? '0 0 8px rgba(59,130,246,0.25)' : 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              {/* Large Clear SVG Preview */}
              <div
                style={{
                  width: 60,
                  height: 60,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 6,
                }}
              >
                <svg
                  width="60"
                  height="60"
                  viewBox={
                    comp.bounds
                      ? `${comp.bounds.x - 4} ${comp.bounds.y - 4} ${comp.bounds.w + 8} ${comp.bounds.h + 8}`
                      : '-35 -35 70 70'
                  }
                >
                  {comp.symbol.map((p, idx) => {
                    if (p.when === 'on') return null; // Default off state in preview
                    if (p.t === 'line') {
                      return (
                        <line
                          key={idx}
                          x1={p.x1}
                          y1={p.y1}
                          x2={p.x2}
                          y2={p.y2}
                          stroke={p.stroke || '#0f172a'}
                          strokeWidth={p.w || 1.8}
                          strokeDasharray={p.dash ? '2 2' : undefined}
                          transform={p.transform}
                        />
                      );
                    }
                    if (p.t === 'circle') {
                      return (
                        <circle
                          key={idx}
                          cx={p.cx}
                          cy={p.cy}
                          r={p.r}
                          fill={p.fill || '#ffffff'}
                          stroke={p.stroke || '#0f172a'}
                          strokeWidth={1.5}
                          transform={p.transform}
                        />
                      );
                    }
                    if (p.t === 'rect') {
                      return (
                        <rect
                          key={idx}
                          x={p.x}
                          y={p.y}
                          width={p.w}
                          height={p.h}
                          fill={p.fill || '#ffffff'}
                          stroke={p.stroke || '#0f172a'}
                          strokeWidth={1.5}
                          transform={p.transform}
                        />
                      );
                    }
                    if (p.t === 'path') {
                      return (
                        <path
                          key={idx}
                          d={p.d}
                          fill={p.fill || 'none'}
                          stroke={p.stroke || '#0f172a'}
                          strokeWidth={1.5}
                          transform={p.transform}
                        />
                      );
                    }
                    if (p.t === 'text') {
                      const txt = p.text.includes('$')
                        ? p.text.replace(/\$([a-zA-Z0-9_]+)/g, (_, key) => {
                            const dp = comp.props?.find((pr) => pr.key === key);
                            return dp !== undefined ? String(dp.default) : '';
                          })
                        : p.text;
                      return (
                        <text
                          key={idx}
                          x={p.x}
                          y={p.y}
                          fontSize={p.size || 10}
                          fill={p.fill || '#0f172a'}
                          textAnchor={p.anchor || 'middle'}
                          fontWeight="bold"
                        >
                          {txt}
                        </text>
                      );
                    }
                    return null;
                  })}
                  {/* Power sources preview label */}
                  {(comp.id === 'pwr_l' ||
                    comp.id === 'pwr_n' ||
                    comp.id === 'pwr_pe' ||
                    comp.id === 'pwr_pe_line' ||
                    comp.id === 'pwr_dc_plus' ||
                    comp.id === 'pwr_dc_minus') && (
                    <text
                      x={-10}
                      y={4}
                      fontSize={11}
                      fontWeight="bold"
                      textAnchor="end"
                      fill={
                        comp.id === 'pwr_l' || comp.id === 'pwr_dc_plus'
                          ? '#ef4444'
                          : comp.id === 'pwr_n'
                          ? '#2563eb'
                          : comp.id === 'pwr_dc_minus'
                          ? '#0f172a'
                          : '#16a34a'
                      }
                    >
                      {comp.tagPrefix}
                    </text>
                  )}
                </svg>
              </div>

              {/* Title & Tag */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#1e293b',
                  lineHeight: '13px',
                  maxHeight: 26,
                  overflow: 'hidden',
                }}
              >
                {comp.name}
              </span>
              {comp.tagPrefix && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#64748b',
                    marginTop: 3,
                    backgroundColor: '#f1f5f9',
                    padding: '1px 5px',
                    borderRadius: 3,
                  }}
                >
                  Sigla: {comp.tagPrefix}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Instructions */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid #f1f5f9',
          backgroundColor: '#f8fafc',
          fontSize: 11,
          color: '#64748b',
          textAlign: 'center',
        }}
      >
        {activeDef ? (
          <span style={{ color: '#2563eb', fontWeight: 600 }}>
            📌 Clicca sullo schema per posizionare il componente
          </span>
        ) : (
          '💡 Seleziona un componente per aggiungerlo'
        )}
      </div>

      {/* JSON Import/Definition Modal */}
      {showJsonModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 8,
              width: 540,
              maxWidth: '90%',
              padding: 20,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ margin: '0 0 8px 0', fontSize: 16, color: '#0f172a' }}>
              Aggiungi Componente Descrittivo (JSON)
            </h3>
            <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px 0' }}>
              Incolla qui la definizione JSON del componente o dell'intera libreria. Puoi definire
              morsetti, primitive grafiche, comportamento elettrico (source, contact, coil, motor, ecc.).
            </p>

            <textarea
              rows={12}
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
              placeholder={`{
  "id": "rele_speciale",
  "name": "Relè Personalizzato",
  "category": "Personalizzati",
  "tagPrefix": "-K",
  "terminals": [
    { "id": "A1", "x": 0, "y": -20, "label": "A1" },
    { "id": "A2", "x": 0, "y": 20, "label": "A2" }
  ],
  "behavior": { "type": "coil", "a": "A1", "b": "A2", "mode": "mono" },
  "symbol": [
    { "t": "rect", "x": -10, "y": -12, "w": 20, "h": 24 }
  ]
}`}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
                fontSize: 12,
                padding: 10,
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                outline: 'none',
              }}
            />

            {importStatus && (
              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>
                {importStatus}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                onClick={() => {
                  setShowJsonModal(false);
                  setImportStatus(null);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Annulla
              </button>
              <button
                onClick={handleAddCustomJson}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Aggiungi alla Libreria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  borderRadius: 4,
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  color: '#334155',
  cursor: 'pointer',
};
