import { describe, it, expect, vi } from 'vitest';
import { SAMPLE_DIRECT_START } from '../samples/directStart';
import { CadExecutionContext, dispatchCadTool, CAD_TOOL_DEFINITIONS } from './cadToolDispatcher';
import { extractFallbackToolCall, sendAiPrompt, AiConfig } from './aiService';
import { createInitialSimState, SimState } from '../engine/simulation';

describe('CAD Tool Dispatcher & Copilot Tool Parity', () => {
  it('ha esattamente gli 8 strumenti definiti e allineati al server MCP', () => {
    const toolNames = CAD_TOOL_DEFINITIONS.map((t) => t.name);
    expect(toolNames).toContain('cad_control_simulation');
    expect(toolNames).toContain('cad_interact_element');
    expect(toolNames).toContain('cad_validate_drc');
    expect(toolNames).toContain('cad_apply_actions');
    expect(toolNames).toContain('cad_get_schematic');
    expect(toolNames).toContain('cad_get_library');
    expect(toolNames).toContain('cad_switch_page');
    expect(toolNames).toContain('cad_get_status');
  });

  it('esegue cad_control_simulation per avviare e arrestare la simulazione', async () => {
    let simStarted = false;
    let simStopped = false;

    const ctx: CadExecutionContext = {
      doc: SAMPLE_DIRECT_START,
      onDocChange: vi.fn(),
      simState: createInitialSimState(),
      onStartSim: () => {
        simStarted = true;
      },
      onStopSim: () => {
        simStopped = true;
      },
    };

    const startRes = await dispatchCadTool(ctx, 'cad_control_simulation', { command: 'start' });
    expect(startRes.success).toBe(true);
    expect(simStarted).toBe(true);

    const stopRes = await dispatchCadTool(ctx, 'cad_control_simulation', { command: 'stop' });
    expect(stopRes.success).toBe(true);
    expect(simStopped).toBe(true);
  });

  it('esegue cad_interact_element per premere un pulsante (-SB2) e avviare la simulazione se spenta', async () => {
    let simStarted = false;
    let currentSimState: SimState = createInitialSimState();

    const ctx: CadExecutionContext = {
      doc: SAMPLE_DIRECT_START,
      onDocChange: vi.fn(),
      simState: currentSimState,
      onSimStateChange: (updater: any) => {
        currentSimState = typeof updater === 'function' ? updater(currentSimState) : updater;
      },
      onStartSim: () => {
        simStarted = true;
      },
    };

    const res = await dispatchCadTool(ctx, 'cad_interact_element', {
      idOrTag: '-SB2',
      action: 'press',
      durationMs: 300,
    });

    expect(res.success).toBe(true);
    expect(simStarted).toBe(true);
    // Verifichiamo che l'elemento -SB2 (o suo ID) sia stato registrato nello stato
    expect(currentSimState.elementStates['sb2_start']).toBe(true);
  });

  it('esegue cad_validate_drc restituendo le anomalie circuitali reali', async () => {
    const ctx: CadExecutionContext = {
      doc: SAMPLE_DIRECT_START,
      onDocChange: vi.fn(),
      simState: createInitialSimState(),
    };

    const res = await dispatchCadTool(ctx, 'cad_validate_drc', {});
    expect(res.success).toBe(true);
    expect(res.result).toBeDefined();
    expect(Array.isArray(res.result.issues)).toBe(true);
    expect(res.result.count).toBe(0); // SAMPLE_DIRECT_START non ha errori DRC
  });

  it('esegue cad_apply_actions per inserire e rimuovere componenti', async () => {
    let updatedDoc = SAMPLE_DIRECT_START;

    const ctx: CadExecutionContext = {
      get doc() {
        return updatedDoc;
      },
      onDocChange: (newDoc) => {
        updatedDoc = newDoc;
      },
      simState: createInitialSimState(),
    };

    const initialCount = updatedDoc.elements.length;

    // Aggiunta spia pilota
    const addRes = await dispatchCadTool(ctx, 'cad_apply_actions', {
      actions: [
        {
          action: 'add_component',
          def: 'pilot_lamp',
          x: 240,
          y: 200,
          tag: '-HL1',
          props: { color: 'Verde' },
        },
      ],
    });

    expect(addRes.success).toBe(true);
    expect(updatedDoc.elements.length).toBe(initialCount + 1);

    // Rimozione
    const remRes = await dispatchCadTool(ctx, 'cad_apply_actions', {
      actions: [{ action: 'remove_component', id: '-HL1' }],
    });

    expect(remRes.success).toBe(true);
    expect(updatedDoc.elements.length).toBe(initialCount);
  });

  it('estrae ed esegue fallback tool calls da modelli senza function-calling nativo', () => {
    const fallbackText = `
Ho analizzato la richiesta. Per testare il circuito avvio la simulazione:
\`\`\`tool_call
{
  "tool": "cad_control_simulation",
  "args": { "command": "start" }
}
\`\`\`
`;
    const extracted = extractFallbackToolCall(fallbackText);
    expect(extracted).not.toBeNull();
    expect(extracted?.tool).toBe('cad_control_simulation');
    expect(extracted?.args?.command).toBe('start');
  });

  it('traccia fedelmente tutte le interazioni nella struttura InteractionTrace', async () => {
    let simStarted = false;

    const ctx: CadExecutionContext = {
      doc: SAMPLE_DIRECT_START,
      onDocChange: vi.fn(),
      simState: createInitialSimState(),
      onStartSim: () => {
        simStarted = true;
      },
    };

    // Mock fetch per simulare un modello Gemini che chiama un tool e poi conclude
    const originalFetch = globalThis.fetch;
    let callIndex = 0;

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, opts: any) => {
      callIndex++;
      if (callIndex === 1) {
        // Step 1: Modello invoca cad_control_simulation
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      functionCall: {
                        name: 'cad_control_simulation',
                        args: { command: 'start' },
                      },
                    },
                  ],
                },
              },
            ],
          }),
        };
      } else {
        // Step 2: Modello risponde con il messaggio finale
        return {
          ok: true,
          json: async () => ({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: 'Ho avviato la simulazione con successo. Il circuito è ora in funzione.',
                    },
                  ],
                },
              },
            ],
          }),
        };
      }
    });

    const config: AiConfig = {
      provider: 'gemini',
      geminiApiKey: 'test-fake-key',
      geminiModel: 'gemini-2.5-flash',
      ollamaUrl: '',
      ollamaModel: '',
      customUrl: '',
      customApiKey: '',
      customModel: '',
    };

    try {
      const res = await sendAiPrompt('Avvia la simulazione', ctx, config);

      expect(simStarted).toBe(true);
      expect(res.text).toContain('avviato la simulazione');
      expect(res.trace).toBeDefined();
      expect(res.trace.steps.length).toBe(1);
      expect(res.trace.steps[0].toolCall?.tool).toBe('cad_control_simulation');
      expect(res.trace.steps[0].toolResult?.success).toBe(true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
