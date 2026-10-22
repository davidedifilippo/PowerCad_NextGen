import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { WebSocketServer, WebSocket } from 'ws';
import * as fs from 'fs';
import * as path from 'path';

// Port for browser connection
const WS_PORT = parseInt(process.env.POWERCAD_WS_PORT || '4321', 10);

// Connected browser client state
let activeBrowserWs: WebSocket | null = null;
let lastKnownStatus: any = {
  connected: false,
  projectTitle: 'Nessun browser connesso',
  elementsCount: 0,
  wiresCount: 0,
  simulationRunning: false,
};

// Pending RPC requests to browser
const pendingRequests = new Map<
  string,
  {
    resolve: (val: any) => void;
    reject: (err: any) => void;
    timer: NodeJS.Timeout;
  }
>();

// Setup WebSocket Server for browser bridge
const wss = new WebSocketServer({ port: WS_PORT });

wss.on('listening', () => {
  console.error(`[PowerCAD-MCP] WebSocket bridge attivo su ws://localhost:${WS_PORT}`);
});

wss.on('connection', (ws) => {
  console.error('[PowerCAD-MCP] Browser PowerCAD connesso con successo.');
  activeBrowserWs = ws;
  lastKnownStatus.connected = true;

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // 1. Status broadcast from browser
      if (msg.type === 'status_update') {
        lastKnownStatus = { connected: true, ...msg.data };
        return;
      }

      // 2. Response to an RPC request
      if (msg.id && pendingRequests.has(msg.id)) {
        const { resolve, reject, timer } = pendingRequests.get(msg.id)!;
        clearTimeout(timer);
        pendingRequests.delete(msg.id);

        if (msg.error) {
          reject(new Error(msg.error));
        } else {
          resolve(msg.result);
        }
      }
    } catch (err) {
      console.error('[PowerCAD-MCP] Errore parsing messaggio browser:', err);
    }
  });

  ws.on('close', () => {
    console.error('[PowerCAD-MCP] Browser PowerCAD disconnesso.');
    if (activeBrowserWs === ws) {
      activeBrowserWs = null;
      lastKnownStatus.connected = false;
    }
  });

  ws.on('error', (err) => {
    console.error('[PowerCAD-MCP] Errore socket browser:', err.message);
  });
});

/**
 * Sends a JSON-RPC request to the connected browser
 */
function sendBrowserRpc(method: string, params: any = {}, timeoutMs = 10000): Promise<any> {
  if (!activeBrowserWs || activeBrowserWs.readyState !== WebSocket.OPEN) {
    return Promise.reject(
      new Error(
        'Nessun browser PowerCAD connesso. Assicurati che l\'applicazione web sia aperta su http://localhost:5173/ con il bridge MCP attivo.'
      )
    );
  }

  const id = `rpc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingRequests.delete(id);
      reject(new Error(`Timeout richiesta al browser (${timeoutMs}ms) per '${method}'.`));
    }, timeoutMs);

    pendingRequests.set(id, { resolve, reject, timer });

    activeBrowserWs!.send(
      JSON.stringify({
        id,
        method,
        params,
      })
    );
  });
}

// Setup MCP Server
const mcpServer = new Server(
  {
    name: 'powercad-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define MCP Tools
const TOOLS: Tool[] = [
  {
    name: 'cad_get_status',
    description:
      'Verifica lo stato di connessione con il browser PowerCAD Next-Gen, il titolo del progetto aperto, il numero di componenti/conduttori e lo stato della simulazione.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cad_get_schematic',
    description:
      'Ispeziona e restituisce la struttura semantica completa dello schema elettrico correntemente aperto nel browser: elenco componenti, morsetti e relative coordinate nel foglio, stato logico dei contatti, potenziali elettrici di simulazione (fasi, neutro, PE), codice ST del micro-PLC e violazioni delle regole di progettazione (DRC).',
    inputSchema: {
      type: 'object',
      properties: {
        format: {
          type: 'string',
          enum: ['summary', 'full'],
          description:
            'Formato di ritorno: "summary" (ottimizzato per token con coordinate morsetti e stati simulazione) oppure "full" (JSON completo dell\'oggetto Doc). Default: "summary".',
        },
      },
    },
  },
  {
    name: 'cad_apply_actions',
    description:
      'Esegue modifiche direttamente sulla canvas del browser in tempo reale, registrando la cronologia per l\'Undo. Supporta l\'aggiunta di componenti, rimozione, tracciamento cavi ad angolo retto (Manhattan a 90°), modifica codice Structured Text PLC e aggiornamento proprietà.',
    inputSchema: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          description: 'Lista di azioni CAD dichiarative da eseguire.',
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
              title: { type: 'string', description: 'Titolo dello schema per set_sheet_info' },
              date: { type: 'string', description: 'Data dello schema (es. AAAA-MM-GG) per set_sheet_info' },
              author: { type: 'string', description: 'Autore dello schema per set_sheet_info' },
              project: { type: 'string', description: 'Nome del progetto per set_sheet_info' },
              def: { type: 'string', description: 'ID definizione componente per add_component (es. coil_standard, pwr_3p_pe, motor_3p_async)' },
              x: { type: 'number', description: 'Coordinata X (multiplo di 10)' },
              y: { type: 'number', description: 'Coordinata Y (multiplo di 10)' },
              tag: { type: 'string', description: 'Etichetta componente (es. -KM1, LINEA, -Q1)' },
              rot: { type: 'number', enum: [0, 90, 180, 270], description: 'Rotazione in gradi' },
              id: { type: 'string', description: 'ID o tag del componente per rimozione o aggiornamento' },
              from: { type: 'string', description: 'Morsetto di partenza nel formato "TAG:MORSETTO" (es. "LINEA:L1", "-KM1:A1")' },
              to: { type: 'string', description: 'Morsetto di arrivo nel formato "TAG:MORSETTO" (es. "-Q1:1", "-SB1:14")' },
              kind: {
                type: 'string',
                description: 'Tipo di conduttore: phase, phase_l2, phase_l3, neutral, pe, aux, pos, neg',
              },
              code: { type: 'string', description: 'Codice sorgente Structured Text per set_plc_code' },
              props: { type: 'object', description: 'Proprietà del componente (es. color: "Verde")' },
            },
            required: ['action'],
          },
        },
      },
      required: ['actions'],
    },
  },
  {
    name: 'cad_validate_drc',
    description:
      'Esegue il Design Rule Check elettrotecnico completo sullo schema: segnala contatti orfani (senza bobina corrispondente), bobine senza contatti, morsetti flottanti o collegamenti mancanti.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'cad_control_simulation',
    description:
      'Controlla il motore di simulazione interattivo nel browser (avvio, stop o singolo passo).',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          enum: ['start', 'stop', 'step'],
          description: 'Comando di simulazione da inviare al browser.',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'cad_interact_element',
    description:
      'Interagisce con un componente del circuito durante la simulazione (es. preme un pulsante di marcia come -SB2, un pulsante di arresto come -SB1, apre o chiude un magnetotermico come -Q1, o fa scattare un relè termico). Se la simulazione non è attiva, viene avviata automaticamente.',
    inputSchema: {
      type: 'object',
      properties: {
        idOrTag: {
          type: 'string',
          description:
            'Tag o ID del componente con cui interagire (es. "-SB2", "-SB1", "-Q1", "-FR1"). Supporta corrispondenza parziale (es. "-SB2" trova "-SB2 (Marcia)").',
        },
        action: {
          type: 'string',
          enum: ['press', 'toggle', 'open', 'close'],
          description:
            '"press" per pulsanti impulsivi (preme e rilascia automaticamente dopo durationMs), "toggle" per commutare interruttori/sezionatori, "close" per chiudere, "open" per aprire. Default: "press".',
        },
        durationMs: {
          type: 'number',
          description: 'Durata della pressione in millisecondi per pulsanti impulsivi (default: 400).',
        },
      },
      required: ['idOrTag'],
    },
  },
  {
    name: 'cad_get_library',
    description:
      'Elenca tutti i componenti disponibili nella libreria di PowerCAD, suddivisi per categoria, con i relativi morsetti (pinout) e prefissi tag predefiniti.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filtra per categoria (es. "Alimentazione", "Comando & Segnalazione", "Potenza", "Motori", "PLC").',
        },
      },
    },
  },
  {
    name: 'cad_read_project_file',
    description:
      'Legge un file schema `.json` direttamente dal disco locale (funziona anche quando il browser è chiuso).',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Percorso assoluto o relativo del file schema .json da leggere.',
        },
      },
      required: ['filePath'],
    },
  },
  {
    name: 'cad_write_project_file',
    description:
      'Salva uno schema circuitale direttamente su file `.json` su disco.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Percorso del file in cui salvare lo schema.',
        },
        docJson: {
          type: 'string',
          description: 'Stringa JSON dell\'oggetto Doc da salvare.',
        },
      },
      required: ['filePath', 'docJson'],
    },
  },
];

// Handle ListTools
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handle CallTool
mcpServer.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;

  try {
    switch (name) {
      case 'cad_get_status': {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(lastKnownStatus, null, 2),
            },
          ],
        };
      }

      case 'cad_get_schematic': {
        const format = (args?.format as string) || 'summary';
        const result = await sendBrowserRpc('get_schematic', { format });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cad_apply_actions': {
        const actions = (args?.actions as any[]) || [];
        const result = await sendBrowserRpc('apply_actions', { actions });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cad_validate_drc': {
        const result = await sendBrowserRpc('validate_drc', {});
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cad_control_simulation': {
        const command = args?.command as string;
        const result = await sendBrowserRpc('control_simulation', { command });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cad_interact_element': {
        const idOrTag = args?.idOrTag as string;
        const action = (args?.action as string) || 'press';
        const durationMs = (args?.durationMs as number) || 400;
        const result = await sendBrowserRpc('interact_element', { idOrTag, action, durationMs });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cad_get_library': {
        const category = args?.category as string | undefined;
        const result = await sendBrowserRpc('get_library', { category });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'cad_read_project_file': {
        const rawPath = args?.filePath as string;
        const absPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
        if (!fs.existsSync(absPath)) {
          throw new Error(`File non trovato: ${absPath}`);
        }
        const content = fs.readFileSync(absPath, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'cad_write_project_file': {
        const rawPath = args?.filePath as string;
        const docJson = args?.docJson as string;
        const absPath = path.isAbsolute(rawPath) ? rawPath : path.resolve(process.cwd(), rawPath);
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        fs.writeFileSync(absPath, docJson, 'utf-8');
        return {
          content: [
            {
              type: 'text',
              text: `Schema salvato con successo in: ${absPath}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Strumento MCP sconosciuto: ${name}`);
    }
  } catch (err: any) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Errore durante l'esecuzione di ${name}: ${err?.message || err}`,
        },
      ],
    };
  }
});

// Start MCP Server on Stdio
async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.error('[PowerCAD-MCP] Server MCP connesso su stdio e pronto.');
}

main().catch((err) => {
  console.error('[PowerCAD-MCP] Errore irreversibile avvio server:', err);
  process.exit(1);
});
