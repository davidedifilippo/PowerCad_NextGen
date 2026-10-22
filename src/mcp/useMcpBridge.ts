import { useEffect, useRef, useState } from 'react';
import { Doc } from '../model/types';
import { SimState } from '../engine/simulation';
import { getCircuitSummary, executeCadActions, validateDRC, CadAction } from '../ai/cadCommands';
import { registry } from '../library/registry';

interface McpBridgeProps {
  doc: Doc;
  onDocChange: (newDoc: Doc) => void;
  simState: SimState;
  onSimStateChange?: React.Dispatch<React.SetStateAction<SimState>>;
  onStartSim: () => void;
  onStopSim: () => void;
  currentFileName?: string;
  wsUrl?: string;
}

export function useMcpBridge({
  doc,
  onDocChange,
  simState,
  onSimStateChange,
  onStartSim,
  onStopSim,
  currentFileName,
  wsUrl = 'ws://localhost:4321',
}: McpBridgeProps) {
  const [isMcpConnected, setIsMcpConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Keep latest references for RPC callbacks
  const latestRef = useRef({
    doc,
    onDocChange,
    simState,
    onSimStateChange,
    onStartSim,
    onStopSim,
    currentFileName,
  });

  useEffect(() => {
    latestRef.current = {
      doc,
      onDocChange,
      simState,
      onSimStateChange,
      onStartSim,
      onStopSim,
      currentFileName,
    };
  }, [doc, onDocChange, simState, onSimStateChange, onStartSim, onStopSim, currentFileName]);

  // Broadcast status to MCP server on state change
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: 'status_update',
            data: {
              projectTitle: doc.sheet?.title || currentFileName || 'Senza Titolo',
              elementsCount: doc.elements.length,
              wiresCount: doc.wires.length,
              simulationRunning: Boolean(simState?.running),
              fault: simState?.fault?.type || null,
            },
          })
        );
      } catch {
        // silent
      }
    }
  }, [doc, simState, currentFileName]);

  useEffect(() => {
    let reconnectTimer: any = null;
    let isUnmounted = false;

    function connect() {
      if (isUnmounted) return;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) {
            ws.close();
            return;
          }
          setIsMcpConnected(true);

          // Initial status broadcast
          const current = latestRef.current;
          ws.send(
            JSON.stringify({
              type: 'status_update',
              data: {
                projectTitle: current.doc.sheet?.title || current.currentFileName || 'Senza Titolo',
                elementsCount: current.doc.elements.length,
                wiresCount: current.doc.wires.length,
                simulationRunning: Boolean(current.simState?.running),
                fault: current.simState?.fault?.type || null,
              },
            })
          );
        };

        ws.onmessage = (event) => {
          try {
            const req = JSON.parse(event.data);
            if (!req.id || !req.method) return;

            const current = latestRef.current;

            switch (req.method) {
              case 'get_schematic': {
                const format = req.params?.format || 'summary';
                if (format === 'full') {
                  ws.send(JSON.stringify({ id: req.id, result: current.doc }));
                } else {
                  const summary = getCircuitSummary(current.doc, current.simState);
                  ws.send(JSON.stringify({ id: req.id, result: summary }));
                }
                break;
              }

              case 'apply_actions': {
                const actions: CadAction[] = req.params?.actions || [];
                const res = executeCadActions(current.doc, actions);
                current.onDocChange(res.doc);
                ws.send(
                  JSON.stringify({
                    id: req.id,
                    result: {
                      successCount: res.successCount,
                      errors: res.errors,
                      newElementsCount: res.doc.elements.length,
                      newWiresCount: res.doc.wires.length,
                    },
                  })
                );
                break;
              }

              case 'validate_drc': {
                const issues = validateDRC(current.doc);
                ws.send(JSON.stringify({ id: req.id, result: { issues, count: issues.length } }));
                break;
              }

              case 'control_simulation': {
                const cmd = req.params?.command;
                if (cmd === 'start') {
                  current.onStartSim();
                } else if (cmd === 'stop') {
                  current.onStopSim();
                }
                ws.send(JSON.stringify({ id: req.id, result: { command: cmd, success: true } }));
                break;
              }

              case 'interact_element': {
                const idOrTag = (req.params?.idOrTag || '').trim().toLowerCase();
                const action = req.params?.action || 'press';
                const durationMs = req.params?.durationMs || 400;

                if (!idOrTag) {
                  ws.send(JSON.stringify({ id: req.id, error: 'Parametro "idOrTag" mancante.' }));
                  break;
                }

                // Avvia automaticamente la simulazione se è ferma
                if (!current.simState.running) {
                  current.onStartSim();
                }

                // Trova componente per id, tag esatto o corrispondenza parziale (es. "-SB2" trova "-SB2 (Marcia)")
                const elem =
                  current.doc.elements.find(
                    (el) =>
                      el.id.toLowerCase() === idOrTag ||
                      (el.tag && el.tag.toLowerCase() === idOrTag)
                  ) ||
                  current.doc.elements.find(
                    (el) => el.tag && el.tag.toLowerCase().includes(idOrTag)
                  );

                if (!elem) {
                  ws.send(
                    JSON.stringify({
                      id: req.id,
                      error: `Componente "${req.params?.idOrTag}" non trovato nello schema corrente.`,
                    })
                  );
                  break;
                }

                const def = registry.get(elem.def);
                if (!current.onSimStateChange) {
                  ws.send(
                    JSON.stringify({
                      id: req.id,
                      error: 'Interazione non configurata (onSimStateChange mancante in useMcpBridge).',
                    })
                  );
                  break;
                }

                const setSimState = current.onSimStateChange;

                // 0. Selettore rotativo multi-posizione (es. commutatori a 3 posizioni)
                if (def?.behavior.type === 'contact' && def.behavior.selectorPositions && def.behavior.selectorPositions.length > 0) {
                  const numPositions = def.behavior.selectorPositions.length;
                  const raw = current.simState.elementStates[elem.id];
                  const cur =
                    typeof raw === 'number'
                      ? raw
                      : typeof raw === 'boolean'
                      ? (raw ? 1 : 0)
                      : (def.behavior.type === 'contact' ? (def.behavior.defaultPos ?? 0) : 0);
                  const targetPos = (cur + 1) % numPositions;

                  setSimState((prev) => ({
                    ...prev,
                    elementStates: { ...prev.elementStates, [elem.id]: targetPos },
                  }));

                  ws.send(
                    JSON.stringify({
                      id: req.id,
                      result: {
                        success: true,
                        component: elem.tag || elem.id,
                        action: 'selector_cycle',
                        position: targetPos,
                        message: `Selettore "${elem.tag || elem.id}" commutato alla posizione successiva (${targetPos}).`,
                      },
                    })
                  );
                  break;
                }

                // 1. Pressione impulsiva (tipica di pulsanti di marcia/arresto NA o NC)
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

                  ws.send(
                    JSON.stringify({
                      id: req.id,
                      result: {
                        success: true,
                        component: elem.tag || elem.id,
                        action: 'press',
                        durationMs,
                        message: `Pulsante "${elem.tag || elem.id}" premuto per ${durationMs}ms e rilasciato.`,
                      },
                    })
                  );
                  break;
                }

                // 2. Chiusura o apertura fissa
                if (action === 'close' || action === 'open') {
                  const targetState = action === 'close';
                  setSimState((prev) => ({
                    ...prev,
                    elementStates: { ...prev.elementStates, [elem.id]: targetState },
                    activeOutputs: elem.tag ? { ...prev.activeOutputs, [elem.tag]: targetState } : prev.activeOutputs,
                  }));
                  ws.send(
                    JSON.stringify({
                      id: req.id,
                      result: {
                        success: true,
                        component: elem.tag || elem.id,
                        action,
                        state: targetState,
                        message: `Stato componente "${elem.tag || elem.id}" impostato a ${targetState ? 'CHIUSO/ATTIVO' : 'APERTO/INATTIVO'}.`,
                      },
                    })
                  );
                  break;
                }

                // 3. Toggle stato (interruttore/sezionatore)
                setSimState((prev) => {
                  const currentVal = prev.elementStates[elem.id] ?? (def?.behavior as any)?.defaultOn ?? false;
                  const nextVal = !currentVal;
                  return {
                    ...prev,
                    elementStates: { ...prev.elementStates, [elem.id]: nextVal },
                    activeOutputs: elem.tag ? { ...prev.activeOutputs, [elem.tag]: nextVal } : prev.activeOutputs,
                  };
                });

                ws.send(
                  JSON.stringify({
                    id: req.id,
                    result: {
                      success: true,
                      component: elem.tag || elem.id,
                      action: 'toggle',
                      message: `Componente "${elem.tag || elem.id}" commutato (toggle).`,
                    },
                  })
                );
                break;
              }

              case 'get_library': {
                const category = req.params?.category?.toLowerCase();
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

                ws.send(JSON.stringify({ id: req.id, result: { catalog, count: catalog.length } }));
                break;
              }

              default: {
                ws.send(
                  JSON.stringify({
                    id: req.id,
                    error: `Metodo non supportato: ${req.method}`,
                  })
                );
              }
            }
          } catch (err: any) {
            console.warn('[MCP Bridge] Errore elaborazione richiesta:', err);
          }
        };

        ws.onclose = () => {
          setIsMcpConnected(false);
          wsRef.current = null;
          if (!isUnmounted) {
            reconnectTimer = setTimeout(connect, 3000);
          }
        };

        ws.onerror = () => {
          // Silent: server might simply not be running
          ws.close();
        };
      } catch {
        if (!isUnmounted) {
          reconnectTimer = setTimeout(connect, 3000);
        }
      }
    }

    connect();

    return () => {
      isUnmounted = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [wsUrl]);

  return { isMcpConnected };
}
