import React, { useState, useEffect } from 'react';
import { Doc } from '../model/types';
import {
  getRecentProjects,
  removeRecentProject,
  clearRecentProjects,
  RecentProjectItem,
} from '../utils/recentProjects';
import {
  Clock,
  FileText,
  Trash2,
  X,
  ExternalLink,
  FolderOpen,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (doc: Doc, fileName: string) => void;
}

export const RecentProjectsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenProject,
}) => {
  const [recents, setRecents] = useState<RecentProjectItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setRecents(getRecentProjects());
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (item: RecentProjectItem) => {
    onOpenProject(item.doc, item.fileName);
    onClose();
  };

  const handleRemove = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = removeRecentProject(id);
    setRecents(updated);
  };

  const handleClearAll = () => {
    if (window.confirm('Vuoi rimuovere tutti i progetti recenti dalla cronologia?')) {
      clearRecentProjects();
      setRecents([]);
    }
  };

  const formatDate = (isoString: string): string => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 620,
          maxHeight: '80vh',
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Clock size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#f8fafc' }}>
                Progetti Recenti
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                Cronologia locale degli schemi salvati su questo browser
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* List of projects */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {recents.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: '#64748b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <FolderOpen size={36} color="#cbd5e1" />
              <div style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>
                Nessun progetto recente
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>
                Quando salvi o apri uno schema, comparirà automaticamente qui per ritrovarlo subito.
              </div>
            </div>
          ) : (
            recents.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                  e.currentTarget.style.borderColor = '#93c5fd';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      backgroundColor: '#eff6ff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #bfdbfe',
                    }}
                  >
                    <FileText size={18} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                      <code>{item.fileName}</code> • Salvato il {formatDate(item.savedAt)}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 10.5,
                        color: '#94a3b8',
                        marginTop: 4,
                      }}
                    >
                      <span>
                        <b>{item.sheetCount}</b> {item.sheetCount === 1 ? 'Foglio' : 'Fogli'}
                      </span>
                      <span>•</span>
                      <span>
                        <b>{item.elementCount}</b> Componenti
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, item.id)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      padding: 6,
                      borderRadius: 4,
                    }}
                    title="Rimuovi dalla cronologia"
                  >
                    <Trash2 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '6px 12px',
                      borderRadius: 6,
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <ExternalLink size={13} />
                    <span>Apri</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {recents.length > 0 ? (
            <button
              type="button"
              onClick={handleClearAll}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#dc2626',
                fontSize: 12,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Svuota cronologia
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              color: '#475569',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};
