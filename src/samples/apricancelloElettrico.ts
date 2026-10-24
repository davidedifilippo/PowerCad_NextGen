import { Doc } from "../model/types";

/**
 * Circuito Completo "APRICANCELLO ELETTRICO":
 * Apertura manuale (S1), Chiusura automatica con timer (K2) o manuale (S2),
 * finecorsa accoppiati (S3) e finecorsa chiuso (S4), interblocchi elettrici incrociati e relè termico (RT).
 */
export const SAMPLE_APRICANCELLO_ELETTRICO: Doc = {
  app: "powercad-nextgen",
  version: 1,
  sheet: {
    format: "A3",
    orientation: "landscape",
    project: "Automazione Cancelli 2026",
    title: "Apricancello Elettrico - Apertura Manuale, Chiusura Automatica, Relè Termico",
    author: "Ing. Di Filippo",
    date: "2026-10-24",
    revision: "Rev. 1.0",
    sheetNo: "1/1",
  },
  elements: [
    // --- TITOLO SCHEMA ---
    {
      id: "title_text",
      def: "text_label",
      x: 80,
      y: 40,
      rot: 0,
      tag: "",
      props: {
        text: "APRICANCELLO ELETTRICO, APERTURA MANUALE, CHIUSURA AUTOMATICA, RELÈ TERMICO",
        size: "18",
        bold: "true",
        color: "#0f172a",
      },
    },

    // --- ALIMENTAZIONE TRIFASE L1-L2-L3 ---
    {
      id: "pwr_src",
      def: "pwr_3p",
      x: 90,
      y: 120,
      rot: 90,
      tag: "LINEA",
      props: {},
    },
    {
      id: "lbl_l1",
      def: "text_label",
      x: 60,
      y: 100,
      rot: 0,
      tag: "",
      props: { text: "L1", size: "11", bold: "true" },
    },
    {
      id: "lbl_l2",
      def: "text_label",
      x: 60,
      y: 120,
      rot: 0,
      tag: "",
      props: { text: "L2", size: "11", bold: "true" },
    },
    {
      id: "lbl_l3",
      def: "text_label",
      x: 60,
      y: 140,
      rot: 0,
      tag: "",
      props: { text: "L3", size: "11", bold: "true" },
    },

    // --- CIRCUITO DI COMANDO (Sinistra) ---
    // Fusibile di comando F2 (bipolare su L2 e L3)
    {
      id: "f2",
      def: "fuse_2p",
      x: 190,
      y: 200,
      rot: 0,
      tag: "F2",
      props: {},
    },
    // Contatto NC Relè Termico RT (95-96)
    {
      id: "rt_aux",
      def: "thermal_contact_nc",
      x: 230,
      y: 290,
      rot: 0,
      tag: "RT",
      props: {},
    },

    // Ramo 1: Apertura
    // Finecorsa S3 NC (11-12)
    {
      id: "s3_nc",
      def: "limit_switch_nc",
      x: 230,
      y: 370,
      rot: 0,
      tag: "S3",
      props: {},
    },
    // Pulsante NO S1 (Apertura manuale)
    {
      id: "s1",
      def: "btn_no",
      x: 200,
      y: 430,
      rot: 0,
      tag: "S1",
      props: {},
    },
    // Contatto ausiliario NO K1 (Autoritenuta apertura)
    {
      id: "k1_aux",
      def: "contact_no",
      x: 260,
      y: 430,
      rot: 0,
      tag: "K1",
      props: {},
    },
    // Interblocco NC K3 (21-22)
    {
      id: "k3_int_open",
      def: "contact_nc",
      x: 230,
      y: 560,
      rot: 0,
      tag: "K3",
      props: {},
    },
    // Bobina Contattore Apertura K1
    {
      id: "k1_coil",
      def: "coil_standard",
      x: 230,
      y: 640,
      rot: 0,
      tag: "K1",
      props: {},
    },

    // Ramo 2: Pausa Cancello Aperto (Timer K2)
    // Finecorsa S3 NO (13-14)
    {
      id: "s3_no",
      def: "limit_switch_no",
      x: 330,
      y: 370,
      rot: 0,
      tag: "S3",
      props: {},
    },
    // Tratteggio grafico accoppiamento meccanico S3
    {
      id: "s3_mech_link",
      def: "text_label",
      x: 280,
      y: 370,
      rot: 0,
      tag: "",
      props: { text: "- - - - - -", size: "14", bold: "true", color: "#64748b" },
    },
    // Interblocco NC K3 (31-32)
    {
      id: "k3_int_timer",
      def: "contact_nc",
      x: 330,
      y: 560,
      rot: 0,
      tag: "K3",
      props: {},
    },
    // Bobina Timer al ritardo K2 (5s)
    {
      id: "k2_coil",
      def: "coil_timer_on",
      x: 330,
      y: 640,
      rot: 0,
      tag: "K2",
      props: { delay: 5 },
    },

    // Ramo 3: Chiusura
    // Contatto temporizzato NO K2 (67-68)
    {
      id: "k2_timed",
      def: "contact_timer_on_no",
      x: 400,
      y: 430,
      rot: 0,
      tag: "K2",
      props: {},
    },
    // Pulsante NO S2 (Chiusura manuale)
    {
      id: "s2",
      def: "btn_no",
      x: 470,
      y: 430,
      rot: 0,
      tag: "S2",
      props: {},
    },
    // Contatto ausiliario NO K3 (Autoritenuta chiusura)
    {
      id: "k3_aux",
      def: "contact_no",
      x: 540,
      y: 430,
      rot: 0,
      tag: "K3",
      props: {},
    },
    // Finecorsa S4 NC (11-12) (Cancello chiuso)
    {
      id: "s4_nc",
      def: "limit_switch_nc",
      x: 440,
      y: 500,
      rot: 0,
      tag: "S4",
      props: {},
    },
    // Interblocco NC K1 (21-22)
    {
      id: "k1_int_close",
      def: "contact_nc",
      x: 440,
      y: 560,
      rot: 0,
      tag: "K1",
      props: {},
    },
    // Bobina Contattore Chiusura K3
    {
      id: "k3_coil",
      def: "coil_standard",
      x: 440,
      y: 640,
      rot: 0,
      tag: "K3",
      props: {},
    },

    // --- CIRCUITO DI POTENZA (Destra) ---
    // Fusibile trifase F1
    {
      id: "f1",
      def: "fuse_3p",
      x: 750,
      y: 200,
      rot: 0,
      tag: "F1",
      props: {},
    },
    // Contattore di potenza Apertura K1
    {
      id: "k1_pwr",
      def: "contactor_power_3p",
      x: 750,
      y: 320,
      rot: 0,
      tag: "K1",
      props: {},
    },
    // Contattore di potenza Chiusura K3 (inversione fasi)
    {
      id: "k3_pwr",
      def: "contactor_power_3p",
      x: 890,
      y: 320,
      rot: 0,
      tag: "K3",
      props: {},
    },
    // Relè Termico trifase RT
    {
      id: "rt_pwr",
      def: "thermal_relay_power",
      x: 750,
      y: 470,
      rot: 0,
      tag: "RT",
      props: {},
    },
    // Motore Asincrono Trifase M1
    {
      id: "m1",
      def: "motor_3p_async",
      x: 750,
      y: 570,
      rot: 0,
      tag: "M1",
      props: {},
    },
  ],
  wires: [
    // --- SBARRE TRIFASE L1, L2, L3 ---
    {
      id: "w_l1_rail",
      pts: [{ x: 80, y: 100 }, { x: 960, y: 100 }],
      kind: "phase",
    },
    {
      id: "w_l2_rail",
      pts: [{ x: 80, y: 120 }, { x: 960, y: 120 }],
      kind: "phase_l2",
    },
    {
      id: "w_l3_rail",
      pts: [{ x: 80, y: 140 }, { x: 960, y: 140 }],
      kind: "phase_l3",
    },

    // --- ALIMENTAZIONE FUSIBILE COMANDO F2 ---
    // Polo sinistro F2 (term 1 at 180, 180) a L3 (180, 140)
    {
      id: "w_f2_in_l3",
      pts: [{ x: 180, y: 180 }, { x: 180, y: 140 }],
      kind: "phase_l3",
    },
    // Polo destro F2 (term 3 at 200, 180) a L2 (200, 120)
    {
      id: "w_f2_in_l2",
      pts: [{ x: 200, y: 180 }, { x: 200, y: 120 }],
      kind: "phase_l2",
    },

    // Ritorno dal polo 2 F2 (180, 220) lungo la linea verticale sinistra
    {
      id: "w_f2_ret_vert",
      pts: [{ x: 180, y: 220 }, { x: 180, y: 700 }],
      kind: "neutral",
    },
    // Rotaia di ritorno orizzontale inferiore a tutte le bobine
    {
      id: "w_ret_bottom",
      pts: [{ x: 180, y: 700 }, { x: 440, y: 700 }],
      kind: "neutral",
    },

    // Fase dal polo 4 F2 (200, 220) verso RT termico 95 (230, 270)
    {
      id: "w_f2_to_rt",
      pts: [{ x: 200, y: 220 }, { x: 200, y: 240 }, { x: 230, y: 240 }, { x: 230, y: 270 }],
      kind: "phase",
    },

    // Uscita RT 96 (230, 310) a distributore orizzontale comando (230, 330)
    {
      id: "w_rt_out",
      pts: [{ x: 230, y: 310 }, { x: 230, y: 330 }],
      kind: "phase",
    },
    // Rotaia distributore orizzontale comando
    {
      id: "w_dist_bus",
      pts: [{ x: 230, y: 330 }, { x: 540, y: 330 }],
      kind: "phase",
    },

    // --- RAMO 1: APERTURA (x=230) ---
    // Bus a S3 NC (11) (230, 350)
    {
      id: "w_s3_nc_in",
      pts: [{ x: 230, y: 330 }, { x: 230, y: 350 }],
      kind: "phase",
    },
    // S3 NC (12) (230, 390) a nodo split parallelo (230, 400)
    {
      id: "w_s3_nc_to_split",
      pts: [{ x: 230, y: 390 }, { x: 230, y: 400 }],
      kind: "phase",
    },
    // Split verso S1 (200, 410)
    {
      id: "w_split_s1",
      pts: [{ x: 230, y: 400 }, { x: 200, y: 400 }, { x: 200, y: 410 }],
      kind: "phase",
    },
    // Split verso K1 aux (260, 410)
    {
      id: "w_split_k1",
      pts: [{ x: 230, y: 400 }, { x: 260, y: 400 }, { x: 260, y: 410 }],
      kind: "phase",
    },
    // Rientro da S1 (200, 450) a nodo merge (230, 480)
    {
      id: "w_merge_s1",
      pts: [{ x: 200, y: 450 }, { x: 200, y: 480 }, { x: 230, y: 480 }],
      kind: "phase",
    },
    // Rientro da K1 aux (260, 450) a nodo merge (230, 480)
    {
      id: "w_merge_k1",
      pts: [{ x: 260, y: 450 }, { x: 260, y: 480 }, { x: 230, y: 480 }],
      kind: "phase",
    },
    // Nodo merge a K3 interblocco NC 21 (230, 540)
    {
      id: "w_merge_to_k3_open",
      pts: [{ x: 230, y: 480 }, { x: 230, y: 540 }],
      kind: "phase",
    },
    // K3 NC 22 (230, 580) a Bobina K1 A1 (230, 620)
    {
      id: "w_k3_to_k1_coil",
      pts: [{ x: 230, y: 580 }, { x: 230, y: 620 }],
      kind: "phase",
    },
    // Bobina K1 A2 (230, 660) a ritorno (230, 700)
    {
      id: "w_k1_ret",
      pts: [{ x: 230, y: 660 }, { x: 230, y: 700 }],
      kind: "neutral",
    },

    // --- RAMO 2: TIMER PAUSA (x=330) ---
    // Bus a S3 NO (13) (330, 350)
    {
      id: "w_s3_no_in",
      pts: [{ x: 330, y: 330 }, { x: 330, y: 350 }],
      kind: "phase",
    },
    // S3 NO (14) (330, 390) a snodo T (330, 400)
    {
      id: "w_s3_no_out",
      pts: [{ x: 330, y: 390 }, { x: 330, y: 400 }],
      kind: "phase",
    },
    // Snodo T verso contatto temporizzato K2 NO 67 (400, 410)
    {
      id: "w_t_to_k2_timed",
      pts: [{ x: 330, y: 400 }, { x: 400, y: 400 }, { x: 400, y: 410 }],
      kind: "phase",
    },
    // Snodo T verso K3 NC interblocco timer 31 (330, 540)
    {
      id: "w_t_to_k3_timer",
      pts: [{ x: 330, y: 400 }, { x: 330, y: 540 }],
      kind: "phase",
    },
    // K3 NC 32 (330, 580) a Bobina Timer K2 A1 (330, 620)
    {
      id: "w_k3_to_k2_coil",
      pts: [{ x: 330, y: 580 }, { x: 330, y: 620 }],
      kind: "phase",
    },
    // Bobina Timer K2 A2 (330, 660) a ritorno (330, 700)
    {
      id: "w_k2_ret",
      pts: [{ x: 330, y: 660 }, { x: 330, y: 700 }],
      kind: "neutral",
    },

    // --- RAMO 3: CHIUSURA ---
    // Bus verso S2 NO (13) (470, 410)
    {
      id: "w_bus_to_s2",
      pts: [{ x: 470, y: 330 }, { x: 470, y: 410 }],
      kind: "phase",
    },
    // Bus verso K3 NO aux (13) (540, 410)
    {
      id: "w_bus_to_k3_aux",
      pts: [{ x: 540, y: 330 }, { x: 540, y: 410 }],
      kind: "phase",
    },
    // Uscita K2 timed NO 68 (400, 450) al collettore parallelo (400, 470)
    {
      id: "w_k2_timed_out",
      pts: [{ x: 400, y: 450 }, { x: 400, y: 470 }],
      kind: "phase",
    },
    // Uscita S2 NO 14 (470, 450) al collettore parallelo (470, 470)
    {
      id: "w_s2_out",
      pts: [{ x: 470, y: 450 }, { x: 470, y: 470 }],
      kind: "phase",
    },
    // Uscita K3 NO aux 14 (540, 450) al collettore parallelo (540, 470)
    {
      id: "w_k3_aux_out",
      pts: [{ x: 540, y: 450 }, { x: 540, y: 470 }],
      kind: "phase",
    },
    // Barra collettore parallelo chiusura
    {
      id: "w_close_collector",
      pts: [{ x: 400, y: 470 }, { x: 540, y: 470 }],
      kind: "phase",
    },
    // Barra collettore a S4 NC 11 (440, 480)
    {
      id: "w_collector_to_s4",
      pts: [{ x: 440, y: 470 }, { x: 440, y: 480 }],
      kind: "phase",
    },
    // S4 NC 12 (440, 520) a K1 NC interblocco 21 (440, 540)
    {
      id: "w_s4_to_k1_int",
      pts: [{ x: 440, y: 520 }, { x: 440, y: 540 }],
      kind: "phase",
    },
    // K1 NC 22 (440, 580) a Bobina K3 A1 (440, 620)
    {
      id: "w_k1_int_to_k3_coil",
      pts: [{ x: 440, y: 580 }, { x: 440, y: 620 }],
      kind: "phase",
    },
    // Bobina K3 A2 (440, 660) a ritorno (440, 700)
    {
      id: "w_k3_ret",
      pts: [{ x: 440, y: 660 }, { x: 440, y: 700 }],
      kind: "neutral",
    },

    // --- CIRCUITO DI POTENZA ---
    // Alimentazione da sbarre L1, L2, L3 a fusibile F1
    // F1 morsetto 1 (730, 180) a L1 (730, 100)
    {
      id: "w_pwr_f1_1",
      pts: [{ x: 730, y: 180 }, { x: 730, y: 100 }],
      kind: "phase",
    },
    // F1 morsetto 3 (750, 180) a L2 (750, 120)
    {
      id: "w_pwr_f1_3",
      pts: [{ x: 750, y: 180 }, { x: 750, y: 120 }],
      kind: "phase_l2",
    },
    // F1 morsetto 5 (770, 180) a L3 (770, 140)
    {
      id: "w_pwr_f1_5",
      pts: [{ x: 770, y: 180 }, { x: 770, y: 140 }],
      kind: "phase_l3",
    },

    // Linee verticali F1 -> K1 (potenza apertura)
    {
      id: "w_pwr_f1_k1_1",
      pts: [{ x: 730, y: 220 }, { x: 730, y: 300 }],
      kind: "phase",
    },
    {
      id: "w_pwr_f1_k1_3",
      pts: [{ x: 750, y: 220 }, { x: 750, y: 300 }],
      kind: "phase_l2",
    },
    {
      id: "w_pwr_f1_k1_5",
      pts: [{ x: 770, y: 220 }, { x: 770, y: 300 }],
      kind: "phase_l3",
    },

    // Derivazioni superiori verso K3 (in parallelo a monte di K1)
    // L1: tap a (730, 250) -> (870, 250) -> K3 term 1 (870, 300)
    {
      id: "w_k3_top_1",
      pts: [{ x: 730, y: 250 }, { x: 870, y: 250 }, { x: 870, y: 300 }],
      kind: "phase",
    },
    // L2: tap a (750, 260) -> (890, 260) -> K3 term 3 (890, 300)
    {
      id: "w_k3_top_3",
      pts: [{ x: 750, y: 260 }, { x: 890, y: 260 }, { x: 890, y: 300 }],
      kind: "phase_l2",
    },
    // L3: tap a (770, 270) -> (910, 270) -> K3 term 5 (910, 300)
    {
      id: "w_k3_top_5",
      pts: [{ x: 770, y: 270 }, { x: 910, y: 270 }, { x: 910, y: 300 }],
      kind: "phase_l3",
    },

    // Linee verticali K1 -> RT (termica)
    {
      id: "w_pwr_k1_rt_1",
      pts: [{ x: 730, y: 340 }, { x: 730, y: 450 }],
      kind: "phase",
    },
    {
      id: "w_pwr_k1_rt_3",
      pts: [{ x: 750, y: 340 }, { x: 750, y: 450 }],
      kind: "phase_l2",
    },
    {
      id: "w_pwr_k1_rt_5",
      pts: [{ x: 770, y: 340 }, { x: 770, y: 450 }],
      kind: "phase_l3",
    },

    // INVERSIONE DI FASE A VALLE DI K3 (Inversione marcia chiusura):
    // K3 morsetto 2 (da L1) (870, 340) -> va a fase 3 (W) a (770, 410)
    {
      id: "w_k3_rev_2_to_w",
      pts: [{ x: 870, y: 340 }, { x: 870, y: 410 }, { x: 770, y: 410 }],
      kind: "phase",
    },
    // K3 morsetto 4 (da L2) (890, 340) -> va a fase 2 (V) a (750, 400)
    {
      id: "w_k3_rev_4_to_v",
      pts: [{ x: 890, y: 340 }, { x: 890, y: 400 }, { x: 750, y: 400 }],
      kind: "phase_l2",
    },
    // K3 morsetto 6 (da L3) (910, 340) -> va a fase 1 (U) a (730, 390)
    {
      id: "w_k3_rev_6_to_u",
      pts: [{ x: 910, y: 340 }, { x: 910, y: 390 }, { x: 730, y: 390 }],
      kind: "phase_l3",
    },

    // Da Relè Termico RT a Motore MAT M1 (U, V, W)
    // RT 2 (730, 490) a M1 U (730, 540)
    {
      id: "w_rt_to_m1_u",
      pts: [{ x: 730, y: 490 }, { x: 730, y: 540 }],
      kind: "phase",
    },
    // RT 4 (750, 490) a M1 V (750, 540)
    {
      id: "w_rt_to_m1_v",
      pts: [{ x: 750, y: 490 }, { x: 750, y: 540 }],
      kind: "phase_l2",
    },
    // RT 6 (770, 490) a M1 W (770, 540)
    {
      id: "w_rt_to_m1_w",
      pts: [{ x: 770, y: 490 }, { x: 770, y: 540 }],
      kind: "phase_l3",
    },
  ],
};

