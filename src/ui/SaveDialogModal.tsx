import React, { useState, useEffect, useRef } from 'react';
import { Doc } from '../model/types';
import {
  saveDocWithPicker,
  FileSaveResult,
  sanitizeFileName,
} from '../utils/fileSystemUtils';
import { addRecentProject } from '../utils/recentProjects';
import { HelpCircle, HardDrive, Cloud } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: Doc;
  currentFileName?: string;
  onSaveSuccess: (result: FileSaveResult) => void;
}

export const SaveDialogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  doc,
  currentFileName,
  onSaveSuccess,
}) => {
  const defaultBaseName =
    currentFileName?.replace(/\.[^/.]+$/, '') ||
    doc.sheet?.title ||
    'Schema senza titolo';

  const [fileName, setFileName] = useState<string>(`${defaultBaseName}.json`);
  const [fileType, setFileType] = useState<'.json' | '.pwrcad'>('.json');
  const [destination, setDestination] = useState<'device' | 'gdrive_hint'>('device');
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const base =
        currentFileName?.replace(/\.[^/.]+$/, '') ||
        doc.sheet?.title ||
        'Schema senza titolo';
      setFileName(`${base}${fileType}`);
      setShowHelp(false);
      setIsSaving(false);

      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, doc, currentFileName]);

  // Update extension when fileType changes
  const handleTypeChange = (newType: '.json' | '.pwrcad') => {
    setFileType(newType);
    const base = fileName.replace(/\.[^/.]+$/, '');
    setFileName(`${base}${newType}`);
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const targetName = sanitizeFileName(fileName, fileType);
      const res = await saveDocWithPicker(doc, targetName, fileType);

      if (res.success && res.fileName) {
        addRecentProject(doc, res.fileName);
        onSaveSuccess(res);
        onClose();
      }
    } catch (err) {
      console.error('Errore salvataggio:', err);
    } finally {
      setIsSaving(false);
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
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          backgroundColor: '#26282b',
          borderRadius: 10,
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.55)',
          border: '1px solid #3c3f45',
          color: '#e4e7eb',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* Main form body (draw.io dark theme style) */}
        <div style={{ padding: '24px 28px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row 1: Salva come */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#d1d5db', textAlign: 'right' }}>Salva come:</label>
            <input
              ref={inputRef}
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
              }}
              style={{
                backgroundColor: '#1b1c1e',
                border: '1px solid #4b5563',
                borderRadius: 4,
                color: '#ffffff',
                padding: '7px 10px',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Row 2: Tipo */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#d1d5db', textAlign: 'right' }}>Tipo:</label>
            <select
              value={fileType}
              onChange={(e) => handleTypeChange(e.target.value as '.json' | '.pwrcad')}
              style={{
                backgroundColor: '#1b1c1e',
                border: '1px solid #4b5563',
                borderRadius: 4,
                color: '#ffffff',
                padding: '7px 10px',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              <option value=".json">File Schema PowerCAD (.json)</option>
              <option value=".pwrcad">File Progetto PowerCAD (.pwrcad)</option>
            </select>
          </div>

          {/* Row 3: Dove */}
          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', alignItems: 'center', gap: 12 }}>
            <label style={{ fontSize: 13, color: '#d1d5db', textAlign: 'right' }}>Dove:</label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value as 'device' | 'gdrive_hint')}
              style={{
                backgroundColor: '#1b1c1e',
                border: '1px solid #0284c7',
                borderRadius: 4,
                color: '#ffffff',
                padding: '7px 10px',
                fontSize: 13,
                outline: 'none',
                width: '100%',
                boxSizing: 'border-box',
                cursor: 'pointer',
              }}
            >
              <option value="device">Dispositivo (Scelta Cartella PC / Google Drive locale)</option>
              <option value="gdrive_hint">Google Drive (Cartella Sincronizzata su PC)</option>
            </select>
          </div>

          {/* Destination explanation note */}
          <div
            style={{
              marginLeft: 112,
              fontSize: 11,
              color: '#9ca3af',
              lineHeight: '15px',
              padding: '6px 8px',
              backgroundColor: '#1e2023',
              borderRadius: 4,
              border: '1px solid #374151',
            }}
          >
            {destination === 'device' ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <HardDrive size={13} color="#38bdf8" />
                <span>
                  Scegli qualsiasi cartella del computer (Esplora Risorse / Finder). Le successive modifiche si salvano con <b>Ctrl+S</b>.
                </span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Cloud size={13} color="#34d399" />
                <span>
                  Per sincronizzare tra due PC, seleziona la cartella <b>Google Drive</b> (es. <code>G:\Il mio Drive\</code> o <code>Google Drive/</code>) nella finestra successiva!
                </span>
              </span>
            )}
          </div>

          {/* Help box */}
          {showHelp && (
            <div
              style={{
                backgroundColor: '#1a2e3b',
                border: '1px solid #0284c7',
                borderRadius: 6,
                padding: 10,
                fontSize: 11.5,
                color: '#e0f2fe',
                lineHeight: '16px',
                marginTop: 4,
              }}
            >
              <strong>Come funziona il salvataggio:</strong>
              <br />
              Cliccando su <b>Salva</b> si aprirà la finestra del tuo sistema operativo. Potrai scegliere esattamente in quale cartella posizionare il file. Se hai installato Google Drive sul computer, puoi salvarlo direttamente lì per trovarlo sincronizzato sull'altro PC!
            </div>
          )}
        </div>

        {/* Action Buttons Bar */}
        <div
          style={{
            padding: '12px 28px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #33363d',
            backgroundColor: '#202225',
          }}
        >
          {/* Help circle button */}
          <button
            type="button"
            onClick={() => setShowHelp((prev) => !prev)}
            style={{
              background: 'transparent',
              border: 'none',
              color: showHelp ? '#38bdf8' : '#9ca3af',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 4,
              borderRadius: '50%',
            }}
            title="Informazioni su salvataggio e sincronizzazione"
          >
            <HelpCircle size={18} />
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: '#374151',
                border: 'none',
                borderRadius: 5,
                color: '#e5e7eb',
                padding: '7px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
              }}
            >
              Annulla
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              style={{
                backgroundColor: '#0284c7',
                border: 'none',
                borderRadius: 5,
                color: '#ffffff',
                padding: '7px 22px',
                fontSize: 13,
                fontWeight: 700,
                cursor: isSaving ? 'wait' : 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.4)',
                transition: 'background-color 0.15s ease',
              }}
            >
              {isSaving ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
