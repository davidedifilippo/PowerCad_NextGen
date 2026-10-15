import React from 'react';
import { Doc, Pt } from '../model/types';
import { registry } from '../library/registry';
import { RotateCw, Trash2, Tag, Sliders, X, Copy, ClipboardPaste, Layers } from 'lucide-react';

interface Props {
  x: number;
  y: number;
  elemId?: string | null;
  worldPos?: Pt;
  selectedIds: Set<string>;
  doc: Doc;
  onDocChange: (doc: Doc) => void;
  onClose: () => void;
  onDeleteSelected: () => void;
  onCopySelected: () => void;
  onPaste: (destPt?: Pt) => void;
  hasClipboard: boolean;
}

export const ContextMenu: React.FC<Props> = ({
  x,
  y,
  elemId,
  worldPos,
  selectedIds,
  doc,
  onDocChange,
  onClose,
  onDeleteSelected,
  onCopySelected,
  onPaste,
  hasClipboard,
}) => {
  const isMulti = selectedIds.size > 1;
  const targetId = elemId || (selectedIds.size === 1 ? Array.from(selectedIds)[0] : null);
  const elem = targetId ? doc.elements.find((el) => el.id === targetId) : null;
  const wire = !elem && targetId ? doc.wires.find((w) => w.id === targetId) : null;
  const def = elem ? registry.get(elem.def) : null;

  const handleTagChange = (newTag: string) => {
    if (!elem) return;
    const updated = doc.elements.map((el) => (el.id === elem.id ? { ...el, tag: newTag } : el));
    onDocChange({ ...doc, elements: updated });
  };

  const handleRotate = () => {
    if (!elem) return;
    const nextRot = ((elem.rot + 90) % 360) as 0 | 90 | 180 | 270;
    const updated = doc.elements.map((el) => (el.id === elem.id ? { ...el, rot: nextRot } : el));
    onDocChange({ ...doc, elements: updated });
  };

  const handlePropChange = (key: string, val: string | number) => {
    if (!elem) return;
    const updated = doc.elements.map((el) =>
      el.id === elem.id ? { ...el, props: { ...el.props, [key]: val } } : el
    );
    onDocChange({ ...doc, elements: updated });
  };

  // Adjust position so it doesn't overflow screen bounds
  const menuWidth = 240;
  const menuHeight = isMulti ? 180 : wire ? 160 : elem ? 320 : 120;
  const left = Math.min(x, window.innerWidth - menuWidth - 16);
  const top = Math.min(y, window.innerHeight - menuHeight - 16);

  // 1. Multiple items selected
  if (isMulti) {
    const elemCount = doc.elements.filter((el) => selectedIds.has(el.id)).length;
    const wireCount = doc.wires.filter((w) => selectedIds.has(w.id)).length;

    return (
      <div style={{ ...menuContainerStyle, left, top, width: menuWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Layers size={15} color="#2563eb" />
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block' }}>
                Selezione Multipla
              </span>
              <span style={{ fontSize: 10, color: '#64748b' }}>
                {elemCount > 0 ? `${elemCount} comp. ` : ''}
                {wireCount > 0 ? `${wireCount} cavi` : ''}
              </span>
            </div>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          <button
            onClick={() => {
              onCopySelected();
              onClose();
            }}
            style={menuItemBtnStyle}
          >
            <Copy size={13} color="#2563eb" />
            <span>Copia sezione (Ctrl+C)</span>
          </button>

          {hasClipboard && (
            <button
              onClick={() => {
                onPaste(worldPos);
                onClose();
              }}
              style={menuItemBtnStyle}
            >
              <ClipboardPaste size={13} color="#16a34a" />
              <span>Incolla qui (Ctrl+V)</span>
            </button>
          )}

          <button
            onClick={() => {
              onDeleteSelected();
              onClose();
            }}
            style={{ ...menuItemBtnStyle, color: '#dc2626' }}
          >
            <Trash2 size={13} color="#dc2626" />
            <span>Elimina selezione (Canc)</span>
          </button>
        </div>
      </div>
    );
  }

  // 2. Single Wire selected
  if (wire) {
    return (
      <div style={{ ...menuContainerStyle, left, top, width: menuWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block' }}>
              Conduttore Elettrico
            </span>
            <span style={{ fontSize: 10, color: '#64748b' }}>
              {wire.pts.length - 1} {wire.pts.length - 1 === 1 ? 'segmento' : 'segmenti'}
            </span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          <button
            onClick={() => {
              onCopySelected();
              onClose();
            }}
            style={menuItemBtnStyle}
          >
            <Copy size={13} color="#2563eb" />
            <span>Copia filo (Ctrl+C)</span>
          </button>

          {hasClipboard && (
            <button
              onClick={() => {
                onPaste(worldPos);
                onClose();
              }}
              style={menuItemBtnStyle}
            >
              <ClipboardPaste size={13} color="#16a34a" />
              <span>Incolla qui (Ctrl+V)</span>
            </button>
          )}

          <button
            onClick={() => {
              onDeleteSelected();
              onClose();
            }}
            style={{ ...menuItemBtnStyle, color: '#dc2626' }}
          >
            <Trash2 size={13} color="#dc2626" />
            <span>Elimina filo (Canc)</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Single Element selected
  if (elem) {
    return (
      <div style={{ ...menuContainerStyle, left, top, width: menuWidth }} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', display: 'block' }}>
              {def?.name || elem.def}
            </span>
            <span style={{ fontSize: 10, color: '#64748b' }}>{def?.category}</span>
          </div>
          <button onClick={onClose} style={closeBtnStyle}>
            <X size={14} />
          </button>
        </div>

        {/* Tag editor */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            <Tag size={12} color="#64748b" />
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Sigla / Riferimento</span>
          </div>
          <input
            type="text"
            value={elem.tag}
            onChange={(e) => handleTagChange(e.target.value)}
            placeholder="-KM1, -H1..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '5px 8px',
              fontSize: 12,
              borderRadius: 4,
              border: '1px solid #cbd5e1',
              outline: 'none',
            }}
          />
        </div>

        {/* Specific properties */}
        {def?.props && def.props.length > 0 && (
          <div style={{ marginBottom: 10, borderTop: '1px solid #f8fafc', paddingTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Sliders size={12} color="#64748b" />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Parametri</span>
            </div>

            {def.props.map((p) => {
              const currentVal = elem.props[p.key] ?? p.default;
              if (p.key === 'color' && p.options) {
                const colorMap: Record<string, string> = {
                  Verde: '#22c55e',
                  Rosso: '#ef4444',
                  Giallo: '#eab308',
                  Blu: '#3b82f6',
                  Bianco: '#e2e8f0',
                };

                return (
                  <div key={p.key} style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                    {p.options.map((opt) => {
                      const optVal = typeof opt === 'string' ? opt : opt.value;
                      const isCur = String(currentVal) === optVal;
                      const bg = colorMap[optVal] || '#94a3b8';
                      return (
                        <button
                          key={optVal}
                          title={optVal}
                          onClick={() => handlePropChange(p.key, optVal)}
                          style={{
                            flex: 1,
                            height: 24,
                            borderRadius: 4,
                            backgroundColor: bg,
                            border: isCur ? '2px solid #0f172a' : '1px solid rgba(0,0,0,0.15)',
                            cursor: 'pointer',
                            boxShadow: isCur ? '0 0 4px rgba(0,0,0,0.3)' : 'none',
                          }}
                        />
                      );
                    })}
                  </div>
                );
              }

              return (
                <div key={p.key} style={{ marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b', display: 'block', marginBottom: 2 }}>
                    {p.label}
                  </span>
                  <input
                    type={p.type === 'number' ? 'number' : 'text'}
                    value={currentVal}
                    onChange={(e) =>
                      handlePropChange(
                        p.key,
                        p.type === 'number' ? Number(e.target.value) : e.target.value
                      )
                    }
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid #cbd5e1',
                      outline: 'none',
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid #f1f5f9', paddingTop: 8 }}>
          <button onClick={handleRotate} style={menuItemBtnStyle}>
            <RotateCw size={13} color="#2563eb" />
            <span>Ruota 90° (R)</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#94a3b8' }}>{elem.rot}°</span>
          </button>

          <button
            onClick={() => {
              onCopySelected();
              onClose();
            }}
            style={menuItemBtnStyle}
          >
            <Copy size={13} color="#2563eb" />
            <span>Copia (Ctrl+C)</span>
          </button>

          {hasClipboard && (
            <button
              onClick={() => {
                onPaste(worldPos);
                onClose();
              }}
              style={menuItemBtnStyle}
            >
              <ClipboardPaste size={13} color="#16a34a" />
              <span>Incolla qui (Ctrl+V)</span>
            </button>
          )}

          <button
            onClick={() => {
              onDeleteSelected();
              onClose();
            }}
            style={{ ...menuItemBtnStyle, color: '#dc2626' }}
          >
            <Trash2 size={13} color="#dc2626" />
            <span>Elimina componente (Canc)</span>
          </button>
        </div>
      </div>
    );
  }

  // 4. Clicked on empty canvas
  return (
    <div style={{ ...menuContainerStyle, left, top, width: menuWidth }} onClick={(e) => e.stopPropagation()}>
      <div style={headerStyle}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Menu Schema</span>
        <button onClick={onClose} style={closeBtnStyle}>
          <X size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
        {hasClipboard ? (
          <button
            onClick={() => {
              onPaste(worldPos);
              onClose();
            }}
            style={menuItemBtnStyle}
          >
            <ClipboardPaste size={13} color="#16a34a" />
            <span>Incolla qui (Ctrl+V)</span>
          </button>
        ) : (
          <div style={{ padding: '8px 4px', fontSize: 11, color: '#94a3b8', fontStyle: 'italic' }}>
            Nessun elemento negli appunti. Seleziona e copia (Ctrl+C) componenti o cavi.
          </div>
        )}
      </div>
    </div>
  );
};

const menuContainerStyle: React.CSSProperties = {
  position: 'fixed',
  backgroundColor: '#ffffff',
  borderRadius: 8,
  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2), 0 0 1px 1px rgba(0,0,0,0.08)',
  zIndex: 9999,
  padding: 10,
  fontFamily: 'inherit',
  userSelect: 'none',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: 8,
  borderBottom: '1px solid #f1f5f9',
  marginBottom: 8,
};

const closeBtnStyle: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  padding: 2,
  color: '#94a3b8',
};

const menuItemBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '6px 8px',
  borderRadius: 4,
  border: 'none',
  backgroundColor: '#f8fafc',
  fontSize: 12,
  fontWeight: 500,
  color: '#1e293b',
  cursor: 'pointer',
  textAlign: 'left',
};
