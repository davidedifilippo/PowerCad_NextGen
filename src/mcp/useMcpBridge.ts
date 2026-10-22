import { useEffect, useRef, useState } from 'react';
import { Doc } from '../model/types';
import { SimState } from '../engine/simulation';
import { dispatchCadTool } from '../ai/cadToolDispatcher';

interface McpBridgeProps {
  doc: Doc;
  onDocChange: (newDoc: Doc) => void;
  simState: SimState;
  onSimStateChange?: React.Dispatch<React.SetStateAction<SimState>>;
  onStartSim: () => void;
  onStopSim: () => void;
  currentFileName?: string;
  onResetFileHandle?: () => void;
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
  onResetFileHandle,
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
    onResetFileHandle,
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
      onResetFileHandle,
    };
  }, [doc, onDocChange, simState, onSimStateChange, onStartSim, onStopSim, currentFileName, onResetFileHandle]);

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
            dispatchCadTool(current, req.method, req.params)
              .then((outcome) => {
                if (outcome.success) {
                  ws.send(JSON.stringify({ id: req.id, result: outcome.result }));
                } else {
                  ws.send(JSON.stringify({ id: req.id, error: outcome.error || 'Errore esecuzione comando CAD.' }));
                }
              })
              .catch((err) => {
                ws.send(JSON.stringify({ id: req.id, error: err?.message || String(err) }));
              });
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
