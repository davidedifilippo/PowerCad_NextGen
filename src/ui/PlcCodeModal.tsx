import React, { useState, useEffect, useRef } from 'react';
import { Element } from '../model/types';
import { SimState } from '../engine/simulation';
import { validateSTCode, PlcMemory } from '../plc/stRuntime';
import {
  Cpu,
  Check,
  X,
  AlertCircle,
  BookOpen,
  Activity,
  Sparkles,
  CheckCircle2,
  Terminal,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  element: Element | null;
  simState?: SimState;
  onSave: (elementId: string, newStCode: string) => void;
}

export const ST_CODE_TEMPLATES = [
  {
    name: 'Marcia / Arresto (Autoritenuta)',
    desc: 'Avviamento motore diretto con pulsante Marcia I1, Arresto I2 e uscita Q1',
    code: `(* ============================================ *)
(* AVVIAMENTO DIRETTO CON AUTORITENUTA          *)
(* I1 = Pulsante Marcia (NO)                    *)
(* I2 = Pulsante Arresto (NC, o NO negato)      *)
(* Q1 = Bobina Contattore Principale (-KM1)    *)
(* ============================================ *)

Q1 := (I1 OR Q1) AND NOT I2;
`,
  },
  {
    name: 'Inversione Marcia Temporizzata',
    desc: 'Avanti (Q1) e Indietro (Q2) con interblocco software e timer di sicurezza',
    code: `(* ============================================ *)
(* TELEINVERTITORE CON INTERBLOCCO E TIMER      *)
(* I1 = Marcia Avanti    I2 = Marcia Indietro   *)
(* I3 = Arresto Generale                        *)
(* Q1 = Contattore Avanti  Q2 = Contattore Ind. *)
(* ============================================ *)

IF I3 THEN
  Q1 := FALSE;
  Q2 := FALSE;
ELSIF I1 AND NOT Q2 THEN
  Q1 := TRUE;
  Q2 := FALSE;
ELSIF I2 AND NOT Q1 THEN
  Q2 := TRUE;
  Q1 := FALSE;
END_IF;
`,
  },
  {
    name: 'Blinker / Lampeggiatore TON',
    desc: 'Generatore di impulsi e lampeggio temporizzato 1s ON / 1s OFF con timer TON',
    code: `(* ============================================ *)
(* GENERATORE IMPULSI LAMPEGGIATORE (TON)       *)
(* I1 = Abilitazione lampeggio                 *)
(* Q1 = Uscita lampeggiante (1s ON / 1s OFF)   *)
(* ============================================ *)

T_ON(IN := I1 AND NOT T_OFF.Q, PT := 1000);
T_OFF(IN := T_ON.Q, PT := 1000);

Q1 := T_ON.Q;
`,
  },
  {
    name: 'Controllo Soglia Analogica / Fault',
    desc: 'Monitoraggio soglia su ingresso I7/I8 con scatto relè allarme Q4',
    code: `(* ============================================ *)
(* CONTROLLO SOGLIA ANALOGICA E ALLARME         *)
(* I7 = Sensore analogico di livello / tensione *)
(* I1 = Reset Allarme                           *)
(* Q1 = Pompa di riempimento                   *)
(* Q4 = Relè Segnalazione Allarme / Fault      *)
(* ============================================ *)

IF I7 > 800 THEN
  (* Superata soglia 80% (es. 8.0V) -> Allarme *)
  Q4 := TRUE;
  Q1 := FALSE;
ELSIF I1 THEN
  (* Pulsante Reset Allarme *)
  Q4 := FALSE;
END_IF;

IF NOT Q4 AND I2 THEN
  Q1 := TRUE;
ELSIF I3 THEN
  Q1 := FALSE;
END_IF;
`,
  },
  {
    name: 'Sequenza A+ B+ A- B- (Stati)',
    desc: 'Ciclo sequenziale a 4 passi per cilindri elettropneumatici con ingressi finecorsa',
    code: `(* ============================================ *)
(* SEQUENZA ELETTROPNEUMATICA A+ B+ A- B-       *)
(* I1 = Start Ciclo   I2 = A0   I3 = A1        *)
(* I4 = B0            I5 = B1                   *)
(* Q1 = EV A+         Q2 = EV B+                *)
(* ============================================ *)

CASE passo OF
  0: (* Riposo: attesa Start *)
    Q1 := FALSE;
    Q2 := FALSE;
    IF I1 AND I2 AND I4 THEN
      passo := 1;
    END_IF;

  1: (* Passo 1: Avanza A (A+) *)
    Q1 := TRUE;
    IF I3 THEN (* Finecorsa A1 raggiunto *)
      passo := 2;
    END_IF;

  2: (* Passo 2: Avanza B (B+) *)
    Q2 := TRUE;
    IF I5 THEN (* Finecorsa B1 raggiunto *)
      passo := 3;
    END_IF;

  3: (* Passo 3: Ritorno A (A-) *)
    Q1 := FALSE;
    IF I2 THEN (* Finecorsa A0 raggiunto *)
      passo := 4;
    END_IF;

  4: (* Passo 4: Ritorno B (B-) *)
    Q2 := FALSE;
    IF I4 THEN (* Finecorsa B0 raggiunto *)
      passo := 0; (* Ciclo completato *)
    END_IF;
END_CASE;
`,
  },
];

export const PlcCodeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  element,
  simState,
  onSave,
}) => {
  const [code, setCode] = useState<string>('');
  const [syntaxError, setSyntaxError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'editor' | 'watch' | 'cheat'>('editor');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && element) {
      const initialCode = String(
        element.props?.stCode ||
          `(* Programma IEC 61131-3 Structured Text - Arduino Opta *)
Q1 := (I1 OR Q1) AND NOT I2;
`
      );
      setCode(initialCode);
      validateCode(initialCode);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
    }
  }, [isOpen, element]);

  // Validate ST Code live
  const validateCode = (src: string) => {
    const res = validateSTCode(src);
    if (!res.valid) {
      setSyntaxError(res.error || 'Errore di sintassi Structured Text');
    } else {
      setSyntaxError(null);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCode(val);
    validateCode(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enable Tab indentation inside textarea
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const updated = code.substring(0, start) + '  ' + code.substring(end);
      setCode(updated);
      validateCode(updated);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (element) {
      onSave(element.id, code);
      onClose();
    }
  };

  const loadTemplate = (tmpl: (typeof ST_CODE_TEMPLATES)[0]) => {
    setCode(tmpl.code);
    validateCode(tmpl.code);
  };

  if (!isOpen || !element) return null;

  // Inspect live runtime variables if available in simState
  const plcRuntime: PlcMemory | undefined =
    simState?.plcMemories && simState.plcMemories[element.id];

  const lineCount = Math.max(code.split('\n').length, 18);
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

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
        zIndex: 1000,
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
          width: '94%',
          maxWidth: 1050,
          height: '88vh',
          maxHeight: 760,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                backgroundColor: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
              }}
            >
              <Cpu size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                  Arduino Opta - Programmazione IEC 61131-3 (ST)
                </span>
                <span
                  style={{
                    backgroundColor: '#0369a1',
                    color: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {element.tag || '-PLC1'}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>
                Structured Text Engine integrato • 8 Ingressi I1..I8 • 4 Uscite Relè Q1..Q4
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
              title="Chiudi (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Top Action & Template Bar */}
        <div
          style={{
            padding: '8px 16px',
            backgroundColor: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Templates Quick Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
              <Sparkles size={14} color="#f59e0b" />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>Template:</span>
            </div>
            {ST_CODE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.name}
                type="button"
                onClick={() => loadTemplate(tmpl)}
                style={{
                  padding: '4px 9px',
                  borderRadius: 5,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                title={tmpl.desc}
              >
                {tmpl.name}
              </button>
            ))}
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              style={{
                padding: '5px 10px',
                borderRadius: 5,
                border: activeTab === 'editor' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: activeTab === 'editor' ? '#e0f2fe' : '#ffffff',
                color: activeTab === 'editor' ? '#0369a1' : '#64748b',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Terminal size={13} />
              <span>Editor ST</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('watch')}
              style={{
                padding: '5px 10px',
                borderRadius: 5,
                border: activeTab === 'watch' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: activeTab === 'watch' ? '#e0f2fe' : '#ffffff',
                color: activeTab === 'watch' ? '#0369a1' : '#64748b',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <Activity size={13} />
              <span>Stato Live I/O</span>
              {simState?.running && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    display: 'inline-block',
                  }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('cheat')}
              style={{
                padding: '5px 10px',
                borderRadius: 5,
                border: activeTab === 'cheat' ? '1px solid #0284c7' : '1px solid #cbd5e1',
                backgroundColor: activeTab === 'cheat' ? '#e0f2fe' : '#ffffff',
                color: activeTab === 'cheat' ? '#0369a1' : '#64748b',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                cursor: 'pointer',
              }}
            >
              <BookOpen size={13} />
              <span>Guida & Pinout</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>
          {/* Main Editor or View */}
          {activeTab === 'editor' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Code Area with line numbers */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  backgroundColor: '#1e293b',
                  overflow: 'hidden',
                  minHeight: 0,
                }}
              >
                {/* Line numbers gutter */}
                <div
                  style={{
                    width: 44,
                    backgroundColor: '#0f172a',
                    color: '#475569',
                    fontFamily: 'Consolas, "Fira Code", monospace',
                    fontSize: 13,
                    lineHeight: '21px',
                    textAlign: 'right',
                    padding: '12px 8px 12px 0',
                    userSelect: 'none',
                    borderRight: '1px solid #334155',
                    overflowY: 'hidden',
                  }}
                >
                  {lineNumbers.map((n) => (
                    <div key={n}>{n}</div>
                  ))}
                </div>

                {/* Textarea code editor */}
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={handleCodeChange}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  placeholder="Scrivi qui il tuo codice IEC 61131-3 Structured Text..."
                  style={{
                    flex: 1,
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    fontFamily: 'Consolas, "Fira Code", monospace',
                    fontSize: 13,
                    lineHeight: '21px',
                    padding: 12,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    whiteSpace: 'pre',
                    overflowWrap: 'normal',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    tabSize: 2,
                  }}
                />
              </div>

              {/* Live Syntax Validation Status Bar */}
              <div
                style={{
                  padding: '7px 16px',
                  backgroundColor: syntaxError ? '#fef2f2' : '#f0fdf4',
                  borderTop: syntaxError ? '1px solid #fecaca' : '1px solid #bbf7d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {syntaxError ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626' }}>
                    <AlertCircle size={15} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{syntaxError}</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#16a34a' }}>
                    <CheckCircle2 size={15} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      Sintassi IEC 61131-3 Valida • Pronto all'esecuzione nel ciclo PLC
                    </span>
                  </div>
                )}

                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Variabili: <code style={{ color: '#0369a1' }}>I1..I8</code> (IN),{' '}
                  <code style={{ color: '#0369a1' }}>Q1..Q4</code> (OUT)
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Live Watch */}
          {activeTab === 'watch' && (
            <div
              style={{
                flex: 1,
                padding: 20,
                backgroundColor: '#f8fafc',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#ffffff',
                  padding: '12px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, color: '#0f172a' }}>
                    Monitoraggio Live Ingressi e Uscite
                  </h4>
                  <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                    Stato delle variabili fisiche e logiche in tempo reale durante la simulazione.
                  </p>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '4px 10px',
                    borderRadius: 6,
                    backgroundColor: simState?.running ? '#dcfce7' : '#f1f5f9',
                    color: simState?.running ? '#15803d' : '#64748b',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <Activity size={14} />
                  <span>{simState?.running ? 'Simulazione Attiva' : 'Simulazione Non Avviata'}</span>
                </div>
              </div>

              {/* Grid 2 Columns: Inputs & Outputs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {/* Inputs I1..I8 */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <h5 style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>
                    Ingressi Digitali / Analogici (I1 .. I8)
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
                      const varName = `I${i}`;
                      const val = plcRuntime ? plcRuntime.vars[varName] : false;
                      const isHigh = Boolean(val);
                      return (
                        <div
                          key={varName}
                          style={{
                            padding: '8px 10px',
                            borderRadius: 6,
                            border: isHigh ? '1.5px solid #22c55e' : '1px solid #cbd5e1',
                            backgroundColor: isHigh ? '#f0fdf4' : '#f8fafc',
                            textAlign: 'center',
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>
                            {varName}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: isHigh ? '#16a34a' : '#94a3b8',
                              marginTop: 2,
                            }}
                          >
                            {typeof val === 'number' ? `${val}` : isHigh ? 'HIGH (1)' : 'LOW (0)'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Outputs Q1..Q4 */}
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    padding: 16,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <h5 style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>
                    Uscite a Relè Elettromeccanico (Q1 .. Q4)
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                    {[
                      { id: 'Q1', pins: '11 - 14' },
                      { id: 'Q2', pins: '21 - 24' },
                      { id: 'Q3', pins: '31 - 34' },
                      { id: 'Q4', pins: '41 - 44' },
                    ].map((q) => {
                      const val = plcRuntime ? plcRuntime.vars[q.id] : false;
                      const isClosed = Boolean(val);
                      return (
                        <div
                          key={q.id}
                          style={{
                            padding: 10,
                            borderRadius: 6,
                            border: isClosed ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
                            backgroundColor: isClosed ? '#eff6ff' : '#f8fafc',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>
                              {q.id}
                            </div>
                            <div style={{ fontSize: 10, color: '#64748b' }}>Morsetti {q.pins}</div>
                          </div>
                          <div
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              backgroundColor: isClosed ? '#3b82f6' : '#cbd5e1',
                              color: '#ffffff',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {isClosed ? 'CHIUSO (ON)' : 'APERTO (OFF)'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Internal variables table */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <h5 style={{ margin: '0 0 10px', fontSize: 13, color: '#334155' }}>
                  Variabili Interne & Timer
                </h5>
                {plcRuntime && Object.keys(plcRuntime.vars).length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(plcRuntime.vars)
                      .filter(
                        ([k]) =>
                          !['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'Q1', 'Q2', 'Q3', 'Q4'].includes(
                            k
                          )
                      )
                      .map(([k, v]) => (
                        <span
                          key={k}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#f1f5f9',
                            borderRadius: 4,
                            fontSize: 11,
                            fontFamily: 'monospace',
                            color: '#334155',
                          }}
                        >
                          <strong>{k}</strong> = {String(v)}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>
                    Nessuna variabile interna attiva o simulazione ferma.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Cheat Sheet & Pinout */}
          {activeTab === 'cheat' && (
            <div
              style={{
                flex: 1,
                padding: 20,
                backgroundColor: '#f8fafc',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {/* Hardware Pinout Card */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#0f172a' }}>
                  Piedinatura Hardware Arduino Opta
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <div
                    style={{
                      padding: 10,
                      backgroundColor: '#f8fafc',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#ef4444' }}>
                      Alimentazione (DC IN)
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      • <strong>VIN1, VIN2</strong>: +12V / +24V DC
                      <br />• <strong>GND1, GND2</strong>: 0V / Riferimento
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      backgroundColor: '#f8fafc',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#0284c7' }}>
                      Ingressi I1 .. I8
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      • Morsetti da <strong>I1</strong> a <strong>I8</strong>
                      <br />• Sensibili a tensione continua 12/24V
                      <br />• Compatibili digitali e analogici (0-10V)
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      backgroundColor: '#f8fafc',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 12, color: '#16a34a' }}>
                      Uscite Relè Q1 .. Q4
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>
                      • <strong>11-14</strong> (Q1), <strong>21-24</strong> (Q2)
                      <br />• <strong>31-34</strong> (Q3), <strong>41-44</strong> (Q4)
                      <br />• Contatti NO puliti isolati fino a 10A 250V AC
                    </div>
                  </div>
                </div>
              </div>

              {/* ST Syntax Reference */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#0f172a' }}>
                  Sintassi IEC 61131-3 Structured Text Supportata
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: 12, color: '#334155' }}>
                      Operatori Logici e Assegnazione
                    </h5>
                    <pre
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        padding: 10,
                        borderRadius: 6,
                        fontSize: 11,
                        margin: 0,
                      }}
                    >
                      {`Q1 := I1 AND NOT I2;
Q2 := (I3 OR I4) XOR I5;
Q3 := I1 = TRUE;`}
                    </pre>
                  </div>

                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: 12, color: '#334155' }}>
                      Blocchi Temporizzatori TON / TOF
                    </h5>
                    <pre
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        padding: 10,
                        borderRadius: 6,
                        fontSize: 11,
                        margin: 0,
                      }}
                    >
                      {`(* Timer ritardo all'eccitazione 2 secondi *)
T1(IN := I1, PT := 2000);
Q1 := T1.Q;`}
                    </pre>
                  </div>

                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: 12, color: '#334155' }}>
                      Condizionale IF ... THEN ... ELSE
                    </h5>
                    <pre
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        padding: 10,
                        borderRadius: 6,
                        fontSize: 11,
                        margin: 0,
                      }}
                    >
                      {`IF I1 THEN
  Q1 := TRUE;
ELSIF I2 THEN
  Q1 := FALSE;
END_IF;`}
                    </pre>
                  </div>

                  <div>
                    <h5 style={{ margin: '0 0 4px', fontSize: 12, color: '#334155' }}>
                      Macchina a Stati CASE ... OF
                    </h5>
                    <pre
                      style={{
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        padding: 10,
                        borderRadius: 6,
                        fontSize: 11,
                        margin: 0,
                      }}
                    >
                      {`CASE stato OF
  1: Q1 := TRUE;
  2: Q2 := TRUE;
  ELSE Q1 := FALSE;
END_CASE;`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>
              Ciclo di scansione PLC: <strong>50ms</strong> • Watchdog: <strong>15.000 ops</strong>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
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
              type="button"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 20px',
                borderRadius: 6,
                border: 'none',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(2, 132, 199, 0.3)',
              }}
            >
              <Check size={16} />
              <span>Salva ed Applica al PLC</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
