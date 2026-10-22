import { Doc } from '../model/types';

export const SAMPLE_UNDERVOLTAGE_RELEASE: Doc = {
  "app": "cadesimu-next",
  "version": 1,
  "sheet": {
    "format": "A4",
    "orientation": "landscape",
    "project": "Rilevazione Tensione Bassa",
    "title": "RELE' DI CONTROLLO DELLA TENSIONE",
    "author": "CADe_SIMU Next",
    "date": "2026-10-22",
    "revision": "1.0",
    "sheetNo": "1/2"
  },
  "elements": [
    {
      "id": "title_1",
      "def": "text_label",
      "x": 200,
      "y": 20,
      "rot": 0,
      "tag": "",
      "props": {
        "text": "1) RELE' DI CONTROLLO DELLA TENSIONE IN UN SISTEMA MONOFASE",
        "size": 14,
        "bold": "true"
      }
    },
    {
      "id": "pwr_1",
      "def": "pwr_l_n_pe",
      "x": 110,
      "y": 50,
      "rot": 0,
      "tag": "-X1",
      "props": {}
    },
    {
      "id": "fuse_1",
      "def": "fuse_disconnector_2p",
      "x": 100,
      "y": 100,
      "rot": 0,
      "tag": "-F1",
      "props": {}
    },
    {
      "id": "brk_1",
      "def": "breaker_undervoltage_2p",
      "x": 100,
      "y": 180,
      "rot": 0,
      "tag": "-F2",
      "props": {}
    },
    {
      "id": "coil_1",
      "def": "coil_undervoltage_1p",
      "x": 140,
      "y": 180,
      "rot": 0,
      "tag": "-F2",
      "props": {}
    },
    {
      "id": "sw_1",
      "def": "switch_nc",
      "x": 180,
      "y": 180,
      "rot": 0,
      "tag": "-S1",
      "props": {}
    },
    {
      "id": "mcb_1",
      "def": "mcb_magnetothermal_2p",
      "x": 100,
      "y": 270,
      "rot": 0,
      "tag": "-Q1",
      "props": {}
    },
    {
      "id": "motor_1",
      "def": "motor_1p",
      "x": 110,
      "y": 360,
      "rot": 0,
      "tag": "-M1",
      "props": {}
    }
  ],
  "wires": [
    {
      "id": "w1_1",
      "pts": [
        {
          "x": 90,
          "y": 60
        },
        {
          "x": 90,
          "y": 80
        }
      ],
      "kind": "phase"
    },
    {
      "id": "w1_2",
      "pts": [
        {
          "x": 110,
          "y": 60
        },
        {
          "x": 110,
          "y": 80
        }
      ],
      "kind": "neutral"
    },
    {
      "id": "w1_3",
      "pts": [
        {
          "x": 130,
          "y": 60
        },
        {
          "x": 130,
          "y": 330
        }
      ],
      "kind": "pe"
    },
    {
      "id": "w1_4",
      "pts": [
        {
          "x": 90,
          "y": 120
        },
        {
          "x": 90,
          "y": 150
        }
      ],
      "kind": "phase"
    },
    {
      "id": "w1_5",
      "pts": [
        {
          "x": 110,
          "y": 120
        },
        {
          "x": 110,
          "y": 150
        }
      ],
      "kind": "neutral"
    },
    {
      "id": "w1_6",
      "pts": [
        {
          "x": 90,
          "y": 130
        },
        {
          "x": 140,
          "y": 130
        },
        {
          "x": 140,
          "y": 160
        }
      ],
      "kind": "phase"
    },
    {
      "id": "w1_7",
      "pts": [
        {
          "x": 110,
          "y": 140
        },
        {
          "x": 180,
          "y": 140
        },
        {
          "x": 180,
          "y": 160
        }
      ],
      "kind": "neutral"
    },
    {
      "id": "w1_8",
      "pts": [
        {
          "x": 140,
          "y": 200
        },
        {
          "x": 140,
          "y": 220
        },
        {
          "x": 180,
          "y": 220
        },
        {
          "x": 180,
          "y": 200
        }
      ],
      "kind": "aux"
    },
    {
      "id": "w1_9",
      "pts": [
        {
          "x": 90,
          "y": 210
        },
        {
          "x": 90,
          "y": 240
        }
      ],
      "kind": "phase"
    },
    {
      "id": "w1_10",
      "pts": [
        {
          "x": 110,
          "y": 210
        },
        {
          "x": 110,
          "y": 240
        }
      ],
      "kind": "neutral"
    },
    {
      "id": "w1_11",
      "pts": [
        {
          "x": 90,
          "y": 300
        },
        {
          "x": 90,
          "y": 330
        }
      ],
      "kind": "phase"
    },
    {
      "id": "w1_12",
      "pts": [
        {
          "x": 110,
          "y": 300
        },
        {
          "x": 110,
          "y": 330
        }
      ],
      "kind": "neutral"
    }
  ],
  "pages": [
    {
      "id": "page_1",
      "title": "1) RELE' DI CONTROLLO DELLA TENSIONE IN UN SISTEMA MONOFASE",
      "elements": [
        {
          "id": "title_1",
          "def": "text_label",
          "x": 200,
          "y": 20,
          "rot": 0,
          "tag": "",
          "props": {
            "text": "1) RELE' DI CONTROLLO DELLA TENSIONE IN UN SISTEMA MONOFASE",
            "size": 14,
            "bold": "true"
          }
        },
        {
          "id": "pwr_1",
          "def": "pwr_l_n_pe",
          "x": 110,
          "y": 50,
          "rot": 0,
          "tag": "-X1",
          "props": {}
        },
        {
          "id": "fuse_1",
          "def": "fuse_disconnector_2p",
          "x": 100,
          "y": 100,
          "rot": 0,
          "tag": "-F1",
          "props": {}
        },
        {
          "id": "brk_1",
          "def": "breaker_undervoltage_2p",
          "x": 100,
          "y": 180,
          "rot": 0,
          "tag": "-F2",
          "props": {}
        },
        {
          "id": "coil_1",
          "def": "coil_undervoltage_1p",
          "x": 140,
          "y": 180,
          "rot": 0,
          "tag": "-F2",
          "props": {}
        },
        {
          "id": "sw_1",
          "def": "switch_nc",
          "x": 180,
          "y": 180,
          "rot": 0,
          "tag": "-S1",
          "props": {}
        },
        {
          "id": "mcb_1",
          "def": "mcb_magnetothermal_2p",
          "x": 100,
          "y": 270,
          "rot": 0,
          "tag": "-Q1",
          "props": {}
        },
        {
          "id": "motor_1",
          "def": "motor_1p",
          "x": 110,
          "y": 360,
          "rot": 0,
          "tag": "-M1",
          "props": {}
        }
      ],
      "wires": [
        {
          "id": "w1_1",
          "pts": [
            {
              "x": 90,
              "y": 60
            },
            {
              "x": 90,
              "y": 80
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w1_2",
          "pts": [
            {
              "x": 110,
              "y": 60
            },
            {
              "x": 110,
              "y": 80
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w1_3",
          "pts": [
            {
              "x": 130,
              "y": 60
            },
            {
              "x": 130,
              "y": 330
            }
          ],
          "kind": "pe"
        },
        {
          "id": "w1_4",
          "pts": [
            {
              "x": 90,
              "y": 120
            },
            {
              "x": 90,
              "y": 150
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w1_5",
          "pts": [
            {
              "x": 110,
              "y": 120
            },
            {
              "x": 110,
              "y": 150
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w1_6",
          "pts": [
            {
              "x": 90,
              "y": 130
            },
            {
              "x": 140,
              "y": 130
            },
            {
              "x": 140,
              "y": 160
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w1_7",
          "pts": [
            {
              "x": 110,
              "y": 140
            },
            {
              "x": 180,
              "y": 140
            },
            {
              "x": 180,
              "y": 160
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w1_8",
          "pts": [
            {
              "x": 140,
              "y": 200
            },
            {
              "x": 140,
              "y": 220
            },
            {
              "x": 180,
              "y": 220
            },
            {
              "x": 180,
              "y": 200
            }
          ],
          "kind": "aux"
        },
        {
          "id": "w1_9",
          "pts": [
            {
              "x": 90,
              "y": 210
            },
            {
              "x": 90,
              "y": 240
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w1_10",
          "pts": [
            {
              "x": 110,
              "y": 210
            },
            {
              "x": 110,
              "y": 240
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w1_11",
          "pts": [
            {
              "x": 90,
              "y": 300
            },
            {
              "x": 90,
              "y": 330
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w1_12",
          "pts": [
            {
              "x": 110,
              "y": 300
            },
            {
              "x": 110,
              "y": 330
            }
          ],
          "kind": "neutral"
        }
      ]
    },
    {
      "id": "page_2",
      "title": "2) RELE' DI CONTROLLO DELLA TENSIONE IN UN SISTEMA TRIFASE",
      "elements": [
        {
          "id": "title_2",
          "def": "text_label",
          "x": 220,
          "y": 20,
          "rot": 0,
          "tag": "",
          "props": {
            "text": "2) RELE' DI CONTROLLO DELLA TENSIONE IN UN SISTEMA TRIFASE",
            "size": 14,
            "bold": "true"
          }
        },
        {
          "id": "pwr_2",
          "def": "pwr_3p_n_pe",
          "x": 130,
          "y": 50,
          "rot": 0,
          "tag": "-X1",
          "props": {}
        },
        {
          "id": "fuse_2",
          "def": "fuse_disconnector_3p",
          "x": 110,
          "y": 100,
          "rot": 0,
          "tag": "-F3",
          "props": {}
        },
        {
          "id": "sw_s2",
          "def": "switch_nc",
          "x": 190,
          "y": 140,
          "rot": 0,
          "tag": "-S2",
          "props": {}
        },
        {
          "id": "sw_s3",
          "def": "switch_nc",
          "x": 210,
          "y": 140,
          "rot": 0,
          "tag": "-S3",
          "props": {}
        },
        {
          "id": "sw_s4",
          "def": "switch_nc",
          "x": 230,
          "y": 140,
          "rot": 0,
          "tag": "-S4",
          "props": {}
        },
        {
          "id": "brk_2",
          "def": "breaker_undervoltage_4p",
          "x": 120,
          "y": 200,
          "rot": 0,
          "tag": "-F4",
          "props": {}
        },
        {
          "id": "coil_2",
          "def": "coil_undervoltage_3p",
          "x": 210,
          "y": 200,
          "rot": 0,
          "tag": "-F4",
          "props": {}
        },
        {
          "id": "desc_box_2",
          "def": "text_label",
          "x": 280,
          "y": 200,
          "rot": 0,
          "tag": "",
          "props": {
            "text": "SIMULAZIONE:\nMANCANZA O VALORE BASSO\nDI TENSIONE IN UN\nSISTEMA TRIFASE",
            "size": 9
          }
        },
        {
          "id": "mcb_2",
          "def": "mcb_magnetothermal_3p",
          "x": 110,
          "y": 290,
          "rot": 0,
          "tag": "-Q2",
          "props": {}
        },
        {
          "id": "motor_2",
          "def": "motor_3p_async",
          "x": 110,
          "y": 380,
          "rot": 0,
          "tag": "-M2",
          "props": {}
        }
      ],
      "wires": [
        {
          "id": "w2_1",
          "pts": [
            {
              "x": 90,
              "y": 60
            },
            {
              "x": 90,
              "y": 80
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w2_2",
          "pts": [
            {
              "x": 110,
              "y": 60
            },
            {
              "x": 110,
              "y": 80
            }
          ],
          "kind": "phase_l2"
        },
        {
          "id": "w2_3",
          "pts": [
            {
              "x": 130,
              "y": 60
            },
            {
              "x": 130,
              "y": 80
            }
          ],
          "kind": "phase_l3"
        },
        {
          "id": "w2_4",
          "pts": [
            {
              "x": 150,
              "y": 60
            },
            {
              "x": 150,
              "y": 170
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w2_5",
          "pts": [
            {
              "x": 170,
              "y": 60
            },
            {
              "x": 170,
              "y": 350
            },
            {
              "x": 150,
              "y": 350
            }
          ],
          "kind": "pe"
        },
        {
          "id": "w2_6",
          "pts": [
            {
              "x": 90,
              "y": 120
            },
            {
              "x": 90,
              "y": 170
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w2_7",
          "pts": [
            {
              "x": 110,
              "y": 120
            },
            {
              "x": 110,
              "y": 170
            }
          ],
          "kind": "phase_l2"
        },
        {
          "id": "w2_8",
          "pts": [
            {
              "x": 130,
              "y": 120
            },
            {
              "x": 130,
              "y": 170
            }
          ],
          "kind": "phase_l3"
        },
        {
          "id": "w2_9",
          "pts": [
            {
              "x": 90,
              "y": 130
            },
            {
              "x": 190,
              "y": 130
            },
            {
              "x": 190,
              "y": 120
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w2_10",
          "pts": [
            {
              "x": 110,
              "y": 140
            },
            {
              "x": 210,
              "y": 140
            },
            {
              "x": 210,
              "y": 120
            }
          ],
          "kind": "phase_l2"
        },
        {
          "id": "w2_11",
          "pts": [
            {
              "x": 130,
              "y": 150
            },
            {
              "x": 230,
              "y": 150
            },
            {
              "x": 230,
              "y": 120
            }
          ],
          "kind": "phase_l3"
        },
        {
          "id": "w2_12",
          "pts": [
            {
              "x": 190,
              "y": 160
            },
            {
              "x": 190,
              "y": 180
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w2_13",
          "pts": [
            {
              "x": 210,
              "y": 160
            },
            {
              "x": 210,
              "y": 180
            }
          ],
          "kind": "phase_l2"
        },
        {
          "id": "w2_14",
          "pts": [
            {
              "x": 230,
              "y": 160
            },
            {
              "x": 230,
              "y": 180
            }
          ],
          "kind": "phase_l3"
        },
        {
          "id": "w2_15",
          "pts": [
            {
              "x": 150,
              "y": 100
            },
            {
              "x": 250,
              "y": 100
            },
            {
              "x": 250,
              "y": 240
            },
            {
              "x": 150,
              "y": 240
            },
            {
              "x": 150,
              "y": 230
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w2_16",
          "pts": [
            {
              "x": 190,
              "y": 220
            },
            {
              "x": 190,
              "y": 240
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w2_17",
          "pts": [
            {
              "x": 210,
              "y": 220
            },
            {
              "x": 210,
              "y": 240
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w2_18",
          "pts": [
            {
              "x": 230,
              "y": 220
            },
            {
              "x": 230,
              "y": 240
            }
          ],
          "kind": "neutral"
        },
        {
          "id": "w2_19",
          "pts": [
            {
              "x": 90,
              "y": 230
            },
            {
              "x": 90,
              "y": 260
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w2_20",
          "pts": [
            {
              "x": 110,
              "y": 230
            },
            {
              "x": 110,
              "y": 260
            }
          ],
          "kind": "phase_l2"
        },
        {
          "id": "w2_21",
          "pts": [
            {
              "x": 130,
              "y": 230
            },
            {
              "x": 130,
              "y": 260
            }
          ],
          "kind": "phase_l3"
        },
        {
          "id": "w2_22",
          "pts": [
            {
              "x": 90,
              "y": 320
            },
            {
              "x": 90,
              "y": 350
            }
          ],
          "kind": "phase"
        },
        {
          "id": "w2_23",
          "pts": [
            {
              "x": 110,
              "y": 320
            },
            {
              "x": 110,
              "y": 350
            }
          ],
          "kind": "phase_l2"
        },
        {
          "id": "w2_24",
          "pts": [
            {
              "x": 130,
              "y": 320
            },
            {
              "x": 130,
              "y": 350
            }
          ],
          "kind": "phase_l3"
        }
      ]
    }
  ],
  "activePageIndex": 0
};
