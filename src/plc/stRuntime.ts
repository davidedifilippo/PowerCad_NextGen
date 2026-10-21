/**
 * IEC 61131-3 Structured Text (ST) Runtime & Parser for Web CAD / Micro-PLC
 * Supports:
 * - Assignments (var := expr;)
 * - Logical: AND, OR, NOT, XOR
 * - Comparison: =, <>, <, <=, >, >=
 * - Arithmetic: +, -, *, /, MOD
 * - Conditional: IF .. THEN .. ELSIF .. ELSE .. END_IF;
 * - Standard IEC Timers & Triggers: TON, TOF, TP, R_TRIG, F_TRIG, CTU, CTD, SR, RS
 * - Watchdog execution limiter (prevents browser lockup on infinite loops)
 * - Live Watch Table variable inspection
 */

export interface PlcTimerState {
  pt: number; // Preset time in seconds
  et: number; // Elapsed time in seconds
  q: boolean; // Output
  running: boolean;
  prevIn: boolean;
}

export interface PlcTriggerState {
  prevClk: boolean;
  q: boolean;
}

export interface PlcCounterState {
  cv: number; // Current value
  pv: number; // Preset value
  q: boolean;
  prevCu: boolean;
  prevCd: boolean;
}

export interface PlcMemory {
  vars: Record<string, boolean | number | string>;
  timers: Record<string, PlcTimerState>;
  triggers: Record<string, PlcTriggerState>;
  counters: Record<string, PlcCounterState>;
  error?: string | null;
  stepCount: number;
}

export function createInitialPlcMemory(): PlcMemory {
  return {
    vars: {
      I1: false, I2: false, I3: false, I4: false,
      I5: false, I6: false, I7: false, I8: false,
      AI1: 0, AI2: 0, AI3: 0, AI4: 0,
      AI5: 0, AI6: 0, AI7: 0, AI8: 0,
      Q1: false, Q2: false, Q3: false, Q4: false,
      O1: false, O2: false, O3: false, O4: false,
    },
    timers: {},
    triggers: {},
    counters: {},
    error: null,
    stepCount: 0,
  };
}

/**
 * Parses time literals such as T#2s, T#500ms, T#1.5s, 2s into seconds.
 */
export function parseTimeLiteral(val: string): number {
  const clean = val.toUpperCase().replace(/^T#/, '');
  if (clean.endsWith('MS')) {
    return parseFloat(clean.replace('MS', '')) / 1000;
  }
  if (clean.endsWith('S')) {
    return parseFloat(clean.replace('S', ''));
  }
  if (clean.endsWith('M')) {
    return parseFloat(clean.replace('M', '')) * 60;
  }
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Strips comments from Structured Text code:
 * - Multi-line (* ... *)
 * - Single-line // ...
 */
export function stripComments(code: string): string {
  let res = code.replace(/\(\*[\s\S]*?\*\)/g, ' ');
  res = res.replace(/\/\/.*$/gm, ' ');
  return res;
}

/**
 * Executes one scan cycle of the ST code.
 * @param code Structured Text code
 * @param inputs Current physical input readings (I1..I8, AI1..AI8)
 * @param memory Persistent PLC memory across steps
 * @param dtSec Time delta of this scan step in seconds (e.g. 0.05 s)
 */
export function runPlcScanCycle(
  code: string,
  inputs: Record<string, boolean | number>,
  memory: PlcMemory,
  dtSec: number = 0.05
): {
  outputs: Record<string, boolean>;
  memory: PlcMemory;
  error?: string | null;
} {
  const mem: PlcMemory = {
    vars: { ...memory.vars, ...inputs },
    timers: { ...memory.timers },
    triggers: { ...memory.triggers },
    counters: { ...memory.counters },
    error: null,
    stepCount: memory.stepCount + 1,
  };

  const cleanCode = stripComments(code).trim();
  if (!cleanCode) {
    return {
      outputs: {
        Q1: Boolean(mem.vars.Q1),
        Q2: Boolean(mem.vars.Q2),
        Q3: Boolean(mem.vars.Q3),
        Q4: Boolean(mem.vars.Q4),
      },
      memory: mem,
    };
  }

  // Tokenize and execute
  try {
    const interpreter = new StInterpreter(cleanCode, mem, dtSec);
    interpreter.run();
  } catch (err: any) {
    mem.error = err.message || 'Errore di esecuzione Structured Text';
  }

  // Sync alias O1..O4 with Q1..Q4
  if (mem.vars.O1 !== undefined) mem.vars.Q1 = mem.vars.Q1 || mem.vars.O1;
  if (mem.vars.O2 !== undefined) mem.vars.Q2 = mem.vars.Q2 || mem.vars.O2;
  if (mem.vars.O3 !== undefined) mem.vars.Q3 = mem.vars.Q3 || mem.vars.O3;
  if (mem.vars.O4 !== undefined) mem.vars.Q4 = mem.vars.Q4 || mem.vars.O4;

  const outputs: Record<string, boolean> = {
    Q1: Boolean(mem.vars.Q1),
    Q2: Boolean(mem.vars.Q2),
    Q3: Boolean(mem.vars.Q3),
    Q4: Boolean(mem.vars.Q4),
  };

  return {
    outputs,
    memory: mem,
    error: mem.error,
  };
}

/**
 * Validates Structured Text code syntax and execution validity
 */
export function validateSTCode(code: string): { valid: boolean; error?: string } {
  const cleanCode = stripComments(code).trim();
  if (!cleanCode) return { valid: true };
  const dummyMem = createInitialPlcMemory();
  const res = runPlcScanCycle(
    cleanCode,
    { I1: false, I2: false, I3: false, I4: false, I5: false, I6: false, I7: 0, I8: 0 },
    dummyMem,
    0.05
  );
  if (res.error) {
    return { valid: false, error: res.error };
  }
  return { valid: true };
}

class StInterpreter {
  private tokens: string[];
  private pos: number = 0;
  private mem: PlcMemory;
  private dtSec: number;
  private opCount: number = 0;
  private readonly MAX_OPS = 15000; // Watchdog instruction limit per cycle

  constructor(code: string, mem: PlcMemory, dtSec: number) {
    this.mem = mem;
    this.dtSec = dtSec;
    this.tokens = this.tokenize(code);
  }

  private tokenize(code: string): string[] {
    const regex = /T#[0-9]+(\.[0-9]+)?(ms|s|m)|:=|<=|>=|<>|\bAND\b|\bOR\b|\bNOT\b|\bXOR\b|\bMOD\b|\bIF\b|\bTHEN\b|\bELSIF\b|\bELSE\b|\bEND_IF\b|\bCASE\b|\bOF\b|\bEND_CASE\b|\bVAR\b|\bEND_VAR\b|[a-zA-Z_][a-zA-Z0-9_\.]*|[0-9]+(\.[0-9]+)?|[();,=:<>+\-*/]/gi;
    return code.match(regex) || [];
  }

  public run() {
    while (this.pos < this.tokens.length) {
      this.checkWatchdog();
      const token = this.peek();
      if (!token || token === ';') {
        this.next();
        continue;
      }
      this.parseStatement();
    }
  }

  private checkWatchdog() {
    this.opCount++;
    if (this.opCount > this.MAX_OPS) {
      throw new Error('Watchdog timeout: superato limite istruzioni per ciclo (possibile loop infinito).');
    }
  }

  private peek(): string {
    return this.tokens[this.pos] || '';
  }

  private next(): string {
    return this.tokens[this.pos++] || '';
  }

  private parseStatement() {
    const t = this.peek().toUpperCase();

    if (t === 'VAR' || t === 'VAR_INPUT' || t === 'VAR_OUTPUT') {
      this.skipVarBlock();
      return;
    }

    if (t === 'IF') {
      this.parseIf();
      return;
    }

    if (t === 'CASE') {
      this.parseCase();
      return;
    }

    // Function block calls like TON_1(IN := I1, PT := T#2s);
    if (this.pos + 1 < this.tokens.length && this.tokens[this.pos + 1] === '(') {
      const fbName = this.next();
      this.parseFbCall(fbName);
      if (this.peek() === ';') this.next();
      return;
    }

    // Variable assignment: VarName := Expr;
    const varName = this.next();
    if (this.peek() === ':=') {
      this.next(); // consume ':='
      const val = this.parseExpression();
      this.setVar(varName, val);
      if (this.peek() === ';') this.next();
      return;
    }

    // Advance if unknown token
    this.next();
  }

  private skipVarBlock() {
    this.next(); // consume VAR
    while (this.pos < this.tokens.length) {
      this.checkWatchdog();
      if (this.peek().toUpperCase() === 'END_VAR') {
        this.next();
        if (this.peek() === ';') this.next();
        break;
      }
      this.next();
    }
  }

  private parseIf() {
    this.next(); // consume IF
    const cond = Boolean(this.parseExpression());
    if (this.peek().toUpperCase() === 'THEN') this.next();

    let executed = false;
    if (cond) {
      executed = true;
      this.executeBlock(['ELSIF', 'ELSE', 'END_IF']);
    } else {
      this.skipBlock(['ELSIF', 'ELSE', 'END_IF']);
    }

    // Handle ELSIF branches
    while (this.peek().toUpperCase() === 'ELSIF') {
      this.next(); // consume ELSIF
      const elsifCond = Boolean(this.parseExpression());
      if (this.peek().toUpperCase() === 'THEN') this.next();

      if (!executed && elsifCond) {
        executed = true;
        this.executeBlock(['ELSIF', 'ELSE', 'END_IF']);
      } else {
        this.skipBlock(['ELSIF', 'ELSE', 'END_IF']);
      }
    }

    // Handle ELSE branch
    if (this.peek().toUpperCase() === 'ELSE') {
      this.next(); // consume ELSE
      if (!executed) {
        executed = true;
        this.executeBlock(['END_IF']);
      } else {
        this.skipBlock(['END_IF']);
      }
    }

    if (this.peek().toUpperCase() === 'END_IF') {
      this.next();
      if (this.peek() === ';') this.next();
    }
  }

  private parseCase() {
    this.next(); // consume CASE
    const caseVal = this.parseExpression();
    if (this.peek().toUpperCase() === 'OF') this.next();

    let matched = false;

    while (this.pos < this.tokens.length && this.peek().toUpperCase() !== 'END_CASE') {
      this.checkWatchdog();
      const tok = this.peek().toUpperCase();
      if (tok === 'ELSE') {
        this.next();
        if (!matched) {
          matched = true;
          this.executeBlock(['END_CASE']);
        } else {
          this.skipBlock(['END_CASE']);
        }
        break;
      }

      // Branch label(s): e.g. 1: or 1, 2:
      const labels: any[] = [];
      while (this.pos < this.tokens.length && this.peek() !== ':') {
        if (this.peek() !== ',') labels.push(this.parsePrimary());
        else this.next();
      }
      if (this.peek() === ':') this.next(); // consume ':'

      const isMatch = labels.some((lbl) => lbl == caseVal);
      if (isMatch && !matched) {
        matched = true;
        this.executeBlock(['END_CASE', 'ELSE']);
      } else {
        this.skipBlock(['END_CASE', 'ELSE']);
      }
    }

    if (this.peek().toUpperCase() === 'END_CASE') {
      this.next();
      if (this.peek() === ';') this.next();
    }
  }

  private executeBlock(terminators: string[]) {
    while (this.pos < this.tokens.length) {
      this.checkWatchdog();
      const t = this.peek().toUpperCase();
      if (terminators.includes(t)) break;
      this.parseStatement();
    }
  }

  private skipBlock(terminators: string[]) {
    let depth = 0;
    while (this.pos < this.tokens.length) {
      this.checkWatchdog();
      const t = this.peek().toUpperCase();
      if (t === 'IF' || t === 'CASE') depth++;
      if (t === 'END_IF' || t === 'END_CASE') {
        if (depth > 0) depth--;
      }
      if (depth === 0 && terminators.includes(t)) break;
      this.next();
    }
  }

  /**
   * Evaluates standard IEC Function Blocks (TON, TOF, TP, R_TRIG, F_TRIG, CTU, CTD, SR, RS)
   */
  private parseFbCall(fbName: string) {
    this.next(); // consume '('
    const args: Record<string, any> = {};

    while (this.pos < this.tokens.length && this.peek() !== ')') {
      this.checkWatchdog();
      if (this.peek() === ',') {
        this.next();
        continue;
      }
      const paramName = this.next().toUpperCase();
      let assignToken = this.peek();
      if (assignToken === ':=' || assignToken === '=>' || assignToken === '=') {
        this.next();
      }
      const val = this.parseExpression();
      args[paramName] = val;
    }
    if (this.peek() === ')') this.next();

    const upperFb = fbName.toUpperCase();

    // 1. TON (Timer On Delay)
    if (upperFb.startsWith('TON') || upperFb.includes('TON')) {
      const state = this.mem.timers[fbName] || { pt: 0, et: 0, q: false, running: false, prevIn: false };
      const inVal = Boolean(args['IN'] ?? false);
      const ptVal = args['PT'] !== undefined ? (typeof args['PT'] === 'string' ? parseTimeLiteral(args['PT']) : Number(args['PT'])) : state.pt;
      state.pt = ptVal;

      if (inVal) {
        if (!state.q) {
          state.et = Math.min(state.pt, state.et + this.dtSec);
          if (state.et >= state.pt) state.q = true;
        }
      } else {
        state.et = 0;
        state.q = false;
      }
      state.prevIn = inVal;
      this.mem.timers[fbName] = state;
      this.setVar(`${fbName}.Q`, state.q);
      this.setVar(`${fbName}.ET`, state.et);
      return;
    }

    // 2. TOF (Timer Off Delay)
    if (upperFb.startsWith('TOF') || upperFb.includes('TOF')) {
      const state = this.mem.timers[fbName] || { pt: 0, et: 0, q: false, running: false, prevIn: false };
      const inVal = Boolean(args['IN'] ?? false);
      const ptVal = args['PT'] !== undefined ? (typeof args['PT'] === 'string' ? parseTimeLiteral(args['PT']) : Number(args['PT'])) : state.pt;
      state.pt = ptVal;

      if (inVal) {
        state.q = true;
        state.et = 0;
      } else {
        if (state.q) {
          state.et = Math.min(state.pt, state.et + this.dtSec);
          if (state.et >= state.pt) state.q = false;
        }
      }
      state.prevIn = inVal;
      this.mem.timers[fbName] = state;
      this.setVar(`${fbName}.Q`, state.q);
      this.setVar(`${fbName}.ET`, state.et);
      return;
    }

    // 3. TP (Timer Pulse)
    if (upperFb.startsWith('TP') || upperFb.includes('TP')) {
      const state = this.mem.timers[fbName] || { pt: 0, et: 0, q: false, running: false, prevIn: false };
      const inVal = Boolean(args['IN'] ?? false);
      const ptVal = args['PT'] !== undefined ? (typeof args['PT'] === 'string' ? parseTimeLiteral(args['PT']) : Number(args['PT'])) : state.pt;
      state.pt = ptVal;

      if (inVal && !state.prevIn && !state.running) {
        state.running = true;
        state.q = true;
        state.et = 0;
      }
      if (state.running) {
        state.et = Math.min(state.pt, state.et + this.dtSec);
        if (state.et >= state.pt) {
          state.running = false;
          state.q = false;
        }
      }
      state.prevIn = inVal;
      this.mem.timers[fbName] = state;
      this.setVar(`${fbName}.Q`, state.q);
      this.setVar(`${fbName}.ET`, state.et);
      return;
    }

    // 4. R_TRIG (Rising Edge Detection)
    if (upperFb.startsWith('R_TRIG') || upperFb.includes('R_TRIG')) {
      const state = this.mem.triggers[fbName] || { prevClk: false, q: false };
      const clk = Boolean(args['CLK'] ?? false);
      state.q = clk && !state.prevClk;
      state.prevClk = clk;
      this.mem.triggers[fbName] = state;
      this.setVar(`${fbName}.Q`, state.q);
      return;
    }

    // 5. F_TRIG (Falling Edge Detection)
    if (upperFb.startsWith('F_TRIG') || upperFb.includes('F_TRIG')) {
      const state = this.mem.triggers[fbName] || { prevClk: false, q: false };
      const clk = Boolean(args['CLK'] ?? false);
      state.q = !clk && state.prevClk;
      state.prevClk = clk;
      this.mem.triggers[fbName] = state;
      this.setVar(`${fbName}.Q`, state.q);
      return;
    }

    // 6. SR / RS Bistable
    if (upperFb.startsWith('SR') || upperFb.includes('SR')) {
      const s1 = Boolean(args['S1'] ?? false);
      const r = Boolean(args['R'] ?? false);
      const cur = Boolean(this.getVar(fbName) ?? false);
      const q = s1 || (cur && !r);
      this.setVar(fbName, q);
      this.setVar(`${fbName}.Q1`, q);
      return;
    }
  }

  // --- Recursive Expression Evaluator ---
  private parseExpression(): any {
    return this.parseOr();
  }

  private parseOr(): any {
    let left = this.parseXor();
    while (this.peek().toUpperCase() === 'OR') {
      this.next();
      const right = this.parseXor();
      left = Boolean(left) || Boolean(right);
    }
    return left;
  }

  private parseXor(): any {
    let left = this.parseAnd();
    while (this.peek().toUpperCase() === 'XOR') {
      this.next();
      const right = this.parseAnd();
      left = Boolean(left) !== Boolean(right);
    }
    return left;
  }

  private parseAnd(): any {
    let left = this.parseComparison();
    while (this.peek().toUpperCase() === 'AND' || this.peek() === '&') {
      this.next();
      const right = this.parseComparison();
      left = Boolean(left) && Boolean(right);
    }
    return left;
  }

  private parseComparison(): any {
    let left = this.parseAddSub();
    const op = this.peek();
    if (['=', '<>', '<', '<=', '>', '>='].includes(op)) {
      this.next();
      const right = this.parseAddSub();
      switch (op) {
        case '=': return left == right;
        case '<>': return left != right;
        case '<': return left < right;
        case '<=': return left <= right;
        case '>': return left > right;
        case '>=': return left >= right;
      }
    }
    return left;
  }

  private parseAddSub(): any {
    let left = this.parseMulDiv();
    while (this.peek() === '+' || this.peek() === '-') {
      const op = this.next();
      const right = this.parseMulDiv();
      if (op === '+') left = Number(left) + Number(right);
      else left = Number(left) - Number(right);
    }
    return left;
  }

  private parseMulDiv(): any {
    let left = this.parseUnary();
    while (this.peek() === '*' || this.peek() === '/' || this.peek().toUpperCase() === 'MOD') {
      const op = this.next().toUpperCase();
      const right = this.parseUnary();
      if (op === '*') left = Number(left) * Number(right);
      else if (op === '/') left = Number(right) === 0 ? 0 : Number(left) / Number(right);
      else if (op === 'MOD') left = Number(right) === 0 ? 0 : Number(left) % Number(right);
    }
    return left;
  }

  private parseUnary(): any {
    if (this.peek().toUpperCase() === 'NOT') {
      this.next();
      return !Boolean(this.parseUnary());
    }
    if (this.peek() === '-') {
      this.next();
      return -Number(this.parseUnary());
    }
    if (this.peek() === '+') {
      this.next();
      return Number(this.parseUnary());
    }
    return this.parsePrimary();
  }

  private parsePrimary(): any {
    const t = this.peek();

    if (t === '(') {
      this.next();
      const res = this.parseExpression();
      if (this.peek() === ')') this.next();
      return res;
    }

    if (t.toUpperCase() === 'TRUE') {
      this.next();
      return true;
    }
    if (t.toUpperCase() === 'FALSE') {
      this.next();
      return false;
    }

    // Time literal (T#2s, T#500ms)
    if (t.toUpperCase().startsWith('T#')) {
      this.next();
      return parseTimeLiteral(t);
    }

    // Number
    if (/^[0-9]+(\.[0-9]+)?$/.test(t)) {
      this.next();
      return parseFloat(t);
    }

    // Identifier / Variable
    if (/^[a-zA-Z_][a-zA-Z0-9_\.]*$/.test(t)) {
      this.next();
      return this.getVar(t);
    }

    this.next();
    return null;
  }

  private getVar(name: string): any {
    const upper = name.toUpperCase();
    for (const [k, v] of Object.entries(this.mem.vars)) {
      if (k.toUpperCase() === upper) return v;
    }
    return false;
  }

  private setVar(name: string, val: any) {
    const upper = name.toUpperCase();
    let foundKey = name;
    for (const k of Object.keys(this.mem.vars)) {
      if (k.toUpperCase() === upper) {
        foundKey = k;
        break;
      }
    }
    this.mem.vars[foundKey] = val;
  }
}
