import React from 'react';
import { Doc, Element, Prim, Wire, Sheet, ComponentDef } from '../model/types';
import { registry } from '../library/registry';
import { localToWorld, getSheetDimensions, Box } from '../utils/geometry';
import { SimState } from '../engine/simulation';

interface Props {
  doc: Doc;
  simState: SimState;
  selectedId?: string | null;
  selectedIds?: Set<string>;
  selectionBox?: Box | null;
  onElementClick?: (elem: Element, e: React.MouseEvent) => void;
  onElementMouseDown?: (elem: Element, e: React.MouseEvent) => void;
  onElementContextMenu?: (elem: Element, e: React.MouseEvent) => void;
  onWireClick?: (wire: Wire, e: React.MouseEvent) => void;
  onWireMouseDown?: (wire: Wire, e: React.MouseEvent) => void;
  onWireHandleMouseDown?: (wire: Wire, pointIndex: number, e: React.MouseEvent) => void;
  onWireContextMenu?: (wire: Wire, e: React.MouseEvent) => void;
  onTerminalClick?: (elem: Element, termId: string, worldPos: { x: number; y: number }) => void;
  wireDraft?: { x: number; y: number }[];
  draftColor?: string;
}

export const Renderer: React.FC<Props> = ({
  doc,
  simState,
  selectedId,
  selectedIds,
  selectionBox,
  onElementClick,
  onElementMouseDown,
  onElementContextMenu,
  onWireClick,
  onWireMouseDown,
  onWireHandleMouseDown,
  onWireContextMenu,
  onTerminalClick,
  wireDraft,
  draftColor,
}) => {
  const { sheet } = doc;
  const { w: sheetW, h: sheetH } = getSheetDimensions(sheet.format, sheet.orientation);

  const isItemSelected = (id: string) => {
    if (selectedIds) return selectedIds.has(id);
    return selectedId === id;
  };

  return (
    <g className="schematic-root">
      {/* 1. Sheet Border, Grid & Professional Title Block (Cartiglio) */}
      <SheetFrame sheet={sheet} w={sheetW} h={sheetH} />

      {/* 2. Wires (conductors) */}
      <g className="wires-layer">
        {doc.wires.map((wire) => {
          const isEnergized = simState.running && simState.energizedWires.has(wire.id);
          const isSelected = isItemSelected(wire.id);
          const baseColor =
            wire.color ||
            (wire.kind === 'phase'
              ? '#9a3412'
              : wire.kind === 'neutral'
              ? '#2563eb'
              : wire.kind === 'pe'
              ? '#16a34a'
              : wire.kind === 'pos'
              ? '#ef4444'
              : wire.kind === 'neg'
              ? '#0f172a'
              : '#1e293b');
          const isPe = wire.kind === 'pe';
          const stroke = isEnergized
            ? '#ef4444' // Bright red for live wire
            : isSelected
            ? '#2563eb' // Bright blue for selected wire
            : baseColor;
          const strokeWidth = isEnergized ? 2.5 : isSelected ? 3 : 1.8;
          const strokeDasharray = isPe && !isEnergized ? '6 3' : undefined;

          const d = wire.pts.reduce(
            (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
            ''
          );

          return (
            <g key={wire.id} className={`wire-group ${isSelected ? 'selected' : ''}`}>
              {/* Visible conductor line */}
              <path
                d={d}
                fill="none"
                stroke={stroke}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Halo when selected */}
              {isSelected && (
                <path
                  d={d}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={6}
                  strokeOpacity={0.35}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* Invisible wide hit-box for effortless wire selection and dragging */}
              <path
                d={d}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                pointerEvents="stroke"
                style={{ cursor: simState.running ? 'default' : isSelected ? 'move' : 'pointer' }}
                onMouseDown={(e) => {
                  if (simState.running) return;
                  if (e.button === 0) {
                    onWireMouseDown?.(wire, e);
                  }
                }}
                onClick={(e) => {
                  if (simState.running) return;
                  e.stopPropagation();
                  onWireClick?.(wire, e);
                }}
                onContextMenu={(e) => {
                  if (simState.running) return;
                  e.preventDefault();
                  e.stopPropagation();
                  onWireContextMenu?.(wire, e);
                }}
              />

              {/* Endpoint & vertex handles for stretching wire length */}
              {isSelected && !simState.running && (
                <g className="wire-handles">
                  {wire.pts.map((p, idx) => (
                    <g key={idx} transform={`translate(${p.x}, ${p.y})`}>
                      <circle
                        cx={0}
                        cy={0}
                        r={6}
                        fill="#ffffff"
                        stroke="#2563eb"
                        strokeWidth={2}
                        style={{ cursor: 'crosshair' }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (e.button === 0) {
                            onWireHandleMouseDown?.(wire, idx, e);
                          }
                        }}
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={2.5}
                        fill="#2563eb"
                        style={{ pointerEvents: 'none' }}
                      />
                    </g>
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {/* Wire Drafting in progress */}
        {wireDraft && wireDraft.length > 0 && (
          <path
            d={wireDraft.reduce(
              (acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
              ''
            )}
            fill="none"
            stroke={draftColor || '#2563eb'}
            strokeWidth={2}
            strokeDasharray="4 4"
          />
        )}
      </g>

      {/* 3. Wire Junction Dots */}
      <WireJunctions wires={doc.wires} isRunning={simState.running} />

      {/* 4. Electrical Elements */}
      <g className="elements-layer">
        {doc.elements.map((elem) => (
          <ElementItem
            key={elem.id}
            elem={elem}
            simState={simState}
            isSelected={isItemSelected(elem.id)}
            onClick={(e) => onElementClick?.(elem, e)}
            onMouseDown={(e) => onElementMouseDown?.(elem, e)}
            onContextMenu={(e) => onElementContextMenu?.(elem, e)}
            onTerminalClick={(termId, pos) => onTerminalClick?.(elem, termId, pos)}
          />
        ))}
      </g>

      {/* 5. Marquee Selection Rectangle */}
      {selectionBox && (
        <g className="selection-marquee-layer">
          <rect
            x={Math.min(selectionBox.x1, selectionBox.x2)}
            y={Math.min(selectionBox.y1, selectionBox.y2)}
            width={Math.abs(selectionBox.x2 - selectionBox.x1)}
            height={Math.abs(selectionBox.y2 - selectionBox.y1)}
            fill="rgba(37, 99, 235, 0.12)"
            stroke="#2563eb"
            strokeWidth={1.2}
            strokeDasharray="4 3"
            pointerEvents="none"
          />
        </g>
      )}
    </g>
  );
};

/** Render Title Block / Cartiglio according to standard ISO 7200 / CEI IEC */
const SheetFrame: React.FC<{ sheet: Sheet; w: number; h: number }> = ({ sheet, w, h }) => {
  const margin = 20;
  const innerW = w - margin * 2;
  const innerH = h - margin * 2;
  const tbW = 420;
  const tbH = 82;
  const tbX = w - margin - tbW;
  const tbY = h - margin - tbH;

  return (
    <g className="sheet-frame">
      <defs>
        {/* CADe_SIMU style internal drawing grid with green dots */}
        <pattern
          id="sheetInnerGrid"
          width={10}
          height={10}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={10} cy={10} r={0.65} fill="#16a34a" opacity={0.35} />
        </pattern>
      </defs>

      {/* Sheet paper shadow & white border */}
      <rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill="#ffffff"
        stroke="#94a3b8"
        strokeWidth={1}
        filter="drop-shadow(0 4px 12px rgba(0,0,0,0.12))"
      />

      {/* Internal drawing area WITH the internal dotted grid */}
      <rect
        x={margin}
        y={margin}
        width={innerW}
        height={innerH}
        fill="url(#sheetInnerGrid)"
        stroke="#475569"
        strokeWidth={1.5}
      />

      {/* Standard Reference Grid markers along borders (A, B, C... 1, 2, 3...) */}
      <GridBorderMarkers margin={margin} innerW={innerW} innerH={innerH} />

      {/* Title block / Cartiglio */}
      <g className="title-block" transform={`translate(${tbX}, ${tbY})`}>
        {/* Clip path to ensure text never overflows the title box */}
        <defs>
          <clipPath id="titleClip">
            <rect x={6} y={24} width={tbW - 12} height={28} />
          </clipPath>
        </defs>

        <rect x={0} y={0} width={tbW} height={tbH} fill="#f8fafc" stroke="#475569" strokeWidth={1.2} />

        {/* Horizontal dividing lines */}
        <line x1={0} y1={24} x2={tbW} y2={24} stroke="#475569" strokeWidth={1} />
        <line x1={0} y1={52} x2={tbW} y2={52} stroke="#475569" strokeWidth={1} />

        {/* Row 1 vertical dividing lines */}
        <line x1={270} y1={0} x2={270} y2={24} stroke="#475569" strokeWidth={1} />
        <line x1={360} y1={0} x2={360} y2={24} stroke="#475569" strokeWidth={1} />

        {/* Row 3 vertical dividing lines */}
        <line x1={120} y1={52} x2={120} y2={tbH} stroke="#475569" strokeWidth={1} />
        <line x1={210} y1={52} x2={210} y2={tbH} stroke="#475569" strokeWidth={1} />
        <line x1={295} y1={52} x2={295} y2={tbH} stroke="#475569" strokeWidth={1} />

        {/* --- ROW 1: Project, Format, Sheet number --- */}
        <text x={8} y={10} fontSize={7.5} fill="#64748b" fontWeight="600">IMPIANTO / PROGETTO:</text>
        <text x={8} y={20} fontSize={10} fontWeight="bold" fill="#0f172a">
          {sheet.project || 'PROGETTO ELETTRICO'}
        </text>

        <text x={276} y={10} fontSize={7.5} fill="#64748b" fontWeight="600">FORMATO:</text>
        <text x={276} y={20} fontSize={9.5} fontWeight="bold" fill="#0f172a">
          {sheet.format} ({sheet.orientation === 'landscape' ? 'Orizz.' : 'Vert.'})
        </text>

        <text x={366} y={10} fontSize={7.5} fill="#64748b" fontWeight="600">FOGLIO:</text>
        <text x={366} y={20} fontSize={10} fontWeight="bold" fill="#0f172a">
          {sheet.sheetNo}
        </text>

        {/* --- ROW 2: DEDICATED FULL-WIDTH TITLE ROW --- */}
        <text x={8} y={33} fontSize={7.5} fill="#64748b" fontWeight="600">TITOLO DELLO SCHEMA:</text>
        <g clipPath="url(#titleClip)">
          <text x={8} y={47} fontSize={12} fontWeight="bold" fill="#1e293b">
            {sheet.title || 'SCHEMA FUNZIONALE'}
          </text>
        </g>

        {/* --- ROW 3: Author, Date, Revision, Standard --- */}
        <text x={8} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">DISEGNATORE:</text>
        <text x={8} y={75} fontSize={9} fontWeight="bold" fill="#0f172a">{sheet.author}</text>

        <text x={126} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">DATA:</text>
        <text x={126} y={75} fontSize={9} fontWeight="bold" fill="#0f172a">{sheet.date}</text>

        <text x={216} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">REVISIONE:</text>
        <text x={216} y={75} fontSize={9} fontWeight="bold" fill="#0f172a">{sheet.revision}</text>

        <text x={301} y={62} fontSize={7.5} fill="#64748b" fontWeight="600">STANDARD:</text>
        <text x={301} y={75} fontSize={8.5} fontWeight="bold" fill="#0f172a">CEI / IEC 60617</text>
      </g>
    </g>
  );
};

const GridBorderMarkers: React.FC<{ margin: number; innerW: number; innerH: number }> = ({
  margin,
  innerW,
  innerH,
}) => {
  const cols = 8;
  const rows = 6;
  const colW = innerW / cols;
  const rowH = innerH / rows;

  return (
    <g className="grid-markers" fontSize={9} fill="#94a3b8" textAnchor="middle">
      {Array.from({ length: cols }).map((_, i) => (
        <text key={`col-top-${i}`} x={margin + colW * (i + 0.5)} y={margin - 6}>
          {i + 1}
        </text>
      ))}
      {Array.from({ length: rows }).map((_, i) => (
        <text key={`row-left-${i}`} x={margin - 8} y={margin + rowH * (i + 0.5) + 3}>
          {String.fromCharCode(65 + i)}
        </text>
      ))}
    </g>
  );
};

/** Compute a generous bounding box for component hit-testing and selection halo */
export function getComponentBounds(def: ComponentDef) {
  let minX = -20;
  let maxX = 20;
  let minY = -20;
  let maxY = 20;

  for (const t of def.terminals) {
    minX = Math.min(minX, t.x - 10);
    maxX = Math.max(maxX, t.x + 10);
    minY = Math.min(minY, t.y - 10);
    maxY = Math.max(maxY, t.y + 10);
  }

  for (const s of def.symbol) {
    if (s.t === 'line') {
      minX = Math.min(minX, s.x1 - 6, s.x2 - 6);
      maxX = Math.max(maxX, s.x1 + 6, s.x2 + 6);
      minY = Math.min(minY, s.y1 - 6, s.y2 - 6);
      maxY = Math.max(maxY, s.y1 + 6, s.y2 + 6);
    } else if (s.t === 'rect') {
      minX = Math.min(minX, s.x - 6);
      maxX = Math.max(maxX, s.x + s.w + 6);
      minY = Math.min(minY, s.y - 6);
      maxY = Math.max(maxY, s.y + s.h + 6);
    } else if (s.t === 'circle' || s.t === 'rotor') {
      minX = Math.min(minX, s.cx - s.r - 6);
      maxX = Math.max(maxX, s.cx + s.r + 6);
      minY = Math.min(minY, s.cy - s.r - 6);
      maxY = Math.max(maxY, s.cy + s.r + 6);
    }
  }

  return {
    x: minX,
    y: minY,
    w: Math.max(30, maxX - minX),
    h: Math.max(30, maxY - minY),
  };
}

/** Element renderer */
const ElementItem: React.FC<{
  elem: Element;
  simState: SimState;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onTerminalClick: (termId: string, pos: { x: number; y: number }) => void;
}> = ({ elem, simState, isSelected, onClick, onMouseDown, onContextMenu, onTerminalClick }) => {
  const def = registry.get(elem.def);
  if (!def) return null;

  const bounds = getComponentBounds(def);

  // Determine active state for visual primitives
  const defaultState =
    def.behavior.type === 'contact' && def.behavior.actuation === 'latching'
      ? def.behavior.defaultOn ?? false
      : false;
  const isInteractivePressed = simState.elementStates[elem.id] ?? defaultState;
  const isOutputActive = simState.activeOutputs[elem.id] || simState.activeOutputs[elem.tag] || false;
  const isActive = isInteractivePressed || isOutputActive;

  // Color resolution for pilot lamp
  let customGlowColor: string | undefined;
  if ((elem.def === 'pilot_lamp' || elem.def === 'pilot_lamp_flashing') && elem.props?.color) {
    const cMap: Record<string, string> = {
      Verde: '#22c55e',
      Rosso: '#ef4444',
      Giallo: '#eab308',
      Blu: '#3b82f6',
      Bianco: '#f8fafc',
    };
    customGlowColor = cMap[String(elem.props.color)] || '#22c55e';
  }

  return (
    <g
      className={`element-item ${isSelected ? 'selected' : ''}`}
      transform={`translate(${elem.x}, ${elem.y}) rotate(${elem.rot})`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onContextMenu={onContextMenu}
      style={{ cursor: simState.running ? 'pointer' : 'move' }}
    >
      {/* Invisible broad hit-box so clicks anywhere on the component body register immediately */}
      <rect
        x={bounds.x}
        y={bounds.y}
        width={bounds.w}
        height={bounds.h}
        fill="transparent"
        pointerEvents="all"
      />

      {/* Selection halo */}
      {isSelected && (
        <rect
          x={bounds.x - 2}
          y={bounds.y - 2}
          width={bounds.w + 4}
          height={bounds.h + 4}
          fill="rgba(59, 130, 246, 0.08)"
          stroke="#3b82f6"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          rx={4}
          pointerEvents="none"
        />
      )}

      {/* Primitives */}
      {def.symbol.map((prim, idx) => (
        <PrimitiveItem
          key={idx}
          prim={prim}
          isActive={isActive}
          stepCount={simState.stepCount}
          isRunning={simState.running}
          customGlowColor={customGlowColor}
        />
      ))}

      {/* Tag Label - Offset cleanly to prevent collision with terminals or poles */}
      {elem.tag && (() => {
        const tagPos = getTagPosition(def);
        let tagColor = '#0f172a';
        if (def.id === 'pwr_l' || def.id === 'pwr_dc_plus') tagColor = '#ef4444';
        else if (def.id === 'pwr_n') tagColor = '#2563eb';
        else if (def.id === 'pwr_pe' || def.id === 'pwr_pe_line') tagColor = '#16a34a';

        return (
          <text
            x={tagPos.x}
            y={tagPos.y}
            fontSize={11}
            fontWeight="bold"
            fill={tagColor}
            textAnchor={tagPos.textAnchor}
            transform={`rotate(${-elem.rot})`}
          >
            {elem.tag}
          </text>
        );
      })()}

      {/* Terminals */}
      {def.terminals.map((term) => {
        const worldPos = localToWorld(elem.x, elem.y, term, elem.rot);
        return (
          <g
            key={term.id}
            transform={`translate(${term.x}, ${term.y})`}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              onTerminalClick(term.id, worldPos);
            }}
            className="terminal-group"
            style={{ cursor: 'crosshair' }}
          >
            {/* Terminal connection circle */}
            <circle
              cx={0}
              cy={0}
              r={3}
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={1.2}
              className="term-handle"
            />
            {/* Terminal Number (CADe_SIMU standard: on the right side of the terminal) */}
            {def.termLabels !== false && term.label && (
              <text
                x={5}
                y={term.y < 0 ? 4 : term.y > 0 ? -1 : 3}
                fontSize={8}
                fontWeight="500"
                fill="#475569"
                textAnchor="start"
                transform={`rotate(${-elem.rot})`}
              >
                {term.label}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
};

/** Compute non-overlapping tag position based on CADe_SIMU convention (tag on left, terminals on right) */
function getTagPosition(def: ComponentDef): { x: number; y: number; textAnchor: 'start' | 'middle' | 'end' } {
  if (def.id === 'pwr_3p_n_pe') {
    return { x: 0, y: -18, textAnchor: 'middle' };
  }
  if (
    def.id === 'pwr_l' ||
    def.id === 'pwr_n' ||
    def.id === 'pwr_pe_line' ||
    def.id === 'pwr_dc_plus' ||
    def.id === 'pwr_dc_minus'
  ) {
    return { x: -10, y: 4, textAnchor: 'end' };
  }
  if (def.id === 'pwr_pe') {
    return { x: -14, y: 4, textAnchor: 'end' };
  }
  if (def.id === 'pwr_dc_source') {
    return { x: 0, y: -20, textAnchor: 'middle' };
  }
  if (def.id === 'rectifier_bridge') {
    return { x: -14, y: -14, textAnchor: 'end' };
  }
  if (def.id === 'psu_1p_dc') {
    return { x: -20, y: 4, textAnchor: 'end' };
  }
  if (def.id === 'psu_3p_dc') {
    return { x: -28, y: 4, textAnchor: 'end' };
  }
  if (def.id.startsWith('motor_') || def.id === 'electric_brake') {
    // Left of the motor circle / brake body, clear of top/bottom terminals and right PE
    return { x: -28, y: 4, textAnchor: 'end' };
  }
  if (def.id === 'linear_actuator') {
    return { x: -42, y: 4, textAnchor: 'end' };
  }
  if (def.id === 'logic_input_var') {
    return { x: -16, y: 4, textAnchor: 'end' };
  }
  if (def.id === 'logic_output_var') {
    return { x: 16, y: 4, textAnchor: 'start' };
  }
  if (def.category === 'Logica') {
    if (def.id === 'display_bcd_7seg' || def.id === 'display_7seg' || def.id === 'bcd_thumbwheel') {
      return { x: 24, y: 24, textAnchor: 'start' };
    }
    const ys = def.terminals.map((t: { y: number }) => t.y);
    const minY = ys.length > 0 ? Math.min(...ys) : -16;
    return { x: 0, y: Math.min(minY - 12, -20), textAnchor: 'middle' };
  }

  if (!def.terminals || def.terminals.length === 0) {
    return { x: -22, y: -2, textAnchor: 'end' };
  }

  if (
    def.category === 'Azionamenti' ||
    def.category === 'Detectors' ||
    def.id.startsWith('switch_manual_')
  ) {
    const xs = def.terminals.map((t: { x: number }) => t.x);
    const minX = Math.min(...xs);
    return { x: minX - 25, y: 0, textAnchor: 'end' };
  }

  if (def.category === 'Potenza') {
    const xs = def.terminals.map((t: { x: number }) => t.x);
    const minX = Math.min(...xs);
    return { x: minX - 14, y: -10, textAnchor: 'end' };
  }

  if (def.id.startsWith('contact_timer_') && def.terminals.length > 2) {
    const xs = def.terminals.map((t: { x: number }) => t.x);
    const minX = Math.min(...xs);
    return { x: minX - 18, y: -2, textAnchor: 'end' };
  }

  const xs = def.terminals.map((t: { x: number }) => t.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  if (maxX - minX >= 15 || (def.terminals.length > 2 && minX < 0)) {
    // Multi-pole: tag placed on the left side of pole 1
    return { x: minX - 12, y: -2, textAnchor: 'end' };
  }

  // 2-pole vertical components (coils, lamps, push buttons, fuses, contacts)
  // CADe_SIMU standard: Tag on LEFT (-18), Terminal labels on RIGHT (+6)
  return { x: -18, y: -2, textAnchor: 'end' };
}

/** Render single primitive */
const PrimitiveItem: React.FC<{
  prim: Prim;
  isActive: boolean;
  stepCount: number;
  isRunning: boolean;
  customGlowColor?: string;
}> = ({ prim, isActive, stepCount, isRunning, customGlowColor }) => {
  if (prim.when === 'on' && !isActive) return null;
  if (prim.when === 'off' && isActive) return null;

  const stroke = prim.stroke || '#0f172a';
  const strokeWidth = prim.t === 'line' ? (prim.w || 1.5) : 1.5;
  const strokeDasharray = prim.dash ? '3 3' : undefined;
  const primFill = 'fill' in prim && prim.fill ? prim.fill : 'none';
  const fill = (prim.when === 'on' && customGlowColor && prim.t === 'circle') ? customGlowColor : primFill;

  switch (prim.t) {
    case 'line':
      return (
        <line
          x1={prim.x1}
          y1={prim.y1}
          x2={prim.x2}
          y2={prim.y2}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          transform={prim.transform}
        />
      );
    case 'rect':
      return (
        <rect
          x={prim.x}
          y={prim.y}
          width={prim.w}
          height={prim.h}
          fill={prim.fill || 'none'}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          rx={prim.r || 0}
          transform={prim.transform}
        />
      );
    case 'circle': {
      const isLitGlow = prim.when === 'on' && customGlowColor;
      return (
        <circle
          cx={prim.cx}
          cy={prim.cy}
          r={prim.r}
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          filter={isLitGlow ? `drop-shadow(0 0 8px ${customGlowColor})` : undefined}
          transform={prim.transform}
        />
      );
    }
    case 'path':
      return (
        <path
          d={prim.d}
          fill={prim.fill || 'none'}
          stroke={stroke}
          strokeWidth={strokeWidth}
          transform={prim.transform}
        />
      );
    case 'text':
      return (
        <text
          x={prim.x}
          y={prim.y}
          fontSize={prim.size || 10}
          fill={prim.fill || '#0f172a'}
          textAnchor={prim.anchor || 'start'}
          fontWeight="bold"
        >
          {prim.text}
        </text>
      );
    case 'rotor': {
      // Rotating motor indicator animation when active
      const angle = isRunning && isActive ? (stepCount * 36) % 360 : 0;
      return (
        <g transform={`rotate(${angle}, ${prim.cx}, ${prim.cy})`}>
          <line
            x1={prim.cx - prim.r + 2}
            y1={prim.cy}
            x2={prim.cx + prim.r - 2}
            y2={prim.cy}
            stroke="#10b981"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <line
            x1={prim.cx}
            y1={prim.cy - prim.r + 2}
            x2={prim.cx}
            y2={prim.cy + prim.r - 2}
            stroke="#10b981"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </g>
      );
    }
    default:
      return null;
  }
};

/** Compute wire junction nodes (points where 3+ wire segments meet) */
const WireJunctions: React.FC<{ wires: Wire[]; isRunning: boolean }> = ({ wires }) => {
  const countMap = new Map<string, { pt: { x: number; y: number }; count: number }>();

  for (const wire of wires) {
    for (const p of wire.pts) {
      const key = `${p.x},${p.y}`;
      const entry = countMap.get(key) || { pt: p, count: 0 };
      entry.count++;
      countMap.set(key, entry);
    }
  }

  const junctions = Array.from(countMap.values()).filter((v) => v.count >= 3);

  return (
    <g className="junctions-layer">
      {junctions.map((j, idx) => (
        <circle key={idx} cx={j.pt.x} cy={j.pt.y} r={3.5} fill="#0f172a" />
      ))}
    </g>
  );
};
