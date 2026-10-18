import React from 'react';
import { WireKind } from '../model/types';
import { X } from 'lucide-react';

interface Props {
  activeWireTool: WireKind | null;
  onSelectWireTool: (kind: WireKind | null) => void;
  disabled?: boolean;
}

export const WIRE_COLOR_MAP: Record<WireKind, string> = {
  phase: '#9a3412',
  phase_l2: '#0f172a',
  phase_l3: '#64748b',
  neutral: '#2563eb',
  pe: '#16a34a',
  pos: '#ef4444',
  neg: '#0f172a',
  aux: '#475569',
  '3p_vert': '#9a3412',
  '3p_horiz': '#9a3412',
};

export const WireToolbar: React.FC<Props> = ({
  activeWireTool,
  onSelectWireTool,
  disabled,
}) => {
  const tools: {
    kind: WireKind;
    label: string;
    tooltip: string;
    renderIcon: () => React.ReactNode;
  }[] = [
    {
      kind: 'phase',
      label: 'Fase L1',
      tooltip: 'Cavo Fase L1 (Marrone - CEI EN 60446) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#9a3412" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: 'phase_l2',
      label: 'Fase L2',
      tooltip: 'Cavo Fase L2 (Nero - CEI EN 60446) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: 'phase_l3',
      label: 'Fase L3',
      tooltip: 'Cavo Fase L3 (Grigio - CEI EN 60446) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: 'neutral',
      label: 'Neutro (N)',
      tooltip: 'Cavo Neutro N (Blu chiaro - CEI EN 60446) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: 'pe',
      label: 'Terra (PE)',
      tooltip: 'Cavo Protezione Terra PE (Giallo/Verde tratteggiato) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#16a34a" strokeWidth="2.5" strokeDasharray="5 3" strokeLinecap="round" />
          <line x1="2" y1="9" x2="26" y2="9" stroke="#eab308" strokeWidth="1.2" strokeDasharray="3 5" />
        </svg>
      ),
    },
    {
      kind: 'pos',
      label: 'Positivo (+)',
      tooltip: 'Cavo Positivo (+) DC 24V (Rosso) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: 'neg',
      label: 'Negativo (-)',
      tooltip: 'Cavo Negativo (-) DC 0V (Nero) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: 'aux',
      label: 'Comando',
      tooltip: 'Cavo Comando / Ausiliario (Grigio scuro) - Clicca o premi Esc per uscire',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="9" x2="26" y2="9" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      kind: '3p_vert',
      label: '3F Vert (|||)',
      tooltip: 'Fascio 3 Cavi Trifase Verticali (L1 Marrone, L2 Nero, L3 Grigio - Passo 20px)',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="7" y1="2" x2="7" y2="16" stroke="#9a3412" strokeWidth="1.8" />
          <line x1="14" y1="2" x2="14" y2="16" stroke="#0f172a" strokeWidth="1.8" />
          <line x1="21" y1="2" x2="21" y2="16" stroke="#64748b" strokeWidth="1.8" />
        </svg>
      ),
    },
    {
      kind: '3p_horiz',
      label: '3F Orizz (≡)',
      tooltip: 'Fascio 3 Cavi Trifase Orizzontali (L1 Marrone, L2 Nero, L3 Grigio - Passo 20px)',
      renderIcon: () => (
        <svg width="28" height="18" viewBox="0 0 28 18">
          <line x1="2" y1="4" x2="26" y2="4" stroke="#9a3412" strokeWidth="1.8" />
          <line x1="2" y1="9" x2="26" y2="9" stroke="#0f172a" strokeWidth="1.8" />
          <line x1="2" y1="14" x2="26" y2="14" stroke="#64748b" strokeWidth="1.8" />
        </svg>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 12px',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        userSelect: 'none',
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', marginRight: 6 }}>
        Cavi & Connessioni:
      </span>

      {tools.map((t) => {
        const isActive = activeWireTool === t.kind;
        return (
          <button
            key={t.kind}
            title={t.tooltip}
            disabled={disabled}
            onClick={() => onSelectWireTool(isActive ? null : t.kind)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              borderRadius: 5,
              border: isActive ? '2px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: isActive ? '#eff6ff' : '#ffffff',
              boxShadow: isActive ? '0 0 0 2px rgba(37,99,235,0.2)' : 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              height: 28,
              transition: 'all 0.15s ease',
            }}
          >
            {t.renderIcon()}
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#1d4ed8' : '#1e293b',
              }}
            >
              {t.label}
            </span>
          </button>
        );
      })}

      {activeWireTool && (
        <button
          onClick={() => onSelectWireTool(null)}
          title="Annulla modalità disegno cavo (Esc)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 5,
            border: '1px solid #fca5a5',
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 600,
            height: 28,
            marginLeft: 4,
          }}
        >
          <X size={13} />
          <span>Esc (Esci)</span>
        </button>
      )}
    </div>
  );
};
