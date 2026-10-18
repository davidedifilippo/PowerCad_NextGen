import React, { useState, useEffect, useRef } from 'react';
import { Type, Bold, Italic, Check, X, Sparkles } from 'lucide-react';

export interface TextConfig {
  text: string;
  size: string;
  bold: boolean;
  italic: boolean;
  color: string;
  frame: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: TextConfig) => void;
  initialConfig?: Partial<TextConfig>;
  mode?: 'place' | 'edit';
}

export const PRESET_TEXTS = [
  { label: 'Circuito di Comando', icon: '🔄' },
  { label: 'Circuito di Potenza', icon: '⚡' },
  { label: 'Sistema Monofase', icon: '🔌' },
  { label: 'Sistema Trifase', icon: '⚙️' },
  { label: 'Alimentazione Ausiliaria', icon: '🔋' },
  { label: 'Protezioni e Sicurezza', icon: '🛡️' },
  { label: 'Segnalazioni e Allarmi', icon: '💡' },
  { label: 'Quadro Generale', icon: '🏢' },
];

export const FONT_SIZES = [
  { value: '11', label: 'Piccola (11 px)', short: '11' },
  { value: '14', label: 'Standard (14 px)', short: '14' },
  { value: '18', label: 'Grande (18 px)', short: '18' },
  { value: '24', label: 'Titolo (24 px)', short: '24' },
];

export const COLOR_OPTIONS = [
  { value: '#0f172a', label: 'Nero Carbone' },
  { value: '#2563eb', label: 'Blu Elettrico' },
  { value: '#dc2626', label: 'Rosso' },
  { value: '#16a34a', label: 'Verde' },
  { value: '#64748b', label: 'Grigio Tecnico' },
  { value: '#d97706', label: 'Arancione' },
];

export const FRAME_OPTIONS = [
  { value: 'none', label: 'Nessuna cornice' },
  { value: 'box', label: 'Riquadro con bordo' },
  { value: 'underline', label: 'Sottolineato' },
];

export const TextModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onConfirm,
  initialConfig,
  mode = 'place',
}) => {
  const [text, setText] = useState<string>(initialConfig?.text || 'Circuito di comando');
  const [size, setSize] = useState<string>(initialConfig?.size || '14');
  const [bold, setBold] = useState<boolean>(initialConfig?.bold ?? true);
  const [italic, setItalic] = useState<boolean>(initialConfig?.italic ?? false);
  const [color, setColor] = useState<string>(initialConfig?.color || '#0f172a');
  const [frame, setFrame] = useState<string>(initialConfig?.frame || 'none');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialConfig?.text !== undefined) setText(initialConfig.text);
      if (initialConfig?.size !== undefined) setSize(initialConfig.size);
      if (initialConfig?.bold !== undefined) setBold(initialConfig.bold);
      if (initialConfig?.italic !== undefined) setItalic(initialConfig.italic);
      if (initialConfig?.color !== undefined) setColor(initialConfig.color);
      if (initialConfig?.frame !== undefined) setFrame(initialConfig.frame);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen, initialConfig]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    onConfirm({
      text: text.trim(),
      size,
      bold,
      italic,
      color,
      frame,
    });
  };

  const numSize = Number(size) || 14;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(3px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 540,
          backgroundColor: '#ffffff',
          borderRadius: 12,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'fadeIn 0.15s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: '#1e293b',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Type size={18} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                {mode === 'edit' ? 'Modifica Dicitura di Testo' : 'Inserisci Testo / Dicitura'}
              </div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>
                Etichetta orientabile per sezioni dello schema (potenza, comando, monofase...)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Text Input */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Testo dell'Etichetta
            </label>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="es. Circuito di comando, Circuito di potenza..."
              style={{
                width: '100%',
                padding: '10px 12px',
                fontSize: 14,
                border: '1.5px solid #cbd5e1',
                borderRadius: 8,
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#2563eb')}
              onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
            />
          </div>

          {/* Quick preset suggestions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
              <Sparkles size={12} color="#f59e0b" />
              <span>Diciture Rapide Predefinite (clicca per applicare):</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRESET_TEXTS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setText(p.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 8px',
                    borderRadius: 6,
                    border: text === p.label ? '1.5px solid #3b82f6' : '1px solid #e2e8f0',
                    backgroundColor: text === p.label ? '#eff6ff' : '#f8fafc',
                    color: text === p.label ? '#1d4ed8' : '#334155',
                    fontSize: 11,
                    fontWeight: text === p.label ? 600 : 500,
                    cursor: 'pointer',
                  }}
                >
                  <span>{p.icon}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Typography Toolbar: Size, Bold, Italic, Color, Frame */}
          <div
            style={{
              padding: 12,
              backgroundColor: '#f8fafc',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Row 1: Size & Formatting (Bold, Italic) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
              {/* Size segmented buttons */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Dimensione
                </span>
                <div style={{ display: 'flex', backgroundColor: '#ffffff', borderRadius: 6, border: '1px solid #cbd5e1', padding: 2 }}>
                  {FONT_SIZES.map((fs) => (
                    <button
                      key={fs.value}
                      type="button"
                      onClick={() => setSize(fs.value)}
                      style={{
                        padding: '4px 10px',
                        fontSize: 11,
                        fontWeight: size === fs.value ? 700 : 500,
                        backgroundColor: size === fs.value ? '#2563eb' : 'transparent',
                        color: size === fs.value ? '#ffffff' : '#334155',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                      }}
                      title={fs.label}
                    >
                      {fs.short}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Bold & Italic Toggles */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Stile
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setBold(!bold)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 30,
                      borderRadius: 6,
                      border: bold ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: bold ? '#eff6ff' : '#ffffff',
                      color: bold ? '#1d4ed8' : '#334155',
                      cursor: 'pointer',
                    }}
                    title="Grassetto (Bold)"
                  >
                    <Bold size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setItalic(!italic)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 30,
                      borderRadius: 6,
                      border: italic ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: italic ? '#eff6ff' : '#ffffff',
                      color: italic ? '#1d4ed8' : '#334155',
                      cursor: 'pointer',
                    }}
                    title="Corsivo / Italico (Italic)"
                  >
                    <Italic size={15} />
                  </button>
                </div>
              </div>

              {/* Cornice / Bordo */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Cornice
                </span>
                <select
                  value={frame}
                  onChange={(e) => setFrame(e.target.value)}
                  style={{
                    padding: '5px 8px',
                    fontSize: 11,
                    fontWeight: 500,
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {FRAME_OPTIONS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Color swatches */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                Colore del Testo
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {COLOR_OPTIONS.map((c) => {
                  const isCur = color === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        backgroundColor: c.value,
                        border: isCur ? '2px solid #ffffff' : '1px solid rgba(0,0,0,0.15)',
                        boxShadow: isCur ? `0 0 0 2px ${c.value}` : 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                      }}
                      title={c.label}
                    >
                      {isCur && <Check size={12} strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#64748b', marginBottom: 4 }}>
              Anteprima sullo Schema
            </label>
            <div
              style={{
                height: 70,
                backgroundColor: '#ffffff',
                border: '1px dashed #cbd5e1',
                borderRadius: 8,
                backgroundImage: 'radial-gradient(#16a34a 0.65px, transparent 0.65px)',
                backgroundSize: '10px 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 20px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: numSize,
                  fontWeight: bold ? 'bold' : 'normal',
                  fontStyle: italic ? 'italic' : 'normal',
                  color: color,
                  fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif',
                  padding: frame === 'box' ? '3px 8px' : undefined,
                  border: frame === 'box' ? `1.2px solid ${color}` : undefined,
                  borderBottom: frame === 'underline' ? `1.8px solid ${color}` : undefined,
                  backgroundColor: frame === 'box' ? 'rgba(255,255,255,0.92)' : undefined,
                  borderRadius: frame === 'box' ? 3 : undefined,
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {text.trim() || 'Anteprima testo'}
              </div>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 6, lineHeight: '15px' }}>
              💡 <b>Suggerimento:</b> Dopo aver cliccato, muovi il cursore per scegliere la posizione. Premi <b>R</b> per ruotare di 90° e fai clic sinistro per fissarlo.
            </div>
          </div>

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Annulla
            </button>
            <button
              type="submit"
              style={{
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
              }}
            >
              <Type size={15} />
              <span>{mode === 'edit' ? 'Applica Modifiche' : 'Posiziona sullo Schema'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
