// Core data model. Everything here is plain JSON-serializable.

export interface Pt { x: number; y: number }
export interface Rect { x: number; y: number; w: number; h: number }

/** Visibility condition for a primitive: drawn only when the element is active / inactive. */
export type When = 'on' | 'off';

interface PrimBase { when?: When; stroke?: string; dash?: boolean; w?: number; transform?: string }
export type Prim =
  | (PrimBase & { t: 'line'; x1: number; y1: number; x2: number; y2: number })
  | (PrimBase & { t: 'rect'; x: number; y: number; w: number; h: number; fill?: string; r?: number })
  | (PrimBase & { t: 'circle'; cx: number; cy: number; r: number; fill?: string })
  | (PrimBase & { t: 'path'; d: string; fill?: string })
  | (PrimBase & { t: 'text'; x: number; y: number; text: string; size?: number | string; anchor?: 'start' | 'middle' | 'end'; fill?: string })
  /** Rotating rotor indicator, drawn only while a motor runs. */
  | (PrimBase & { t: 'rotor'; cx: number; cy: number; r: number });

export interface TerminalDef { id: string; x: number; y: number; label?: string }

export type PropOption = string | { value: string; label: string };
export interface PropDef {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select';
  options?: PropOption[];
  default: string | number;
}

export type CoilMode = 'mono' | 'ton' | 'tof' | 'blink' | 'latch';

export type Behavior =
  /** Fixed potentials on terminals. Value "$prop" reads the potential from an element property. */
  | { type: 'source'; potentials: Record<string, string> }
  /** Always-conducting pairs (fuses, terminal blocks). */
  | { type: 'conductor'; pairs: [string, string][] }
  /**
   * Contacts. actuation:
   *  - linked: driven by the device with the same tag (coil, timer, thermal relay, breaker, button)
   *  - momentary / latching: operated by the user during simulation
   */
  | { type: 'contact'; actuation: 'linked' | 'momentary' | 'latching'; no?: [string, string][]; nc?: [string, string][]; defaultOn?: boolean }
  | { type: 'coil'; a: string; b: string; mode: CoilMode }
  | { type: 'load'; kind: 'lamp' | 'buzzer' | 'motor1' | 'motordc'; a: string; b: string }
  | { type: 'motor3'; u: string; v: string; w: string }
  | { type: 'motor3yd'; u1: string; v1: string; w1: string; u2: string; v2: string; w2: string }
  /** Thermal overload relay: power poles always conduct; user can trip it, tag drives its aux contacts. */
  | { type: 'thermal'; pairs: [string, string][] }
  | { type: 'none' };

export interface ComponentDef {
  id: string;
  name: string;
  category: string;
  description?: string;
  /** Default tag prefix, e.g. "-KM". Omit for components without a tag (notes). */
  tagPrefix?: string;
  /** Show terminal numbers next to terminals (default true). */
  termLabels?: boolean;
  terminals: TerminalDef[];
  symbol: Prim[];
  behavior: Behavior;
  props?: PropDef[];
  /** Local bounds; computed automatically when omitted. */
  bounds?: Rect;
}

export interface Library { name: string; version?: number; components: ComponentDef[] }

export type Rotation = 0 | 90 | 180 | 270;

export interface Element {
  id: string;
  def: string;
  x: number;
  y: number;
  rot: Rotation;
  tag: string;
  props: Record<string, string | number>;
}

export type WireKind =
  | 'phase'
  | 'neutral'
  | 'pe'
  | 'pos'
  | 'neg'
  | 'aux'
  | '3p_vert'
  | '3p_horiz';

export interface Wire {
  id: string;
  pts: Pt[];
  kind?: WireKind;
  color?: string;
}

export type SheetFormat = 'A4' | 'A3' | 'A2' | 'A1';
export interface Sheet {
  format: SheetFormat;
  orientation: 'landscape' | 'portrait';
  project: string;
  title: string;
  author: string;
  date: string;
  revision: string;
  sheetNo: string;
}

export interface Doc {
  app: 'electroforge' | 'cadesimu-next';
  version: 1;
  sheet: Sheet;
  elements: Element[];
  wires: Wire[];
}
