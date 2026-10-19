import { Doc, Element, Wire, WireKind, Sheet } from '../model/types';

/**
 * Mapping of CADe_SIMU component type codes to PowerCad_NextGen standard library component IDs.
 * Also defines coordinate offsets (in canvas pixels) to correctly align component terminals
 * with CADe_SIMU wire connection points (which are defined relative to top terminal).
 */
export interface CadeCompMapping {
  def: string;
  xOffset?: number;
  yOffset?: number;
}

export const CADESIMU_TYPE_MAP: Record<number, CadeCompMapping> = {
  // Resistori e Carichi (Resistors & Loads)
  1050: { def: 'resistor_1p', yOffset: 20 },
  1051: { def: 'resistor_3p', yOffset: 20, xOffset: 20 },

  // Alimentazione (Power sources)
  3000: { def: 'pwr_l', yOffset: -10 },
  3001: { def: 'pwr_n', yOffset: -10 },
  3002: { def: 'pwr_pe', yOffset: 10 },
  3003: { def: 'pwr_l_n', yOffset: -10, xOffset: 10 },
  3004: { def: 'pwr_3p', yOffset: -10, xOffset: 20 },
  3005: { def: 'pwr_3p_pe', yOffset: -10, xOffset: 30 },
  3006: { def: 'pwr_3p_n', yOffset: -10, xOffset: 30 },
  3007: { def: 'pwr_3p_n_pe', yOffset: -10, xOffset: 40 },
  3010: { def: 'pwr_l_n', yOffset: -10, xOffset: 10 },
  3011: { def: 'pwr_l_n_pe', yOffset: -10, xOffset: 20 },

  // Fusibili (Fuses 5000-5008)
  5000: { def: 'fuse_1p', yOffset: 20 },
  5001: { def: 'fuse_1p_n', yOffset: 20, xOffset: 10 },
  5002: { def: 'fuse_disconnector_2p', yOffset: 20, xOffset: 10 },
  5003: { def: 'fuse_3p', yOffset: 20, xOffset: 20 },
  5004: { def: 'fuse_3p_n', yOffset: 20, xOffset: 30 },
  5005: { def: 'fuse_1p', yOffset: 20 },
  5006: { def: 'fuse_1p_n', yOffset: 20, xOffset: 10 },
  5007: { def: 'fuse_1p_n', yOffset: 20, xOffset: 10 },
  5008: { def: 'fuse_3p', yOffset: 20, xOffset: 20 },

  // Protezioni e Sezionatori (Protections & Disconnectors)
  6000: { def: 'fuse_1p', yOffset: 20 },
  6001: { def: 'fuse_1p_n', yOffset: 20, xOffset: 10 },
  6002: { def: 'fuse_3p', yOffset: 20, xOffset: 20 },
  6003: { def: 'fuse_3p_n', yOffset: 20, xOffset: 30 },
  6004: { def: 'rcd_differential_1p_n', yOffset: 30, xOffset: 10 },
  6005: { def: 'rcd_differential_1p_n', yOffset: 30, xOffset: 10 },
  6006: { def: 'rcd_differential_3p_n', yOffset: 30, xOffset: 30 },
  6007: { def: 'thermal_relay_power', yOffset: 20, xOffset: 20 },
  6008: { def: 'mcb_magnetothermal_1p', yOffset: 30 },
  6009: { def: 'mcb_magnetothermal_2p', yOffset: 30, xOffset: 10 },
  6010: { def: 'mcb_magnetothermal_3p', yOffset: 30, xOffset: 20 },
  6011: { def: 'mcb_magnetothermal_3p_n', yOffset: 30, xOffset: 30 },
  6012: { def: 'disconnector_3p', yOffset: 20, xOffset: 20 },

  // Interruttori Sezionatori e Contattori (Switches & Contactors)
  2000: { def: 'contactor_power_1p', yOffset: 20 },
  2001: { def: 'contactor_power_3p', yOffset: 20, xOffset: 20 },
  2002: { def: 'contactor_power_4p', yOffset: 20, xOffset: 30 },
  2003: { def: 'switch_disconnector_2p', yOffset: 20, xOffset: 10 },
  2004: { def: 'switch_disconnector_3p', yOffset: 20, xOffset: 20 },
  2005: { def: 'switch_disconnector_3p_n', yOffset: 20, xOffset: 30 },

  // Motori (Motors)
  1000: { def: 'motor_3p_async', yOffset: 30, xOffset: 20 },
  1001: { def: 'motor_3p_dahlander', yOffset: 30, xOffset: 20 },
  1002: { def: 'motor_3p_yd', yOffset: 30, xOffset: 20 },
  1004: { def: 'motor_1p', yOffset: 30 },
  1005: { def: 'motor_dc_pm', yOffset: 30 },

  // Contatti ausiliari (Auxiliary contacts)
  7000: { def: 'contact_no', yOffset: 20 },
  7001: { def: 'contact_nc', yOffset: 20 },
  7002: { def: 'contact_aux_no_nc', yOffset: 20 },
  7004: { def: 'contact_timer_on_no', yOffset: 20 },
  7005: { def: 'contact_timer_on_nc', yOffset: 20 },
  7006: { def: 'contact_timer_on_no_nc', yOffset: 20 },
  7008: { def: 'contact_timer_off_no', yOffset: 20 },
  7009: { def: 'contact_timer_off_nc', yOffset: 20 },
  7010: { def: 'contact_timer_off_no_nc', yOffset: 20 },

  // Pulsanti e Selettori (Buttons & Switches)
  8000: { def: 'btn_no', yOffset: 20 },
  8001: { def: 'btn_nc', yOffset: 20 },
  8002: { def: 'btn_no_nc', yOffset: 20 },
  8004: { def: 'btn_mushroom_no', yOffset: 20 },
  8005: { def: 'btn_emergency', yOffset: 20 },
  8006: { def: 'btn_mushroom_no_nc', yOffset: 20 },
  8008: { def: 'switch_no', yOffset: 20 },
  8009: { def: 'switch_nc', yOffset: 20 },
  8010: { def: 'switch_no_nc', yOffset: 20 },
  8014: { def: 'limit_switch_no', yOffset: 20 },
  8015: { def: 'limit_switch_nc', yOffset: 20 },
  8016: { def: 'limit_switch_no_nc', yOffset: 20 },
  8017: { def: 'thermal_contact_nc', yOffset: 20 },
  8018: { def: 'thermal_contact_no', yOffset: 20 },
  8019: { def: 'thermal_contact_no_nc', yOffset: 20 },

  // Bobine e Segnalazione (Coils & Signaling)
  9000: { def: 'coil_standard', yOffset: 20 },
  9001: { def: 'coil_bistable', yOffset: 20 },
  9004: { def: 'coil_timer_on', yOffset: 20 },
  9005: { def: 'coil_timer_off', yOffset: 20 },
  9006: { def: 'coil_timer_on_off', yOffset: 20 },
  9007: { def: 'coil_relay_flasher', yOffset: 20 },
  9008: { def: 'pilot_lamp', yOffset: 20 },
  9009: { def: 'pilot_lamp_flashing', yOffset: 20 },
  9010: { def: 'signal_horn', yOffset: 20 },
  9011: { def: 'signal_bell', yOffset: 20 },
  9012: { def: 'signal_siren', yOffset: 20 },
};

/**
 * Dynamically resolves a CADe_SIMU component mapping based on component type code
 * and actual terminal field count (poles).
 */
export function resolveCadeComponent(type: number, fields: string[]): CadeCompMapping | null {
  const tag = fields[0]?.trim() || '';
  const termCount = fields.slice(1).filter((f) => f && f.trim().length > 0).length;

  // Resistori monofase e trifase (1050, 1051)
  if (type === 1050) return { def: 'resistor_1p', yOffset: 20 };
  if (type === 1051) return { def: 'resistor_3p', yOffset: 20, xOffset: 20 };

  // Fusibili (5000..5008 e 6000..6003)
  if ((type >= 5000 && type <= 5008) || (type >= 6000 && type <= 6003)) {
    if (termCount <= 2) return { def: 'fuse_1p', yOffset: 20 };
    if (termCount <= 4) return { def: 'fuse_1p_n', yOffset: 20, xOffset: 10 };
    if (termCount <= 6) return { def: 'fuse_3p', yOffset: 20, xOffset: 20 };
    return { def: 'fuse_3p_n', yOffset: 20, xOffset: 30 };
  }

  // Interruttori Sezionatori rotativi / manuali (2003..2005)
  if (type >= 2003 && type <= 2005) {
    if (termCount <= 4) return { def: 'switch_disconnector_2p', yOffset: 20, xOffset: 10 };
    if (termCount <= 6) return { def: 'switch_disconnector_3p', yOffset: 20, xOffset: 20 };
    return { def: 'switch_disconnector_3p_n', yOffset: 20, xOffset: 30 };
  }

  // Interruttori Differenziali (RCD 6004..6006)
  if (type >= 6004 && type <= 6006) {
    if (termCount <= 4) return { def: 'rcd_differential_1p_n', yOffset: 30, xOffset: 10 };
    if (termCount <= 6) return { def: 'rcd_differential_3p', yOffset: 30, xOffset: 20 };
    return { def: 'rcd_differential_3p_n', yOffset: 30, xOffset: 30 };
  }

  // Relè termico di potenza (Thermal overload relay 6007)
  if (type === 6007) {
    return { def: 'thermal_relay_power', yOffset: 20, xOffset: 20 };
  }

  // Interruttori Magnetotermici (MCB 6008..6011)
  if (type >= 6008 && type <= 6011) {
    if (termCount <= 2) return { def: 'mcb_magnetothermal_1p', yOffset: 30 };
    if (termCount <= 4) return { def: 'mcb_magnetothermal_2p', yOffset: 30, xOffset: 10 };
    if (termCount <= 6) return { def: 'mcb_magnetothermal_3p', yOffset: 30, xOffset: 20 };
    return { def: 'mcb_magnetothermal_3p_n', yOffset: 30, xOffset: 30 };
  }

  // Sezionatore 6012
  if (type === 6012) {
    if (termCount <= 6) return { def: 'disconnector_3p', yOffset: 20, xOffset: 20 };
    return { def: 'switch_disconnector_3p_n', yOffset: 20, xOffset: 30 };
  }

  // Contattori di potenza (Contactors 2000..2002)
  if (type === 2000) return { def: 'contactor_power_1p', yOffset: 20 };
  if (type === 2001) return { def: 'contactor_power_3p', yOffset: 20, xOffset: 20 };
  if (type === 2002) return { def: 'contactor_power_4p', yOffset: 20, xOffset: 30 };

  // Motori (Motors 1000..1005)
  if (type === 1000) return { def: 'motor_3p_async', yOffset: 30, xOffset: 20 };
  if (type === 1001) return { def: 'motor_3p_dahlander', yOffset: 30, xOffset: 20 };
  if (type === 1002) return { def: 'motor_3p_yd', yOffset: 30, xOffset: 20 };
  if (type === 1004) return { def: 'motor_1p', yOffset: 30 };
  if (type === 1005) return { def: 'motor_dc_pm', yOffset: 30 };

  // Sorgenti di alimentazione (Power sources 3000..3011)
  if (type === 3000) {
    const isDc = tag.includes('24V') || tag.includes('+');
    return { def: isDc ? 'pwr_dc_plus' : 'pwr_l', yOffset: -10 };
  }
  if (type === 3001) {
    const isDc = tag.includes('0V') || tag.includes('-');
    return { def: isDc ? 'pwr_dc_minus' : 'pwr_n', yOffset: -10 };
  }
  if (type === 3002) return { def: 'pwr_pe', yOffset: 10 };
  if (type === 3003) return { def: 'pwr_l_n', yOffset: -10, xOffset: 10 };
  if (type === 3004) return { def: 'pwr_3p', yOffset: -10, xOffset: 20 };
  if (type === 3005) return { def: 'pwr_3p_pe', yOffset: -10, xOffset: 30 };
  if (type === 3006) return { def: 'pwr_3p_n', yOffset: -10, xOffset: 30 };
  if (type === 3007) return { def: 'pwr_3p_n_pe', yOffset: -10, xOffset: 40 };
  if (type === 3010) return { def: 'pwr_l_n', yOffset: -10, xOffset: 10 };
  if (type === 3011) return { def: 'pwr_l_n_pe', yOffset: -10, xOffset: 20 };

  // Static fallback map (aux contacts, buttons, coils, lamps, signals)
  return CADESIMU_TYPE_MAP[type] || null;
}

/**
 * Mapping of CADe_SIMU wire color codes to PowerCad_NextGen WireKind
 */
export const CADESIMU_WIRE_KIND_MAP: Record<number, WireKind> = {
  1: 'phase',    // Marrone / Fase L1
  2: 'neutral',  // Blu / Neutro
  3: 'pe',       // Giallo-Verde / Protezione PE
  4: 'pos',      // Rosso / Positivo DC o circuito ausiliario
  5: 'neg',      // Blu scuro / Negativo DC
};

export interface CadCartiglioData {
  drawnBy: string;
  checkedBy: string;
  entity: string;
  location: string;
  title1: string;
  title2: string;
  date: string;
  sheetNo: string;
  totalSheets: string;
  filename: string;
}

/**
 * Extracts cartiglio (title block) metadata from CADe_SIMU trailer section ($$$...$$$)
 */
export function extractCartiglio(cadText: string): CadCartiglioData | null {
  const trailerIdx = cadText.indexOf('$$$');
  if (trailerIdx === -1) return null;
  const chunk = cadText.slice(trailerIdx);
  const match = chunk.match(/&&&\s*\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)\*([^*]*)/);
  if (!match) return null;

  return {
    drawnBy: match[1].trim(),
    checkedBy: match[2].trim(),
    entity: match[3].trim(),
    location: match[4].trim(),
    title1: match[5].trim(),
    title2: match[6].trim(),
    date: match[7].trim(),
    sheetNo: match[8].trim(),
    totalSheets: match[9].trim(),
    filename: match[10].trim(),
  };
}

/**
 * Converts a CADe_SIMU grid coordinate (step 3) to PowerCad_NextGen canvas coordinate (step 10).
 */
export function cadToCanvasCoord(cadVal: number): number {
  return Math.round((cadVal / 3) * 10);
}

/**
 * Parses native CADe_SIMU (.cad) text file contents into a PowerCad_NextGen Doc object.
 */
export function parseCadeSimu(cadText: string): Doc {
  if (!cadText || typeof cadText !== 'string') {
    throw new Error('Contenuto del file .cad non valido o vuoto.');
  }

  // Parse title block cartiglio if present
  const cartiglio = extractCartiglio(cadText);
  const defaultTitle = cartiglio?.filename || cartiglio?.title2 || 'Schema CADe_SIMU';
  const defaultProject = cartiglio?.title1 || cartiglio?.filename || 'Progetto importato';

  const sheet: Sheet = {
    format: 'A4',
    orientation: 'landscape',
    project: defaultProject,
    title: defaultTitle,
    author: cartiglio?.drawnBy || 'Importato da CADe_SIMU',
    date: cartiglio?.date || new Date().toISOString().slice(0, 10),
    revision: '1.0',
    sheetNo: cartiglio?.sheetNo || '1',
    standard: 'CEI EN 60617',
  };

  const elements: Element[] = [];
  const wires: Wire[] = [];

  // Regex matching every CADe_SIMU record:
  // prefix: (?:&&&|\*|^)(\d+)\*(\d+)#
  // 10 fields delimited by # and terminated before *
  // numeric parameters separated by *
  // optional text following #
  const recRegex = /(?:&&&|\*|^)(\d+)\*(\d+)#((?:[^#]*#){9})([^#*]*)\*([0-9\-\*]+)#([^#*$&]*)/g;
  let match: RegExpExecArray | null;

  let elementCounter = 0;
  let wireCounter = 0;

  while ((match = recRegex.exec(cadText)) !== null) {
    const id = parseInt(match[1], 10);
    const type = parseInt(match[2], 10);
    const fields = (match[3] + match[4]).split('#');
    const params = match[5].split('*').filter((x) => x.length > 0).map(Number);
    const text = match[6] ? match[6].trim() : '';

    // Ignore records with invalid numeric parameters
    if (params.length < 10) continue;

    // Type 1 & Types 4000..4099: Wire segments
    if (type === 1 || (type >= 4000 && type <= 4099)) {
      if (params.length < 12) continue;
      const x1 = cadToCanvasCoord(params[8]);
      const y1 = cadToCanvasCoord(params[9]);
      const x2 = cadToCanvasCoord(params[10]);
      const y2 = cadToCanvasCoord(params[11]);

      // Skip 0-length points (e.g. 4001 connection solder dots)
      if (x1 === x2 && y1 === y2) continue;

      const colorCode = params[params.length - 2];
      let kind: WireKind;

      if (type === 4009) {
        kind = 'neutral';
      } else if (type === 4010) {
        kind = 'pe';
      } else if (type === 4019) {
        kind = 'neg';
      } else if (type === 4002) {
        kind = 'phase_l2';
      } else if (type === 4003) {
        kind = 'phase_l3';
      } else if (type === 4000) {
        kind = 'phase';
      } else if (type === 4018) {
        if (colorCode === 2) kind = 'neutral';
        else if (colorCode === 3) kind = 'pe';
        else if (colorCode === 5) kind = 'neg';
        else kind = 'phase';
      } else {
        kind = CADESIMU_WIRE_KIND_MAP[colorCode] || 'phase';
      }

      wires.push({
        id: `w_cad_${id}_${wireCounter++}`,
        pts: [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ],
        kind,
      });
      continue;
    }

    // Type 8: Free text label
    if (type === 8) {
      const x = cadToCanvasCoord(params[8]);
      const y = cadToCanvasCoord(params[9]);
      const labelText = text || fields[0] || 'Nota';

      elements.push({
        id: `txt_cad_${id}_${elementCounter++}`,
        def: 'text_label',
        x,
        y,
        rot: 0,
        tag: labelText,
        props: {
          text: labelText,
          size: '14',
          bold: 'false',
          italic: 'false',
          frame: 'none',
        },
      });
      continue;
    }

    // Standard electrical components (resolved dynamically according to poles & type)
    const mapping = resolveCadeComponent(type, fields);
    if (mapping) {
      const def = mapping.def;
      const tag = fields[0]?.trim() || '';

      const x = cadToCanvasCoord(params[8]) + (mapping.xOffset || 0);
      const y = cadToCanvasCoord(params[9]) + (mapping.yOffset || 0);

      const props: Record<string, string | number> = {};

      // If timer on coil (9004), extract delay parameter from field 4 or 5
      if (type === 9004) {
        const parsedDelay = parseInt(fields[5] || fields[4], 10);
        if (!isNaN(parsedDelay) && parsedDelay > 0) {
          props.delay = parsedDelay;
        }
      }

      elements.push({
        id: `elem_cad_${id}_${elementCounter++}`,
        def,
        x,
        y,
        rot: 0,
        tag,
        props,
      });
    }
  }

  return {
    app: 'powercad-nextgen',
    version: 1,
    sheet,
    elements,
    wires,
  };
}
