import { Doc } from '../model/types';
import { SimState } from '../engine/simulation';
import { getCircuitSummary, CadAction } from './cadCommands';

export type AiProvider = 'gemini' | 'ollama' | 'lmstudio' | 'custom';

export interface AiConfig {
  provider: AiProvider;
  geminiApiKey: string;
  geminiModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  customUrl: string;
  customApiKey: string;
  customModel: string;
}

export const DEFAULT_AI_CONFIG: AiConfig = {
  provider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'qwen2.5-coder:latest',
  customUrl: 'http://localhost:1234/v1',
  customApiKey: '',
  customModel: 'local-model',
};

const STORAGE_KEY = 'powercad_ai_copilot_config_v1';

export function loadAiConfig(): AiConfig {
  if (typeof window === 'undefined') return DEFAULT_AI_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_AI_CONFIG, ...JSON.parse(raw) } : DEFAULT_AI_CONFIG;
  } catch {
    return DEFAULT_AI_CONFIG;
  }
}

export function saveAiConfig(cfg: AiConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch (err) {
    console.warn('Errore salvataggio config AI:', err);
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // base64 data url
  proposedActions?: CadAction[];
  applied?: boolean;
  timestamp: number;
}

/**
 * Builds the system prompt with component catalog and current circuit context
 */
export function buildSystemPrompt(doc: Doc, simState?: SimState): string {
  const summary = getCircuitSummary(doc, simState);

  return `Sei "PowerCAD Copilot", un assistente esperto in ingegneria elettrotecnica, schemi di automazione industriale a norma CEI/IEC 60617, impianti civili/industriali e programmazione micro-PLC (come Arduino Opta in IEC 61131-3 Structured Text).

Lavori direttamente all'interno dell'applicazione web CAD/simulatore "PowerCAD Next-Gen".

### CONTESTO ATTUALE DELLO SCHEMA:
${JSON.stringify(summary, null, 2)}

### CATALOGO DEI COMPONENTI PRINCIPALI DISPONIBILI (ID e Morsetti):
- **Alimentazioni:**
  - 'pwr_3p_n_pe' (L1, L2, L3, N, PE)
  - 'pwr_3p_pe' (L1, L2, L3, PE)
  - 'pwr_1p_n_pe' (L, N, PE)
  - 'pwr_dc_24v' (+24V, 0V)
- **Comando & Segnalazione:**
  - 'pushbutton_no' (13, 14 - NO)
  - 'pushbutton_nc' (11, 12 - NC)
  - 'coil_standard' (A1, A2) - tag es. '-KM1'
  - 'contact_no' (13, 14 o 3, 4) - tag es. '-KM1'
  - 'contact_nc' (11, 12 o 1, 2) - tag es. '-KM1'
  - 'pilot_lamp' (X1, X2 - props: { color: 'Verde'|'Rosso'|'Giallo'|'Blu'|'Bianco' })
- **Potenza & Motori:**
  - 'disconnector_3p' (1, 2, 3, 4, 5, 6)
  - 'contactor_3p' (1, 2, 3, 4, 5, 6) - tag es. '-KM1'
  - 'thermal_overload' (1, 2, 3, 4, 5, 6, 95, 96, 97, 98) - tag es. '-FR1'
  - 'motor_3p_async' (U1, V1, W1, PE) - tag es. '-M1'
- **Relè Elettronici & Protezione:**
  - 'phase_sequence_relay' (L1, L2, L3, 11, 12, 14) - tag es. '-S1'
  - 'phase_loss_relay' (L1, L2, L3, 11, 12, 14) - tag es. '-F1'
  - 'ssr_1p_ac' (A1, A2, 1, 2)
- **Controller PLC:**
  - 'plc_arduino_opta' (VIN1, VIN2, GND1, GND2, I1..I8, 11-14, 21-24, 31-34, 41-44) - tag es. '-PLC1'

### COME PROPORRE MODIFICHE O GENERARE SCHEMI:
Quando l'utente ti chiede di creare, modificare o cablare un circuito, o di scrivere codice PLC, fornisci prima una spiegazione chiara in italiano e poi includi UN BLOCCO JSON con le azioni CAD delimitato esattamente da tre backtick json:
\`\`\`json
[
  { "action": "add_component", "def": "coil_standard", "x": 400, "y": 300, "tag": "-KM1" },
  { "action": "connect_terminals", "from": "-KM1:A1", "to": "-SB1:14", "kind": "aux" },
  { "action": "set_plc_code", "idOrTag": "-PLC1", "code": "Q1 := (I1 OR Q1) AND NOT I2;" }
]
\`\`\`
Regole per le coordinate:
- Tutti i valori x e y devono essere multipli di 10 (griglia a 10px).
- I conduttori creati con "connect_terminals" vengono tracciati automaticamente ad angolo retto (Manhattan).
- Sii incoraggiante, rigoroso nelle normative CEI e chiaro per un uso didattico.`;
}

/**
 * Extracts proposed CAD actions from the model's text response
 */
export function extractCadActions(text: string): CadAction[] | undefined {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (!jsonMatch) return undefined;
  try {
    const parsed = JSON.parse(jsonMatch[1]);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].action) {
      return parsed as CadAction[];
    }
  } catch (err) {
    console.warn('Errore parsing azioni CAD dalla risposta AI:', err);
  }
  return undefined;
}

/**
 * Sends a chat prompt to the configured AI provider
 */
export async function sendAiPrompt(
  prompt: string,
  doc: Doc,
  config: AiConfig,
  history: ChatMessage[] = [],
  imageB64?: string,
  simState?: SimState
): Promise<{ text: string; actions?: CadAction[] }> {
  const systemPrompt = buildSystemPrompt(doc, simState);

  // 1. Google Gemini Provider
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey) {
      throw new Error('Chiave API Google Gemini non configurata. Inseriscila nelle impostazioni del Copilot.');
    }

    const model = config.geminiModel || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey.trim()}`;

    const contents: any[] = [];

    // History (last 6 messages)
    for (const msg of history.slice(-6)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // Current user message parts
    const currentParts: any[] = [{ text: prompt }];

    if (imageB64) {
      const match = imageB64.match(/^data:(.+?);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }

    contents.push({
      role: 'user',
      parts: currentParts,
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error?.message || `Errore Gemini API (${res.status} ${res.statusText})`);
    }

    const data = await res.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Nessuna risposta generata dal modello.';
    const actions = extractCadActions(replyText);
    return { text: replyText, actions };
  }

  // 2. Ollama (Local)
  if (config.provider === 'ollama') {
    const baseUrl = config.ollamaUrl || 'http://localhost:11434';
    const model = config.ollamaModel || 'qwen2.5-coder:latest';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];

    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages,
          stream: false,
          options: { temperature: 0.2 },
        }),
      });

      if (!res.ok) {
        throw new Error(`Errore Ollama (${res.status}): assicurati che Ollama sia in esecuzione su ${baseUrl}`);
      }

      const data = await res.json();
      const replyText = data.message?.content || '';
      const actions = extractCadActions(replyText);
      return { text: replyText, actions };
    } catch (err: any) {
      if (err.message?.includes('Failed to fetch')) {
        throw new Error(
          `Impossibile connettersi ad Ollama su ${baseUrl}. Assicurati di aver impostato OLLAMA_ORIGINS="*" e che Ollama sia attivo.`
        );
      }
      throw err;
    }
  }

  // 3. LM Studio / Custom OpenAI Compatible
  const baseUrl = (config.customUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
  const model = config.customModel || 'local-model';
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (config.customApiKey) {
    headers['Authorization'] = `Bearer ${config.customApiKey.trim()}`;
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: prompt },
  ];

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
      }),
    });

    if (!res.ok) {
      throw new Error(`Errore API (${res.status} ${res.statusText}) su ${baseUrl}`);
    }

    const data = await res.json();
    const replyText = data.choices?.[0]?.message?.content || '';
    const actions = extractCadActions(replyText);
    return { text: replyText, actions };
  } catch (err: any) {
    if (err.message?.includes('Failed to fetch')) {
      throw new Error(`Impossibile connettersi all'endpoint ${baseUrl}. Verifica che il server sia attivo e con CORS abilitato.`);
    }
    throw err;
  }
}

/**
 * Queries Ollama to discover installed models
 */
export async function fetchOllamaModels(baseUrl: string = 'http://localhost:11434'): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.models) ? data.models.map((m: any) => m.name) : [];
  } catch {
    return [];
  }
}
