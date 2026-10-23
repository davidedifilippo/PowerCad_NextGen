import { Doc } from '../model/types';
import { SimState, createInitialSimState } from '../engine/simulation';
import { getCircuitSummary, CadAction } from './cadCommands';
import {
  CadExecutionContext,
  dispatchCadTool,
  getGeminiToolsDeclaration,
  getOpenAiToolsDeclaration,
  CAD_TOOL_DEFINITIONS,
} from './cadToolDispatcher';

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
    if (!raw) return DEFAULT_AI_CONFIG;
    const parsed = JSON.parse(raw);
    if (parsed.geminiModel === 'gemini-1.5-flash' || parsed.geminiModel === 'gemini-1.5-pro') {
      parsed.geminiModel = 'gemini-2.5-flash';
    }
    return { ...DEFAULT_AI_CONFIG, ...parsed };
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

export interface InteractionTraceStep {
  step: number;
  timestamp: number;
  toolCall?: {
    tool: string;
    args: any;
  };
  toolResult?: {
    success: boolean;
    result?: any;
    error?: string;
    message?: string;
  };
  rawThought?: string;
}

export interface InteractionTrace {
  id: string;
  prompt: string;
  provider: string;
  model: string;
  timestamp: number;
  steps: InteractionTraceStep[];
  finalAnswer: string;
  durationMs: number;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  image?: string; // base64 data url
  proposedActions?: CadAction[];
  applied?: boolean;
  timestamp: number;
  trace?: InteractionTrace;
}

/**
 * Builds the comprehensive system prompt including tool capabilities and circuit state
 */
export function buildSystemPrompt(doc: Doc, simState?: SimState): string {
  const summary = getCircuitSummary(doc, simState);

  const toolsSummary = CAD_TOOL_DEFINITIONS.map(
    (t) => `- **${t.name}**: ${t.description}`
  ).join('\n');

  return `Sei "CADe_SIMU Next Copilot", un assistente esperto in ingegneria elettrotecnica, schemi di potenza e comando a norma CEI/IEC 60617, impianti industriali e programmazione micro-PLC.

Lavori direttamente all'interno dell'applicazione web CAD e simulatore interattivo.

### STATO ATTUALE DEL CIRCUITO:
${JSON.stringify(summary, null, 2)}

### STRUMENTI DISPONIBILI (TOOLS):
Puoi interagire direttamente con il CAD e con il simulatore invocando gli strumenti:
${toolsSummary}

### LINEE GUIDA SULL'USO DEGLI STRUMENTI:
1. **Controllo Simulazione**: Quando l'utente chiede di avviare, provare o fermare lo schema, usa \`cad_control_simulation(command="start")\` o \`command="stop"\`.
2. **Interazione Componenti**: Per premere un pulsante (es. marcia -SB2, arresto -SB1) usa \`cad_interact_element(idOrTag="-SB2", action="press")\`. Per aprire/chiudere o commutare interruttori, usa action="toggle" o "open"/"close".
3. **Verifica DRC**: Quando l'utente chiede se ci sono errori o di verificare il circuito, usa \`cad_validate_drc()\`.
4. **Modifiche CAD**: Per inserire, rimuovere o cablare componenti usa \`cad_apply_actions(actions=[...])\`.
   - Morsetti indicati sempre come "TAG:MORSETTO" (es. "-KM1:A1", "-SB1:14", "-Q1:1").
   - Coordinate x e y sempre multipli di 10 (griglia a 10px).
5. Se non disponi di function-calling nativo, puoi emettere un blocco \`\`\`tool_call contenente JSON:
\`\`\`tool_call
{ "tool": "cad_control_simulation", "args": { "command": "start" } }
\`\`\`
oppure per modifiche grafiche il blocco \`\`\`json con la lista di azioni CAD.

Fornisci sempre risposte in italiano, chiare, tecniche e orientate alla sicurezza elettrotecnica CEI.`;
}

/**
 * Extracts proposed CAD actions from the model's text response (fallback)
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
 * Extracts text-based tool call fallback from text (e.g. ```tool_call { "tool": "...", "args": ... } ```)
 */
export function extractFallbackToolCall(text: string): { tool: string; args: any } | null {
  const match = text.match(/```(?:tool_call|tool)\s*([\s\S]*?)\s*```/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.tool) {
        return { tool: parsed.tool, args: parsed.args || {} };
      }
    } catch {
      // ignore
    }
  }

  // Also check if text contains direct json with action === 'control_simulation' or 'cad_control_simulation'
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1]);
      if (parsed.tool) {
        return { tool: parsed.tool, args: parsed.args || {} };
      }
      if (parsed.action === 'cad_control_simulation' || parsed.action === 'control_simulation') {
        return { tool: 'cad_control_simulation', args: { command: parsed.command || 'start' } };
      }
      if (parsed.action === 'cad_interact_element' || parsed.action === 'interact_element') {
        return { tool: 'cad_interact_element', args: parsed };
      }
      if (parsed.action === 'cad_validate_drc' || parsed.action === 'validate_drc') {
        return { tool: 'cad_validate_drc', args: {} };
      }
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].action) {
        // CAD actions
        return { tool: 'cad_apply_actions', args: { actions: parsed } };
      }
    } catch {
      // ignore
    }
  }

  return null;
}

export interface SendAiPromptResult {
  text: string;
  actions?: CadAction[];
  trace: InteractionTrace;
}

/**
 * Executes an Agentic ReAct Tool Loop with the configured LLM and CADe_SIMU Next environment
 */
export async function sendAiPrompt(
  prompt: string,
  docOrCtx: Doc | CadExecutionContext,
  config: AiConfig,
  history: ChatMessage[] = [],
  imageB64?: string,
  simState?: SimState,
  onTraceStep?: (step: InteractionTraceStep) => void
): Promise<SendAiPromptResult> {
  const startTime = Date.now();

  // Normalize execution context
  const ctx: CadExecutionContext =
    'onDocChange' in docOrCtx
      ? (docOrCtx as CadExecutionContext)
      : {
          doc: docOrCtx as Doc,
          onDocChange: () => {},
          simState: simState || createInitialSimState(),
        };

  const trace: InteractionTrace = {
    id: `trace_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    prompt,
    provider: config.provider,
    model:
      config.provider === 'gemini'
        ? config.geminiModel || 'gemini-2.5-flash'
        : config.provider === 'ollama'
        ? config.ollamaModel || 'qwen2.5-coder'
        : config.customModel || 'custom',
    timestamp: startTime,
    steps: [],
    finalAnswer: '',
    durationMs: 0,
  };

  const maxIterations = 5;
  let currentIteration = 0;
  let finalResponseText = '';
  let extractedActions: CadAction[] | undefined;

  // ==========================================
  // 1. Google Gemini Provider (Native Tools)
  // ==========================================
  if (config.provider === 'gemini') {
    if (!config.geminiApiKey || !config.geminiApiKey.trim()) {
      throw new Error('Chiave API Google Gemini non configurata. Inseriscila nelle impostazioni del Copilot.');
    }

    const model = config.geminiModel || 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.geminiApiKey.trim()}`;

    // Initialize conversation contents
    const contents: any[] = [];

    // Prior chat history (last 6 messages)
    for (const msg of history.slice(-6)) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        });
      }
    }

    // User prompt parts
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
    contents.push({ role: 'user', parts: currentParts });

    while (currentIteration < maxIterations) {
      currentIteration++;
      const systemPrompt = buildSystemPrompt(ctx.doc, ctx.simState);

      const reqBody: any = {
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools: getGeminiToolsDeclaration(),
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048,
        },
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqBody),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const msg = errJson.error?.message || `Errore Gemini API (${res.status} ${res.statusText})`;
        trace.error = msg;
        throw new Error(msg);
      }

      const data = await res.json();
      const candidate = data.candidates?.[0];
      const parts = candidate?.content?.parts || [];

      // Check for function calls
      const functionCalls = parts.filter((p: any) => p.functionCall);

      if (functionCalls.length > 0) {
        // Record model's call in conversation
        contents.push({
          role: 'model',
          parts,
        });

        const responseParts: any[] = [];

        for (const fc of functionCalls) {
          const callName = fc.functionCall.name;
          const callArgs = fc.functionCall.args || {};

          // Execute tool via dispatcher
          const outcome = await dispatchCadTool(ctx, callName, callArgs);

          const traceStep: InteractionTraceStep = {
            step: currentIteration,
            timestamp: Date.now(),
            toolCall: { tool: callName, args: callArgs },
            toolResult: outcome,
          };
          trace.steps.push(traceStep);
          onTraceStep?.(traceStep);

          responseParts.push({
            functionResponse: {
              name: callName,
              response: {
                success: outcome.success,
                result: outcome.result ?? outcome.message ?? outcome.error,
              },
            },
          });
        }

        // Send function responses back to Gemini
        contents.push({
          role: 'user',
          parts: responseParts,
        });

        // Continue agent loop
        continue;
      }

      // No function calls: model produced final text answer
      const textPart = parts.find((p: any) => p.text)?.text || '';
      finalResponseText = textPart;

      // Check for fallback text actions
      const fallback = extractFallbackToolCall(textPart);
      if (fallback) {
        const outcome = await dispatchCadTool(ctx, fallback.tool, fallback.args);
        const traceStep: InteractionTraceStep = {
          step: currentIteration,
          timestamp: Date.now(),
          toolCall: fallback,
          toolResult: outcome,
        };
        trace.steps.push(traceStep);
        onTraceStep?.(traceStep);
      }

      extractedActions = extractCadActions(textPart);
      break;
    }
  }

  // ==========================================
  // 2. Ollama Provider (Local)
  // ==========================================
  else if (config.provider === 'ollama') {
    const baseUrl = (config.ollamaUrl || 'http://localhost:11434').replace(/\/+$/, '');
    const model = config.ollamaModel || 'qwen2.5-coder:latest';

    const messages: any[] = [
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];

    while (currentIteration < maxIterations) {
      currentIteration++;
      const systemPrompt = buildSystemPrompt(ctx.doc, ctx.simState);

      const reqBody: any = {
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: false,
        options: { temperature: 0.2 },
        tools: getOpenAiToolsDeclaration(),
      };

      try {
        const res = await fetch(`${baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        });

        if (!res.ok) {
          throw new Error(`Errore Ollama (${res.status}): assicurati che Ollama sia in esecuzione su ${baseUrl}`);
        }

        const data = await res.json();
        const msg = data.message;

        // Check for native tool calls from Ollama
        if (msg?.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
          messages.push(msg);

          for (const tc of msg.tool_calls) {
            const toolName = tc.function?.name;
            const toolArgs = typeof tc.function?.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function?.arguments || {};

            const outcome = await dispatchCadTool(ctx, toolName, toolArgs);

            const traceStep: InteractionTraceStep = {
              step: currentIteration,
              timestamp: Date.now(),
              toolCall: { tool: toolName, args: toolArgs },
              toolResult: outcome,
            };
            trace.steps.push(traceStep);
            onTraceStep?.(traceStep);

            messages.push({
              role: 'tool',
              name: toolName,
              content: JSON.stringify(outcome),
            });
          }

          continue;
        }

        // Plain text response
        finalResponseText = msg?.content || '';

        // Check fallback tool calls in text
        const fallback = extractFallbackToolCall(finalResponseText);
        if (fallback) {
          const outcome = await dispatchCadTool(ctx, fallback.tool, fallback.args);
          const traceStep: InteractionTraceStep = {
            step: currentIteration,
            timestamp: Date.now(),
            toolCall: fallback,
            toolResult: outcome,
          };
          trace.steps.push(traceStep);
          onTraceStep?.(traceStep);
        }

        extractedActions = extractCadActions(finalResponseText);
        break;
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch')) {
          const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
          throw new Error(
            `Impossibile connettersi ad Ollama su ${baseUrl}. Assicurati che Ollama sia attivo e autorizzi l'origine locale (es. OLLAMA_ORIGINS="${origin}").`
          );
        }
        trace.error = err?.message || String(err);
        throw err;
      }
    }
  }

  // ==========================================
  // 3. Custom / LM Studio (OpenAI Compatible)
  // ==========================================
  else {
    const baseUrl = (config.customUrl || 'http://localhost:1234/v1').replace(/\/+$/, '');
    const model = config.customModel || 'local-model';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (config.customApiKey) {
      headers['Authorization'] = `Bearer ${config.customApiKey.trim()}`;
    }

    const messages: any[] = [
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user', content: prompt },
    ];

    while (currentIteration < maxIterations) {
      currentIteration++;
      const systemPrompt = buildSystemPrompt(ctx.doc, ctx.simState);

      const reqBody: any = {
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.2,
        tools: getOpenAiToolsDeclaration(),
      };

      try {
        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(reqBody),
        });

        if (!res.ok) {
          throw new Error(`Errore API (${res.status} ${res.statusText}) su ${baseUrl}`);
        }

        const data = await res.json();
        const choice = data.choices?.[0];
        const msg = choice?.message;

        if (msg?.tool_calls && Array.isArray(msg.tool_calls) && msg.tool_calls.length > 0) {
          messages.push(msg);

          for (const tc of msg.tool_calls) {
            const toolName = tc.function?.name;
            const toolArgs = typeof tc.function?.arguments === 'string'
              ? JSON.parse(tc.function.arguments)
              : tc.function?.arguments || {};

            const outcome = await dispatchCadTool(ctx, toolName, toolArgs);

            const traceStep: InteractionTraceStep = {
              step: currentIteration,
              timestamp: Date.now(),
              toolCall: { tool: toolName, args: toolArgs },
              toolResult: outcome,
            };
            trace.steps.push(traceStep);
            onTraceStep?.(traceStep);

            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(outcome),
            });
          }

          continue;
        }

        finalResponseText = msg?.content || '';

        const fallback = extractFallbackToolCall(finalResponseText);
        if (fallback) {
          const outcome = await dispatchCadTool(ctx, fallback.tool, fallback.args);
          const traceStep: InteractionTraceStep = {
            step: currentIteration,
            timestamp: Date.now(),
            toolCall: fallback,
            toolResult: outcome,
          };
          trace.steps.push(traceStep);
          onTraceStep?.(traceStep);
        }

        extractedActions = extractCadActions(finalResponseText);
        break;
      } catch (err: any) {
        if (err.message?.includes('Failed to fetch')) {
          throw new Error(`Impossibile connettersi all'endpoint ${baseUrl}. Verifica che il server sia attivo e con CORS abilitato.`);
        }
        trace.error = err?.message || String(err);
        throw err;
      }
    }
  }

  trace.finalAnswer = finalResponseText;
  trace.durationMs = Date.now() - startTime;

  return {
    text: finalResponseText,
    actions: extractedActions,
    trace,
  };
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

/**
 * Queries Google Gemini API to discover active models for this API key
 */
export async function fetchGeminiModels(apiKey: string): Promise<string[]> {
  if (!apiKey || !apiKey.trim()) return [];
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data.models)) return [];
    return data.models
      .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m: any) => m.name.replace(/^models\//, ''))
      .filter((name: string) => !name.includes('embedding') && !name.includes('aqa'));
  } catch {
    return [];
  }
}
