import { Doc } from '../model/types';
import { SimState } from '../engine/simulation';
import { registry } from '../library/registry';
import { getCircuitSummary, executeCadActions, validateDRC, CadAction } from './cadCommands';
import { switchPage } from '../utils/pageUtils';

export interface CadExecutionContext {
  doc: Doc;
  onDocChange: (newDoc: Doc) => void;
  simState: SimState;
  onSimStateChange?: React.Dispatch<React.SetStateAction<SimState>> | ((updater: (prev: SimState) => SimState) => void);
  onStartSim?: () => void;
  onStopSim?: () => void;
  onResetFileHandle?: () => void;
  currentFileName?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  message?: string;
}

/**
 * Standard Tool Definitions for CADe_SIMU Next (MCP & Web Copilot)
 */
export const CAD_TOOL_DEFINITIONS = [
  {
    name: 'cad_control_simulation',
    description: 'Controlla il motore di simulazione interattivo nel browser (avvio o arresto della simulazione elettrotecnica).',
    parameters: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['start', 'stop', 'step'],
          description: "Comando: 'start' per avviare la simulazione, 'stop' per arrestarla, 'step' per avanzare di un passo.",
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'cad_interact_element',
    description:
      'Interagisce fisicamente con un componente durante la simulazione (es. preme un pulsante come -SB2, apre/chiude un interruttore come -Q1 o -S1, commuta un selettore). Se la simulazione non è attiva, viene avviata automaticamente.',
    parameters: {
      type: 'object',
      properties: {
        idOrTag: {
          type: 'string',
          description: 'Tag (es. "-SB2", "-Q1", "-S1") o ID del componente da azionare.',
        },
        action: {
          type: 'string',
          enum: ['press', 'toggle', 'open', 'close'],
          description: "'press' per pulsanti impulsivi (preme e rilascia), 'toggle' per commutare, 'close' per chiudere, 'open' per aprire.",
        },
        durationMs: {
          type: 'number',
          description: 'Durata della pressione in millisecondi per azione "press" (default: 400).',
        },
      },
      required: ['idOrTag'],
    },
  },
  {
    name: 'cad_validate_drc',
    description:
      'Esegue il Design Rule Check elettrotecnico completo sullo schema: segnala contatti orfani (senza bobina corrispondente), bobine senza contatti, morsetti flottanti o errori circuitali.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cad_apply_actions',
    description:
      'Aggiunge, rimuove o cabla componenti sulla canvas in tempo reale. Supporta add_component, remove_component, connect_terminals (cablaggio Manhattan a 90°), update_props e set_plc_code.',
    parameters: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          description: 'Lista di azioni CAD dichiarative da applicare.',
          items: {
            type: 'object',
            properties: {
              action: {
                type: 'string',
                enum: [
                  'add_component',
                  'remove_component',
                  'connect_terminals',
                  'add_wire',
                  'remove_wire',
                  'set_plc_code',
                  'update_props',
                  'set_sheet_info',
                  'clear_sheet',
                ],
              },
              def: { type: 'string', description: 'ID definizione componente (es. coil_standard, motor_3p_async, switch_nc)' },
              x: { type: 'number', description: 'Coordinata X (multiplo di 10)' },
              y: { type: 'number', description: 'Coordinata Y (multiplo di 10)' },
              tag: { type: 'string', description: 'Sigla componente (es. -KM1, -Q1)' },
              rot: { type: 'number', description: 'Rotazione in gradi (0, 90, 180, 270)' },
              id: { type: 'string', description: 'ID o tag per rimozione' },
              from: { type: 'string', description: 'Morsetto sorgente es. "-KM1:A1"' },
              to: { type: 'string', description: 'Morsetto destinazione es. "-SB1:14"' },
              kind: { type: 'string', description: 'Tipo conduttore: phase, phase_l2, phase_l3, neutral, pe, aux, pos, neg' },
              code: { type: 'string', description: 'Codice Structured Text per set_plc_code' },
              props: { type: 'object', description: 'Proprietà del componente' },
            },
            required: ['action'],
          },
        },
      },
      required: ['actions'],
    },
  },
  {
    name: 'cad_get_schematic',
    description:
      'Restituisce lo stato attuale del circuito con coordinate morsetti, potenziali elettrici attivi, componenti presenti e stato della simulazione.',
    parameters: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['summary', 'full'],
          description: "'summary' per riepilogo sintetico ottimizzato, 'full' per il JSON Doc completo.",
        },
      },
    },
  },
  {
    name: 'cad_get_library',
    description: 'Interroga il catalogo dei componenti disponibili nella libreria per categoria (es. Protezioni, Motori, Comando).',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Categoria da filtrare (es. "Alimentazione", "Protezioni", "Motori", "Bobine e Segnali").',
        },
      },
    },
  },
  {
    name: 'cad_switch_page',
    description: 'Commuta la visualizzazione corrente del foglio di disegno alla pagina indicata (indice 0-based).',
    parameters: {
      type: 'object',
      properties: {
        pageIndex: {
          type: 'number',
          description: 'Indice della pagina (0 per Foglio 1, 1 per Foglio 2, ecc.).',
        },
      },
      required: ['pageIndex'],
    },
  },
  {
    name: 'cad_get_status',
    description: 'Restituisce lo stato corrente della sessione: titolo, numero componenti, cavi e se la simulazione è attiva.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];

/**
 * Recursively converts any standard JSON Schema to a strict Gemini OpenAPI schema
 */
export function toGeminiSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;

  const res: any = {};
  if (schema.type) {
    const rawType = String(schema.type).toUpperCase();
    res.type = rawType === 'INTEGER' ? 'NUMBER' : rawType;
  }
  if (schema.description) {
    res.description = schema.description;
  }

  // Google Gemini API strictly requires that 'enum' is only defined on STRING types
  if (Array.isArray(schema.enum)) {
    if (res.type === 'STRING') {
      res.enum = schema.enum.map((v: any) => String(v));
    } else {
      res.description = (res.description ? res.description + ' ' : '') + `(Ammessi: ${schema.enum.join(', ')})`;
    }
  }

  if (schema.properties && typeof schema.properties === 'object') {
    res.properties = {};
    for (const [k, v] of Object.entries(schema.properties)) {
      res.properties[k] = toGeminiSchema(v);
    }
  }

  if (Array.isArray(schema.required)) {
    res.required = schema.required;
  }

  if (schema.items) {
    res.items = toGeminiSchema(schema.items);
  }

  return res;
}

/**
 * Formats tool definitions for Google Gemini API (functionDeclarations)
 */
export function getGeminiToolsDeclaration() {
  return [
    {
      functionDeclarations: CAD_TOOL_DEFINITIONS.map((t) => ({
        name: t.name,
        description: t.description,
        parameters: toGeminiSchema(t.parameters),
      })),
    },
  ];
}

/**
 * Formats tool definitions for OpenAI / Ollama API
 */
export function getOpenAiToolsDeclaration() {
  return CAD_TOOL_DEFINITIONS.map((t) => ({
    type: 'function',
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

/**
 * Central Dispatcher: executes any CAD tool against the live application context
 */
export async function dispatchCadTool(
  ctx: CadExecutionContext,
  toolName: string,
  params: Record<string, any> = {}
): Promise<ToolExecutionResult> {
  const normName = toolName.startsWith('cad_') ? toolName : `cad_${toolName}`;

  try {
    switch (normName) {
      case 'cad_control_simulation': {
        const cmd = params.command || 'start';
        if (cmd === 'start') {
          if (ctx.onStartSim) {
            ctx.onStartSim();
            return {
              success: true,
              result: { command: 'start', running: true },
              message: 'Simulazione avviata con successo nel simulatore.',
            };
          }
          return { success: false, error: 'Controllo simulazione (onStartSim) non disponibile nel contesto.' };
        } else if (cmd === 'stop') {
          if (ctx.onStopSim) {
            ctx.onStopSim();
            return {
              success: true,
              result: { command: 'stop', running: false },
              message: 'Simulazione arrestata con successo.',
            };
          }
          return { success: false, error: 'Controllo simulazione (onStopSim) non disponibile nel contesto.' };
        }
        return { success: false, error: `Comando simulazione sconosciuto: ${cmd}` };
      }

      case 'cad_interact_element': {
        const idOrTag = String(params.idOrTag || '').trim().toLowerCase();
        const action = params.action || 'press';
        const durationMs = Number(params.durationMs ?? 400);

        if (!idOrTag) {
          return { success: false, error: 'Parametro "idOrTag" mancante per interact_element.' };
        }

        // Avvia la simulazione se non è ancora in esecuzione
        if (!ctx.simState.running && ctx.onStartSim) {
          ctx.onStartSim();
        }

        // Cerca componente per id o tag esatto/parziale
        const elem =
          ctx.doc.elements.find(
            (el) =>
              el.id.toLowerCase() === idOrTag ||
              (el.tag && el.tag.toLowerCase() === idOrTag)
          ) ||
          ctx.doc.elements.find((el) => el.tag && el.tag.toLowerCase().includes(idOrTag));

        if (!elem) {
          return {
            success: false,
            error: `Componente con identificativo "${params.idOrTag}" non trovato nello schema attivo.`,
          };
        }

        const setSimState = ctx.onSimStateChange;
        if (!setSimState) {
          return {
            success: false,
            error: 'onSimStateChange non disponibile nel contesto per registrare l\'interazione.',
          };
        }

        const def = registry.get(elem.def);

        // Selettore rotativo
        if (def?.behavior.type === 'contact' && def.behavior.selectorPositions && def.behavior.selectorPositions.length > 0) {
          const numPositions = def.behavior.selectorPositions.length;
          const raw = ctx.simState.elementStates[elem.id];
          const cur =
            typeof raw === 'number'
              ? raw
              : typeof raw === 'boolean'
              ? (raw ? 1 : 0)
              : (def.behavior.defaultPos ?? 0);
          const targetPos = (cur + 1) % numPositions;

          setSimState((prev) => ({
            ...prev,
            elementStates: { ...prev.elementStates, [elem.id]: targetPos },
          }));

          return {
            success: true,
            result: { component: elem.tag || elem.id, action: 'selector_cycle', position: targetPos },
            message: `Selettore "${elem.tag || elem.id}" commutato alla posizione ${targetPos}.`,
          };
        }

        // Pressione impulsiva (pulsante)
        if (action === 'press') {
          setSimState((prev) => ({
            ...prev,
            elementStates: { ...prev.elementStates, [elem.id]: true },
          }));
          setTimeout(() => {
            setSimState((prev) => ({
              ...prev,
              elementStates: { ...prev.elementStates, [elem.id]: false },
            }));
          }, durationMs);

          return {
            success: true,
            result: { component: elem.tag || elem.id, action: 'press', durationMs },
            message: `Pulsante "${elem.tag || elem.id}" premuto per ${durationMs}ms e rilasciato.`,
          };
        }

        // Apertura o Chiusura fissa
        if (action === 'close' || action === 'open') {
          const targetState = action === 'close';
          setSimState((prev) => ({
            ...prev,
            elementStates: { ...prev.elementStates, [elem.id]: targetState },
            activeOutputs: elem.tag ? { ...prev.activeOutputs, [elem.tag]: targetState } : prev.activeOutputs,
          }));

          return {
            success: true,
            result: { component: elem.tag || elem.id, action, state: targetState },
            message: `Componente "${elem.tag || elem.id}" impostato a ${targetState ? 'CHIUSO/ATTIVO' : 'APERTO/INATTIVO'}.`,
          };
        }

        // Toggle
        setSimState((prev) => {
          const currentVal = prev.elementStates[elem.id] ?? (def?.behavior as any)?.defaultOn ?? false;
          const nextVal = !currentVal;
          const nextStates = { ...prev.elementStates, [elem.id]: nextVal };
          if (elem.tag) {
            ctx.doc.elements.forEach((o) => {
              if (o.tag === elem.tag) {
                nextStates[o.id] = nextVal;
              }
            });
          }
          return {
            ...prev,
            elementStates: nextStates,
            activeOutputs: elem.tag ? { ...prev.activeOutputs, [elem.tag]: nextVal } : prev.activeOutputs,
          };
        });

        return {
          success: true,
          result: { component: elem.tag || elem.id, action: 'toggle' },
          message: `Stato componente "${elem.tag || elem.id}" invertito (toggle).`,
        };
      }

      case 'cad_validate_drc': {
        const issues = validateDRC(ctx.doc);
        return {
          success: true,
          result: { issues, count: issues.length, ok: issues.length === 0 },
          message:
            issues.length === 0
              ? 'Controllo DRC superato con successo: 0 errori.'
              : `Rilevate ${issues.length} anomalie DRC:\n${issues.join('\n')}`,
        };
      }

      case 'cad_apply_actions': {
        const actions: CadAction[] = Array.isArray(params.actions) ? params.actions : [];
        if (actions.length === 0) {
          return { success: false, error: 'Lista di azioni vuota per cad_apply_actions.' };
        }

        const res = executeCadActions(ctx.doc, actions);
        ctx.onDocChange(res.doc);

        if (actions.some((a) => (a as any).action === 'clear_sheet')) {
          ctx.onResetFileHandle?.();
        }

        return {
          success: res.errors.length === 0,
          result: {
            successCount: res.successCount,
            errors: res.errors,
            elementsCount: res.doc.elements.length,
            wiresCount: res.doc.wires.length,
          },
          message:
            res.errors.length === 0
              ? `Applicate con successo ${res.successCount} azioni CAD.`
              : `Applicate ${res.successCount} azioni con errori:\n${res.errors.join('\n')}`,
        };
      }

      case 'cad_get_schematic': {
        const format = params.format || 'summary';
        if (format === 'full') {
          return { success: true, result: ctx.doc };
        }
        const summary = getCircuitSummary(ctx.doc, ctx.simState);
        return { success: true, result: summary };
      }

      case 'cad_get_library': {
        const category = params.category?.toLowerCase();
        const all = registry.getAll();
        const filtered = category
          ? all.filter((def) => def.category?.toLowerCase() === category)
          : all;

        const catalog = filtered.map((def) => ({
          id: def.id,
          name: def.name,
          category: def.category,
          tagPrefix: def.tagPrefix,
          terminals: def.terminals.map((t) => ({
            id: t.id,
            label: t.label || t.id,
            desc: t.desc,
          })),
        }));

        return { success: true, result: { catalog, count: catalog.length } };
      }

      case 'cad_switch_page': {
        const targetIndex = Number(params.pageIndex ?? 0);
        const switched = switchPage(ctx.doc, targetIndex);
        ctx.onDocChange(switched);
        return {
          success: true,
          result: { activePageIndex: targetIndex },
          message: `Foglio commutato alla pagina ${targetIndex + 1}.`,
        };
      }

      case 'cad_set_document': {
        const newDoc = params.doc;
        if (!newDoc) {
          return { success: false, error: 'Parametro "doc" mancante per cad_set_document.' };
        }
        ctx.onDocChange(newDoc);
        ctx.onResetFileHandle?.();
        return {
          success: true,
          result: {
            pagesCount: newDoc.pages?.length || 1,
            elementsCount: newDoc.elements?.length || 0,
            wiresCount: newDoc.wires?.length || 0,
          },
          message: 'Documento di progetto CAD caricato con successo.',
        };
      }

      case 'cad_get_status': {
        return {
          success: true,
          result: {
            title: ctx.doc.sheet?.title || ctx.currentFileName || 'Senza Titolo',
            elementsCount: ctx.doc.elements.length,
            wiresCount: ctx.doc.wires.length,
            simulationRunning: Boolean(ctx.simState.running),
            fault: ctx.simState.fault?.type || null,
          },
        };
      }

      default:
        return {
          success: false,
          error: `Strumento CAD sconosciuto: ${normName}`,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      error: `Errore durante l'esecuzione del tool ${normName}: ${err?.message || String(err)}`,
    };
  }
}
