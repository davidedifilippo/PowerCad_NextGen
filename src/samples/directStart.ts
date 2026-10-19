import { Doc } from '../model/types';

/**
 * Pre-built classic industrial schematic:
 * "Avviamento Diretto Motore Trifase con circuito di comando e circuito di potenza, autoritenuta e segnalazioni"
 */
export const SAMPLE_DIRECT_START: Doc = {
  app: 'powercad-nextgen',
  version: 1,
  sheet: {
    format: 'A3', // As requested: default to roomy A3 format
    orientation: 'landscape',
    project: 'Impianto Industriale 2026',
    title: 'Avviamento Diretto Marcia/Arresto con Autoritenuta',
    author: 'Ing. Di Filippo',
    date: '2026-10-15',
    revision: 'Rev. 1.0',
    sheetNo: '1/1',
  },
  elements: [
    // --- CIRCUITO DI POTENZA ---
    // 1. Sorgente Trifase L1-L2-L3-N-PE
    {
      id: 'src_pwr',
      def: 'pwr_3p_n_pe',
      x: 140,
      y: 100,
      rot: 0,
      tag: 'LINEA',
      props: {},
    },
    // 2. Sezionatore Magnetotermico Generale -QM1
    {
      id: 'qm1',
      def: 'disconnector_3p',
      x: 120,
      y: 200,
      rot: 0,
      tag: '-QM1',
      props: {},
    },
    // 3. Contattore di potenza -KM1
    {
      id: 'km1_power',
      def: 'contactor_power_3p',
      x: 120,
      y: 310,
      rot: 0,
      tag: '-KM1',
      props: {},
    },
    // 4. Relè Termico Sovraccarico -FR1
    {
      id: 'fr1_power',
      def: 'thermal_relay_power',
      x: 120,
      y: 410,
      rot: 0,
      tag: '-FR1',
      props: {},
    },
    // 5. Motore Trifase -M1
    {
      id: 'm1',
      def: 'motor_3p_async',
      x: 120,
      y: 520,
      rot: 0,
      tag: '-M1',
      props: {},
    },

    // --- CIRCUITO DI COMANDO ---
    // 6. Fusibile comando -F1 (fase)
    {
      id: 'f1',
      def: 'fuse_1p',
      x: 400,
      y: 150,
      rot: 0,
      tag: '-F1',
      props: {},
    },
    // 7. Pulsante Arresto / Emergenza NC -SB1
    {
      id: 'sb1_stop',
      def: 'btn_nc',
      x: 400,
      y: 240,
      rot: 0,
      tag: '-SB1 (Stop)',
      props: {},
    },
    // 8. Pulsante Marcia NA -SB2
    {
      id: 'sb2_start',
      def: 'btn_no',
      x: 400,
      y: 330,
      rot: 0,
      tag: '-SB2 (Marcia)',
      props: {},
    },
    // 9. Contatto Ausiliario di Autoritenuta NA -KM1 (13-14)
    {
      id: 'km1_aux',
      def: 'contact_no',
      x: 480,
      y: 330,
      rot: 0,
      tag: '-KM1',
      props: {},
    },
    // 10. Bobina Contattore -KM1 (A1-A2)
    {
      id: 'km1_coil',
      def: 'coil_standard',
      x: 400,
      y: 440,
      rot: 0,
      tag: '-KM1',
      props: {},
    },
    // 11. Lampada Segnalazione Marcia Verde -H1
    {
      id: 'h1_lamp',
      def: 'pilot_lamp',
      x: 560,
      y: 440,
      rot: 0,
      tag: '-H1 (Marcia)',
      props: { color: 'Verde' },
    },
    // 12. Lampada Segnalazione Arresto Rosso -H2 (spaziata +20px a x=660 per non sovrapporre l'etichetta)
    {
      id: 'h2_lamp',
      def: 'pilot_lamp',
      x: 660,
      y: 440,
      rot: 0,
      tag: '-H2 (Arresto)',
      props: { color: 'Rosso' },
    },
    // 13. Contatto NC ausiliario per lampada arresto -KM1
    {
      id: 'km1_aux_nc',
      def: 'contact_nc',
      x: 660,
      y: 330,
      rot: 0,
      tag: '-KM1',
      props: {},
    },
    // 14. Barra Neutro comando in basso
    {
      id: 'pwr_n_ctrl',
      def: 'pwr_n',
      x: 400,
      y: 530,
      rot: 180,
      tag: 'N',
      props: {},
    },
    // 15. Sorgente Fase comando L
    {
      id: 'pwr_l_ctrl',
      def: 'pwr_l',
      x: 400,
      y: 90,
      rot: 0,
      tag: 'L1',
      props: {},
    },
  ],
  wires: [
    // Potenza L1-L2-L3 a QM1
    { id: 'w1', kind: 'phase', pts: [{ x: 100, y: 110 }, { x: 100, y: 170 }] },
    { id: 'w2', kind: 'phase_l2', pts: [{ x: 120, y: 110 }, { x: 120, y: 170 }] },
    { id: 'w3', kind: 'phase_l3', pts: [{ x: 140, y: 110 }, { x: 140, y: 170 }] },

    // QM1 a KM1
    { id: 'w4', kind: 'phase', pts: [{ x: 100, y: 230 }, { x: 100, y: 280 }] },
    { id: 'w5', kind: 'phase_l2', pts: [{ x: 120, y: 230 }, { x: 120, y: 280 }] },
    { id: 'w6', kind: 'phase_l3', pts: [{ x: 140, y: 230 }, { x: 140, y: 280 }] },

    // KM1 a FR1
    { id: 'w7', kind: 'phase', pts: [{ x: 100, y: 340 }, { x: 100, y: 390 }] },
    { id: 'w8', kind: 'phase_l2', pts: [{ x: 120, y: 340 }, { x: 120, y: 390 }] },
    { id: 'w9', kind: 'phase_l3', pts: [{ x: 140, y: 340 }, { x: 140, y: 390 }] },

    // FR1 a Motore M1
    { id: 'w10', kind: 'phase', pts: [{ x: 100, y: 430 }, { x: 100, y: 490 }] },
    { id: 'w11', kind: 'phase_l2', pts: [{ x: 120, y: 430 }, { x: 120, y: 490 }] },
    { id: 'w12', kind: 'phase_l3', pts: [{ x: 140, y: 430 }, { x: 140, y: 490 }] },
    // Terra motore
    { id: 'w_pe_a', kind: 'pe', pts: [{ x: 180, y: 110 }, { x: 180, y: 470 }] },
    { id: 'w_pe_b', kind: 'pe', pts: [{ x: 180, y: 470 }, { x: 160, y: 470 }] },
    { id: 'w_pe_c', kind: 'pe', pts: [{ x: 160, y: 470 }, { x: 160, y: 490 }] },

    // Comando: L -> Fusibile -> Stop NC
    { id: 'wc1', kind: 'phase', pts: [{ x: 400, y: 100 }, { x: 400, y: 130 }] },
    { id: 'wc2', kind: 'phase', pts: [{ x: 400, y: 170 }, { x: 400, y: 220 }] },

    // Stop NC -> Start NA e parallelo autoritenuta KM1
    { id: 'wc3', kind: 'phase', pts: [{ x: 400, y: 260 }, { x: 400, y: 310 }] },
    { id: 'wc4_h', kind: 'phase', pts: [{ x: 400, y: 280 }, { x: 480, y: 280 }] },
    { id: 'wc4_v', kind: 'phase', pts: [{ x: 480, y: 280 }, { x: 480, y: 310 }] },
    { id: 'wc5_h', kind: 'phase', pts: [{ x: 480, y: 280 }, { x: 660, y: 280 }] },
    { id: 'wc5_v', kind: 'phase', pts: [{ x: 660, y: 280 }, { x: 660, y: 310 }] },

    // Start NA / Autoritenuta -> Bobina KM1 (A1)
    { id: 'wc6', kind: 'phase', pts: [{ x: 400, y: 350 }, { x: 400, y: 420 }] },
    { id: 'wc7_v', kind: 'phase', pts: [{ x: 480, y: 350 }, { x: 480, y: 380 }] },
    { id: 'wc7_h', kind: 'phase', pts: [{ x: 480, y: 380 }, { x: 400, y: 380 }] },
    // Parallelo a Lampada Marcia H1
    { id: 'wc8_h', kind: 'phase', pts: [{ x: 480, y: 380 }, { x: 560, y: 380 }] },
    { id: 'wc8_v', kind: 'phase', pts: [{ x: 560, y: 380 }, { x: 560, y: 420 }] },

    // KM1 NC -> Lampada Arresto H2
    { id: 'wc9', kind: 'phase', pts: [{ x: 660, y: 350 }, { x: 660, y: 420 }] },

    // Ritorno Neutro da Bobina, H1, H2 a Neutro
    { id: 'wc10', kind: 'neutral', pts: [{ x: 400, y: 460 }, { x: 400, y: 520 }] },
    { id: 'wc11_v', kind: 'neutral', pts: [{ x: 560, y: 460 }, { x: 560, y: 500 }] },
    { id: 'wc11_h', kind: 'neutral', pts: [{ x: 560, y: 500 }, { x: 400, y: 500 }] },
    { id: 'wc12_v', kind: 'neutral', pts: [{ x: 660, y: 460 }, { x: 660, y: 500 }] },
    { id: 'wc12_h', kind: 'neutral', pts: [{ x: 660, y: 500 }, { x: 560, y: 500 }] },
  ],
};
