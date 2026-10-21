import React, { useState } from 'react';
import { Doc, SheetPage } from '../model/types';
import { getDocPages, getActivePageIndex, switchPage, addPage, deletePage, renamePage } from '../utils/pageUtils';
import { Plus, Trash2, Edit3, Check, FileText } from 'lucide-react';

interface Props {
  doc: Doc;
  onDocChange: (newDoc: Doc) => void;
  isSimRunning: boolean;
}

export const PageBar: React.FC<Props> = ({ doc, onDocChange, isSimRunning }) => {
  const pages: SheetPage[] = getDocPages(doc);
  const activeIdx = getActivePageIndex(doc);

  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  const handleSelectPage = (index: number) => {
    if (index === activeIdx) return;
    const updated = switchPage(doc, index);
    onDocChange(updated);
  };

  const handleAddPage = () => {
    if (isSimRunning) return;
    const updated = addPage(doc);
    onDocChange(updated);
  };

  const handleDeletePage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isSimRunning || pages.length <= 1) return;
    const confirmDelete = window.confirm(`Sei sicuro di voler eliminare la pagina "${pages[index].title}"?`);
    if (!confirmDelete) return;
    const updated = deletePage(doc, index);
    onDocChange(updated);
  };

  const startRename = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (isSimRunning) return;
    setEditingIdx(index);
    setEditTitle(pages[index].title);
  };

  const saveRename = () => {
    if (editingIdx !== null && editTitle.trim()) {
      const updated = renamePage(doc, editingIdx, editTitle.trim());
      onDocChange(updated);
    }
    setEditingIdx(null);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 34,
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #cbd5e1',
        padding: '0 12px',
        userSelect: 'none',
        zIndex: 5,
      }}
    >
      {/* Left: Page selection tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginRight: 8, color: '#475569', fontSize: 11, fontWeight: 700 }}>
          <FileText size={14} color="#2563eb" />
          <span>FOGLI SCHEMA:</span>
        </div>

        {pages.map((page, idx) => {
          const isActive = idx === activeIdx;
          const isEditing = editingIdx === idx;

          return (
            <div
              key={page.id}
              onClick={() => handleSelectPage(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                height: 26,
                borderRadius: 4,
                backgroundColor: isActive ? '#ffffff' : '#e2e8f0',
                border: isActive ? '1px solid #2563eb' : '1px solid #cbd5e1',
                boxShadow: isActive ? '0 1px 3px rgba(37,99,235,0.15)' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title={`Passa a ${page.title}`}
            >
              {/* Square page number button [ 1 ], [ 2 ], etc. */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 18,
                  height: 18,
                  borderRadius: 3,
                  backgroundColor: isActive ? '#2563eb' : '#94a3b8',
                  color: '#ffffff',
                  fontSize: 11,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              >
                {idx + 1}
              </span>

              {/* Title or input for rename */}
              {isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveRename();
                      if (e.key === 'Escape') setEditingIdx(null);
                    }}
                    autoFocus
                    style={{
                      height: 20,
                      width: 110,
                      fontSize: 11,
                      padding: '1px 4px',
                      border: '1px solid #2563eb',
                      borderRadius: 3,
                      outline: 'none',
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      saveRename();
                    }}
                    style={{
                      border: 'none',
                      background: '#2563eb',
                      color: '#ffffff',
                      borderRadius: 3,
                      padding: '2px 4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Check size={11} />
                  </button>
                </div>
              ) : (
                <span
                  onDoubleClick={(e) => startRename(e, idx)}
                  style={{
                    fontSize: 12,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#0f172a' : '#475569',
                    maxWidth: 160,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {page.title}
                </span>
              )}

              {/* Action buttons (rename & delete) */}
              {!isEditing && isActive && !isSimRunning && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 2 }}>
                  <button
                    onClick={(e) => startRename(e, idx)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#64748b',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      borderRadius: 2,
                    }}
                    title="Rinomina foglio"
                  >
                    <Edit3 size={11} />
                  </button>

                  {pages.length > 1 && (
                    <button
                      onClick={(e) => handleDeletePage(e, idx)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#ef4444',
                        cursor: 'pointer',
                        padding: 2,
                        display: 'flex',
                        alignItems: 'center',
                        borderRadius: 2,
                      }}
                      title="Elimina foglio"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Add new page button [+] */}
        {!isSimRunning && (
          <button
            onClick={handleAddPage}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              height: 26,
              padding: '0 8px',
              borderRadius: 4,
              border: '1px dashed #94a3b8',
              backgroundColor: '#f8fafc',
              color: '#334155',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Aggiungi nuovo foglio allo schema"
          >
            <Plus size={13} color="#2563eb" />
            <span>Nuovo Foglio</span>
          </button>
        )}
      </div>

      {/* Right: Info indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#64748b' }}>
        <span>
          Foglio <b>{activeIdx + 1}</b> di <b>{pages.length}</b>
        </span>
        {isSimRunning && (
          <span
            style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '2px 6px',
              borderRadius: 3,
              fontWeight: 700,
              fontSize: 10,
              border: '1px solid #86efac',
            }}
          >
            SIMULAZIONE MULTI-FOGLIO ATTIVA
          </span>
        )}
      </div>
    </div>
  );
};
