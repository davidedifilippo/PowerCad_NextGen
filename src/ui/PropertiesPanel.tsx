import React from 'react';
import { Doc } from '../model/types';
import { registry } from '../library/registry';
import { Trash2, RotateCw, Settings, Info, Layers, Copy } from 'lucide-react';

interface Props {
  selectedId: string | null;
  selectedIds?: Set<string>;
  doc: Doc;
  onDocChange: (doc: Doc) => void;
  onDeleteSelected: () => void;
  onCopySelected?: () => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  selectedId,
  selectedIds,
  doc,
  onDocChange,
  onDeleteSelected,
  onCopySelected,
}) => {
  if (selectedIds && selectedIds.size > 1) {
    const elemCount = doc.elements.filter((el) => selectedIds.has(el.id)).length;
    const wireCount = doc.wires.filter((w) => selectedIds.has(w.id)).length;

    return (
      <div style={panelContainerStyle}>
        <div style={panelHeaderStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Selezione Multipla</span>
          </div>
          <button onClick={onDeleteSelected} style={deleteBtnStyle} title="Elimina selezione (Canc)">
            <Trash2 size={14} /> Elimina
          </button>
        </div>

        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Elementi Selezionati</label>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
              {selectedIds.size} oggetti totali
            </div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              • {elemCount} {elemCount === 1 ? 'componente' : 'componenti'}
              <br />
              • {wireCount} {wireCount === 1 ? 'conduttore / filo' : 'conduttori / fili'}
            </div>
          </div>

          <div
            style={{
              fontSize: 12,
              color: '#64748b',
              lineHeight: '18px',
              backgroundColor: '#f8fafc',
              padding: 10,
              borderRadius: 6,
            }}
          >
            Puoi trascinare l'intera sezione per riposizionarla, premere <b>Canc</b> per eliminarla,
            oppure premere <b>Ctrl+C</b> per copiarla.
          </div>

          {onCopySelected && (
            <button
              onClick={onCopySelected}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px 12px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              <Copy size={14} color="#2563eb" />
              <span>Copia Sezione (Ctrl+C)</span>
            </button>
          )}

          <button
            onClick={onDeleteSelected}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #fca5a5',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              fontWeight: 600,
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            <Trash2 size={14} color="#dc2626" />
            <span>Elimina Sezione (Canc)</span>
          </button>
        </div>
      </div>
    );
  }

  if (!selectedId) {
    return (
      <div style={panelContainerStyle}>
        <div style={emptyHeaderStyle}>
          <Info size={16} color="#94a3b8" />
          <span style={{ fontSize: 13, color: '#64748b' }}>Nessun elemento selezionato</span>
        </div>
        <div style={{ padding: 16, fontSize: 12, color: '#94a3b8', lineHeight: '18px' }}>
          Clicca su un componente o un conduttore per visualizzare o modificare le sue proprietà, la sigla
          di collegamento (es. <code style={{ color: '#0f172a' }}>-KM1</code>) o ruotarlo.
        </div>
      </div>
    );
  }

  // Check if selected is an element
  const elem = doc.elements.find((el) => el.id === selectedId);
  if (!elem) {
    // Might be a wire
    const wire = doc.wires.find((w) => w.id === selectedId);
    return (
      <div style={panelContainerStyle}>
        <div style={panelHeaderStyle}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Conduttore / Filo</span>
          <button onClick={onDeleteSelected} style={deleteBtnStyle} title="Elimina filo (Canc)">
            <Trash2 size={14} /> Elimina
          </button>
        </div>
        <div style={{ padding: 16, fontSize: 12, color: '#64748b' }}>
          Segmenti: {wire?.pts.length ? wire.pts.length - 1 : 0}
        </div>
      </div>
    );
  }

  const def = registry.get(elem.def);

  const handleTagChange = (newTag: string) => {
    const updated = doc.elements.map((el) => (el.id === elem.id ? { ...el, tag: newTag } : el));
    onDocChange({ ...doc, elements: updated });
  };

  const handleRotate = () => {
    const nextRot = ((elem.rot + 90) % 360) as 0 | 90 | 180 | 270;
    const updated = doc.elements.map((el) => (el.id === elem.id ? { ...el, rot: nextRot } : el));
    onDocChange({ ...doc, elements: updated });
  };

  const handlePropChange = (key: string, val: string | number) => {
    const updated = doc.elements.map((el) =>
      el.id === elem.id ? { ...el, props: { ...el.props, [key]: val } } : el
    );
    onDocChange({ ...doc, elements: updated });
  };

  return (
    <div style={panelContainerStyle}>
      {/* Header */}
      <div style={panelHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Settings size={15} color="#3b82f6" />
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a' }}>Proprietà Oggetto</span>
        </div>
        <button onClick={onDeleteSelected} style={deleteBtnStyle} title="Elimina elemento (Canc)">
          <Trash2 size={14} /> Elimina
        </button>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Component Name */}
        <div>
          <label style={labelStyle}>Componente</label>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>
            {def?.name || elem.def}
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            Categoria: {def?.category}
          </div>
          {def?.description && (
            <div
              style={{
                fontSize: 11,
                color: '#475569',
                marginTop: 6,
                padding: '6px 8px',
                backgroundColor: '#f8fafc',
                borderRadius: 5,
                borderLeft: '3px solid #3b82f6',
                lineHeight: '15px',
              }}
            >
              {def.description}
            </div>
          )}
        </div>

        {/* Tag / Sigla */}
        <div>
          <label style={labelStyle}>Sigla / Riferimento Tag</label>
          <input
            type="text"
            value={elem.tag}
            onChange={(e) => handleTagChange(e.target.value)}
            placeholder="-KM1, -SB1..."
            style={inputStyle}
          />
          <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4, display: 'block' }}>
            I contatti con la stessa sigla della bobina (es. -KM1) commutano automaticamente insieme.
          </span>
        </div>

        {/* Rotation */}
        <div>
          <label style={labelStyle}>Orientamento</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{elem.rot}°</span>
            <button onClick={handleRotate} style={secondaryBtnStyle}>
              <RotateCw size={13} /> Ruota di 90° (R)
            </button>
          </div>
        </div>

        {/* Dynamic Properties */}
        {def?.props && def.props.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
            <label style={labelStyle}>Parametri Specifici</label>
            {def.props.map((p) => {
              const val = elem.props[p.key] ?? p.default;
              return (
                <div key={p.key} style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#475569', display: 'block', marginBottom: 4 }}>
                    {p.label}
                  </span>
                  {p.type === 'select' && p.options ? (
                    <select
                      value={String(val)}
                      onChange={(e) => handlePropChange(p.key, e.target.value)}
                      style={inputStyle}
                    >
                      {p.options.map((opt) => {
                        const optVal = typeof opt === 'string' ? opt : opt.value;
                        const optLabel = typeof opt === 'string' ? opt : opt.label;
                        return (
                          <option key={optVal} value={optVal}>
                            {optLabel}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type={p.type === 'number' ? 'number' : 'text'}
                      value={val}
                      onChange={(e) =>
                        handlePropChange(
                          p.key,
                          p.type === 'number' ? Number(e.target.value) : e.target.value
                        )
                      }
                      style={inputStyle}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Terminals summary */}
        {def?.terminals && def.terminals.length > 0 && (
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 10 }}>
            <label style={labelStyle}>Morsetti ({def.terminals.length})</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {def.terminals.map((t) => (
                <span
                  key={t.id}
                  style={{
                    fontSize: 11,
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 4,
                    padding: '2px 6px',
                    color: '#334155',
                    fontWeight: 600,
                  }}
                >
                  {t.label || t.id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const panelContainerStyle: React.CSSProperties = {
  width: 280,
  height: '100%',
  backgroundColor: '#ffffff',
  borderLeft: '1px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '-2px 0 8px rgba(0,0,0,0.04)',
  zIndex: 10,
};

const panelHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const emptyHeaderStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderBottom: '1px solid #f1f5f9',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#64748b',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 4,
  display: 'block',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 10px',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  fontSize: 13,
  color: '#0f172a',
  outline: 'none',
  fontWeight: 500,
};

const deleteBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  padding: '4px 8px',
  borderRadius: 4,
  border: '1px solid #fecaca',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 4,
  border: '1px solid #cbd5e1',
  backgroundColor: '#f8fafc',
  color: '#334155',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
};
