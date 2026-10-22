import React, { useState, useEffect, useRef } from 'react';
import { Doc } from '../model/types';
import { SimState, createInitialSimState } from '../engine/simulation';
import {
  AiConfig,
  ChatMessage,
  loadAiConfig,
  saveAiConfig,
  sendAiPrompt,
  fetchOllamaModels,
  fetchGeminiModels,
} from '../ai/aiService';
import { executeCadActions, CadAction } from '../ai/cadCommands';
import {
  Sparkles,
  Settings,
  X,
  Send,
  Image as ImageIcon,
  Check,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Wrench,
} from 'lucide-react';
import { CadExecutionContext } from '../ai/cadToolDispatcher';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doc: Doc;
  onDocChange: (newDoc: Doc) => void;
  simState?: SimState;
  onSimStateChange?: React.Dispatch<React.SetStateAction<SimState>>;
  onStartSim?: () => void;
  onStopSim?: () => void;
  currentFileName?: string;
  onResetFileHandle?: () => void;
}

export const AiCopilotDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  doc,
  onDocChange,
  simState,
  onSimStateChange,
  onStartSim,
  onStopSim,
  currentFileName,
  onResetFileHandle,
}) => {
  const [config, setConfig] = useState<AiConfig>(loadAiConfig());
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Ciao! Sono il tuo Copilot AI per CADe_SIMU Next.\nPosso aiutarti a progettare schemi elettrici, simulare il circuito, premere pulsanti/sezionatori, verificare errori DRC e scrivere codice PLC.\n\nCome posso aiutarti oggi?',
      timestamp: Date.now(),
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeToolStatus, setActiveToolStatus] = useState<string | null>(null);
  const [expandedTraceIds, setExpandedTraceIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ollamaModelsList, setOllamaModelsList] = useState<string[]>([]);
  const [isDetectingOllama, setIsDetectingOllama] = useState<boolean>(false);
  const [geminiModelsList, setGeminiModelsList] = useState<string[]>([]);
  const [isDetectingGemini, setIsDetectingGemini] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // If user opens settings or selects Ollama, auto-detect
  const handleDetectOllama = async () => {
    setIsDetectingOllama(true);
    try {
      const models = await fetchOllamaModels(config.ollamaUrl);
      setOllamaModelsList(models);
      if (models.length > 0 && !models.includes(config.ollamaModel)) {
        const updated = { ...config, ollamaModel: models[0] };
        setConfig(updated);
        saveAiConfig(updated);
      }
    } catch {
      // silent
    } finally {
      setIsDetectingOllama(false);
    }
  };

  const handleDetectGemini = async () => {
    if (!config.geminiApiKey || !config.geminiApiKey.trim()) {
      alert('Inserisci prima la tua chiave API Google per interrogare i modelli disponibili.');
      return;
    }
    setIsDetectingGemini(true);
    try {
      const models = await fetchGeminiModels(config.geminiApiKey);
      if (models.length > 0) {
        setGeminiModelsList(models);
        if (!models.includes(config.geminiModel)) {
          const preferred =
            models.find((m) => m === 'gemini-3.8-flash') ||
            models.find((m) => m.includes('3.8-flash')) ||
            models.find((m) => m.includes('flash')) ||
            models[0];
          handleConfigChange('geminiModel', preferred);
        }
      } else {
        alert('Nessun modello di generazione testo trovato per questa chiave o chiave non valida.');
      }
    } catch (err: any) {
      alert(`Errore nel rilevamento modelli: ${err?.message || err}`);
    } finally {
      setIsDetectingGemini(false);
    }
  };

  const handleConfigChange = (key: keyof AiConfig, val: string) => {
    const updated = { ...config, [key]: val };
    setConfig(updated);
    saveAiConfig(updated);
  };

  // Image Upload Handling
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Paste image from clipboard directly in input
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onload = (event) => {
            setAttachedImage(event.target?.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt && !attachedImage) return;
    if (isLoading) return;

    // Check configuration
    if (config.provider === 'gemini' && !config.geminiApiKey) {
      setActiveTab('settings');
      setErrorMessage('Inserisci la chiave API gratuita di Google Gemini per iniziare.');
      return;
    }

    setErrorMessage(null);
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content: prompt,
      image: attachedImage || undefined,
      timestamp: Date.now(),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputPrompt('');
    const curImg = attachedImage;
    setAttachedImage(null);
    setIsLoading(true);

    const executionCtx: CadExecutionContext = {
      doc,
      onDocChange,
      simState: simState || createInitialSimState(),
      onSimStateChange,
      onStartSim,
      onStopSim,
      currentFileName,
      onResetFileHandle,
    };

    setActiveToolStatus('Interrogazione modello AI...');

    try {
      const response = await sendAiPrompt(
        prompt,
        executionCtx,
        config,
        newHistory,
        curImg || undefined,
        undefined,
        (step) => {
          if (step.toolCall) {
            setActiveToolStatus(`Esecuzione strumento: ${step.toolCall.tool}...`);
          }
        }
      );

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        role: 'assistant',
        content: response.text,
        proposedActions: response.actions,
        trace: response.trace,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Si è verificato un errore durante la comunicazione con l\'IA.');
    } finally {
      setIsLoading(false);
      setActiveToolStatus(null);
    }
  };

  const handleApplyActions = (msgId: string, actions: CadAction[]) => {
    const result = executeCadActions(doc, actions);
    if (result.errors.length > 0) {
      alert(`Alcune azioni hanno riscontrato errori:\n${result.errors.join('\n')}`);
    }
    onDocChange(result.doc);

    // Mark as applied
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: 410,
        maxWidth: '92vw',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #cbd5e1',
        boxShadow: '-8px 0 25px rgba(0, 0, 0, 0.12)',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          padding: '12px 16px',
          backgroundColor: '#0f172a',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={16} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>PowerCAD Copilot</span>
              <span
                style={{
                  fontSize: 9.5,
                  backgroundColor: '#3b82f6',
                  padding: '1px 5px',
                  borderRadius: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                AI
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: '#94a3b8' }}>
              {config.provider === 'gemini'
                ? `Google Gemini (${config.geminiModel})`
                : config.provider === 'ollama'
                ? `Ollama Locale (${config.ollamaModel})`
                : 'LM Studio / Custom'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'chat' ? 'settings' : 'chat')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'settings' ? '#38bdf8' : '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 4,
            }}
            title="Impostazioni Modello AI"
          >
            <Settings size={17} />
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 4,
            }}
            title="Chiudi Copilot"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Settings View */}
      {activeTab === 'settings' ? (
        <div style={{ flex: 1, padding: 18, overflowY: 'auto', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h4 style={{ margin: 0, fontSize: 14, color: '#0f172a' }}>Configurazione Modello AI</h4>
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Torna alla Chat
            </button>
          </div>

          {/* Provider Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Provider Intelligenza Artificiale
            </label>
            <select
              value={config.provider}
              onChange={(e) => handleConfigChange('provider', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 6,
                border: '1px solid #cbd5e1',
                fontSize: 12,
                backgroundColor: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="gemini">1. Google Gemini (Gratuito, consigliato per studenti)</option>
              <option value="ollama">2. Ollama (Locale su PC localhost:11434)</option>
              <option value="lmstudio">3. LM Studio / Custom OpenAI (localhost:1234)</option>
            </select>
          </div>

          {/* Section: Gemini */}
          {config.provider === 'gemini' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: 14,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Chiave API Google Gemini
                </label>
                <input
                  type="password"
                  value={config.geminiApiKey}
                  onChange={(e) => handleConfigChange('geminiApiKey', e.target.value)}
                  placeholder="Incolla qui la chiave API (es. AIzaSy...)"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: 6,
                  padding: 10,
                  fontSize: 11,
                  color: '#1e40af',
                  lineHeight: '16px',
                }}
              >
                <strong>Come ottenere la chiave gratuita:</strong>
                <br />
                Google AI Studio offre fino a 15 richieste/min gratis senza carta di credito.
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    color: '#2563eb',
                    fontWeight: 700,
                    marginTop: 6,
                    textDecoration: 'none',
                  }}
                >
                  <span>Crea Chiave Gratuita su Google AI Studio</span>
                  <ExternalLink size={12} />
                </a>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#475569' }}>
                    Modello Google Gemini
                  </label>
                  <button
                    type="button"
                    onClick={handleDetectGemini}
                    disabled={isDetectingGemini}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 10.5,
                      color: '#2563eb',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 4px',
                      fontWeight: 600,
                    }}
                    title="Interroga Google AI Studio per l'elenco dei modelli abilitati sulla tua chiave"
                  >
                    <RefreshCw size={11} className={isDetectingGemini ? 'animate-spin' : ''} />
                    <span>{isDetectingGemini ? 'Rilevamento...' : 'Rileva Modelli'}</span>
                  </button>
                </div>

                {geminiModelsList.length > 0 ? (
                  <select
                    value={config.geminiModel}
                    onChange={(e) => handleConfigChange('geminiModel', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {geminiModelsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <select
                      value={config.geminiModel}
                      onChange={(e) => handleConfigChange('geminiModel', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        backgroundColor: '#ffffff',
                      }}
                    >
                      <option value="gemini-3.8-flash">gemini-3.8-flash (Attivo su nuovi account - Consigliato)</option>
                      <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Veloce e leggero)</option>
                      <option value="gemini-3.8-pro">gemini-3.8-pro (Ragionamento avanzato)</option>
                      {!['gemini-3.8-flash', 'gemini-3.5-flash-lite', 'gemini-3.8-pro'].includes(config.geminiModel) && (
                        <option value={config.geminiModel}>{config.geminiModel} (Personalizzato)</option>
                      )}
                    </select>
                    <input
                      type="text"
                      value={config.geminiModel}
                      onChange={(e) => handleConfigChange('geminiModel', e.target.value)}
                      placeholder="Oppure inserisci il nome del modello esatto"
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        fontSize: 11,
                        boxSizing: 'border-box',
                        color: '#64748b',
                      }}
                    />
                  </div>
                )}
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 4 }}>
                  I nuovi account Google AI Studio richiedono modelli serie 3.x (es. gemini-3.8-flash).
                </div>
              </div>
            </div>
          )}

          {/* Section: Ollama */}
          {config.provider === 'ollama' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: 14,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  URL Server Ollama
                </label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    value={config.ollamaUrl}
                    onChange={(e) => handleConfigChange('ollamaUrl', e.target.value)}
                    style={{
                      flex: 1,
                      padding: '7px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleDetectOllama}
                    disabled={isDetectingOllama}
                    style={{
                      padding: '7px 10px',
                      backgroundColor: '#f1f5f9',
                      border: '1px solid #cbd5e1',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <RefreshCw size={12} className={isDetectingOllama ? 'animate-spin' : ''} />
                    <span>Rileva</span>
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Modello Locale Selezionato
                </label>
                {ollamaModelsList.length > 0 ? (
                  <select
                    value={config.ollamaModel}
                    onChange={(e) => handleConfigChange('ollamaModel', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      backgroundColor: '#ffffff',
                    }}
                  >
                    {ollamaModelsList.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={config.ollamaModel}
                    onChange={(e) => handleConfigChange('ollamaModel', e.target.value)}
                    placeholder="es. qwen2.5-coder:latest"
                    style={{
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      fontSize: 12,
                      boxSizing: 'border-box',
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 11,
                  color: '#64748b',
                  lineHeight: '15px',
                }}
              >
                💡 Per consentire le chiamate dal browser, avvia Ollama con:
                <br />
                <code>OLLAMA_ORIGINS="*" ollama serve</code>
              </div>
            </div>
          )}

          {/* Section: LM Studio */}
          {config.provider === 'lmstudio' && (
            <div
              style={{
                backgroundColor: '#ffffff',
                padding: 14,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>
                  Endpoint API LM Studio
                </label>
                <input
                  type="text"
                  value={config.customUrl}
                  onChange={(e) => handleConfigChange('customUrl', e.target.value)}
                  placeholder="http://localhost:1234/v1"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 12,
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 11,
                  color: '#166534',
                  lineHeight: '15px',
                }}
              >
                In LM Studio, nella scheda <b>Local Server</b>, premi <b>Start Server</b> e assicurati che la casella <b>CORS</b> sia spuntata.
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Chat View */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {/* Quick Starter Chips */}
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
            }}
          >
            {[
              'Diagnostica anomalie circuito',
              'Autoritenuta marcia/arresto',
              'Programma ST Arduino Opta',
              'Verifica regole DRC',
            ].map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleSendMessage(chip)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 14,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: 10.5,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              backgroundColor: '#ffffff',
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}
                >
                  {/* User image preview if attached */}
                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Allegato"
                      style={{
                        maxWidth: 200,
                        maxHeight: 140,
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                      }}
                    />
                  )}

                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 10,
                      backgroundColor: isUser ? '#2563eb' : '#f1f5f9',
                      color: isUser ? '#ffffff' : '#0f172a',
                      fontSize: 12.5,
                      lineHeight: '18px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    {msg.content}
                  </div>

                  {/* Proposed CAD Actions Card */}
                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#eff6ff',
                        border: '1.5px solid #93c5fd',
                        borderRadius: 8,
                        padding: 10,
                        marginTop: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#1e40af' }}>
                        <Sparkles size={14} color="#2563eb" />
                        <span>Azioni CAD Proposte ({msg.proposedActions.length})</span>
                      </div>

                      <div style={{ fontSize: 10.5, color: '#475569', lineHeight: '14px' }}>
                        {msg.proposedActions.map((act, i) => (
                          <div key={i}>
                            • <strong>{act.action}</strong>:{' '}
                            {act.action === 'add_component'
                              ? `${act.def} (Tag: ${act.tag || 'auto'})`
                              : act.action === 'connect_terminals'
                              ? `${act.from} ➔ ${act.to}`
                              : act.action === 'set_plc_code'
                              ? `Codice ST su ${act.idOrTag}`
                              : ''}
                          </div>
                        ))}
                      </div>

                      {!msg.applied ? (
                        <button
                          type="button"
                          onClick={() => handleApplyActions(msg.id, msg.proposedActions!)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <Check size={14} />
                          <span>Applica Modifiche allo Schema</span>
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#16a34a', fontSize: 11, fontWeight: 700 }}>
                          <Check size={14} />
                          <span>Modifiche applicate con successo!</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Interaction Trace Card (Tool execution history) */}
                  {msg.trace && msg.trace.steps && msg.trace.steps.length > 0 && (
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        padding: '8px 10px',
                        marginTop: 4,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          userSelect: 'none',
                        }}
                        onClick={() => {
                          setExpandedTraceIds((prev) => {
                            const next = new Set(prev);
                            if (next.has(msg.id)) next.delete(msg.id);
                            else next.add(msg.id);
                            return next;
                          });
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: '#334155' }}>
                          <Wrench size={13} color="#64748b" />
                          <span>Strumenti CAD eseguiti ({msg.trace.steps.length})</span>
                          <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 4, backgroundColor: '#e2e8f0', color: '#475569' }}>
                            {(msg.trace.durationMs / 1000).toFixed(1)}s
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            title="Copia log traccia JSON negli appunti"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(JSON.stringify(msg.trace, null, 2));
                              alert('Traccia JSON copiata negli appunti!');
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '2px 6px',
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#475569',
                              fontSize: 10,
                              cursor: 'pointer',
                            }}
                          >
                            <Copy size={11} />
                            <span>Copia JSON</span>
                          </button>
                          {expandedTraceIds.has(msg.id) ? <ChevronUp size={14} color="#64748b" /> : <ChevronDown size={14} color="#64748b" />}
                        </div>
                      </div>

                      {expandedTraceIds.has(msg.id) && (
                        <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 10.5, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                          {msg.trace.steps.map((st, i) => (
                            <div key={i} style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 6, padding: '6px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: 600, color: '#0f172a' }}>
                                <span>#{st.step}: <code>{st.toolCall?.tool}</code></span>
                                <span style={{ color: st.toolResult?.success ? '#16a34a' : '#dc2626' }}>
                                  {st.toolResult?.success ? '✓ Successo' : '✗ Errore'}
                                </span>
                              </div>
                              {st.toolCall?.args && (
                                <div style={{ color: '#64748b', fontSize: 10, fontFamily: 'monospace', marginTop: 2, whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(st.toolCall.args)}
                                </div>
                              )}
                              {st.toolResult?.message && (
                                <div style={{ color: '#334155', marginTop: 3 }}>
                                  {st.toolResult.message}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  padding: '10px 14px',
                  borderRadius: 10,
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Sparkles size={14} className="animate-spin" color="#3b82f6" />
                <span>{activeToolStatus || 'Il Copilot sta analizzando lo schema...'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Error Banner if any */}
          {errorMessage && (
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#fef2f2',
                color: '#dc2626',
                borderTop: '1px solid #fecaca',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertCircle size={14} />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Bottom Prompt Input Area */}
          <div
            style={{
              padding: 10,
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {/* Attached Image Thumbnail */}
            {attachedImage && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 6px' }}>
                <img
                  src={attachedImage}
                  alt="Anteprima"
                  style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 4, border: '1px solid #cbd5e1' }}
                />
                <span style={{ fontSize: 11, color: '#475569' }}>Immagine allegata</span>
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: 8,
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  backgroundColor: attachedImage ? '#eff6ff' : '#ffffff',
                  color: attachedImage ? '#2563eb' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Allega foto dello schema o disegno"
              >
                <ImageIcon size={16} />
              </button>

              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                onPaste={handlePaste}
                placeholder="Chiedi al Copilot o incolla un'immagine..."
                rows={2}
                style={{
                  flex: 1,
                  padding: '7px 10px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  fontSize: 12,
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'inherit',
                  lineHeight: '16px',
                }}
              />

              <button
                type="button"
                disabled={isLoading || (!inputPrompt.trim() && !attachedImage)}
                onClick={() => handleSendMessage()}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: !inputPrompt.trim() && !attachedImage ? '#94a3b8' : '#2563eb',
                  color: '#ffffff',
                  cursor: !inputPrompt.trim() && !attachedImage ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 38,
                }}
                title="Invia messaggio (Invio)"
              >
                <Send size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
