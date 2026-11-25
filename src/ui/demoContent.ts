import type { Content } from '../engine/validate';

/**
 * Ideiglenes bemutató tartalom az F6 (teljes történetgráf JSON) elkészültéig.
 */
export const demoContent: Content = {
  heroes: [
    {
      id: 'dora',
      name: 'Vass Dóra',
      role: 'Mérnök',
      description: 'Technikai specialista, nyugodt kézzel nyúl a hibás reaktorokhoz is.',
      stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
      card: {
        id: 'rovidzar',
        name: 'Rövidzár',
        description: 'Egy Technika-próba automatikus siker.',
        options: [{ type: 'autoSuccess', stats: ['technika'] }],
      },
    },
    {
      id: 'bence',
      name: 'Kő Bence',
      role: 'Biztonsági tiszt',
      description: 'Strapabíró ex-katona, aki inkább bízik a reflexeiben, mint a gépekben.',
      stats: { reflex: 9, technika: 6, kitartas: 10, szerencse: 7, eletero: 16 },
      card: {
        id: 'adrenalin',
        name: 'Adrenalin',
        description: 'Egy sikertelen Reflex- vagy Kitartás-próba újradobása.',
        options: [{ type: 'reroll', stats: ['reflex', 'kitartas'] }],
      },
    },
    {
      id: 'lili',
      name: 'Dr. Imre Lili',
      role: 'Orvos, xenobiológus',
      description: 'Hideg fejű kutató, akinek a szerencséje legendás.',
      stats: { reflex: 8, technika: 8, kitartas: 7, szerencse: 10, eletero: 12 },
      card: {
        id: 'stimulator',
        name: 'Stimulátor',
        description: '+5 Életerő (a maximumig).',
        options: [{ type: 'heal', amount: 5 }],
      },
    },
  ],
  items: [
    {
      id: 'hopatron',
      name: 'Hőpatron',
      description: 'Kémiai melegítő. +1 Reflex próbamódosító a zárlatnál.',
      modifiers: [{ stat: 'reflex', delta: 1, nodeId: 'n02_zarlat' }],
    },
  ],
  story: {
    startNodeId: 'n01_leszallas',
    deathEndingId: 'd1_kihules',
    nodes: [
      {
        kind: 'scene',
        id: 'n01_leszallas',
        title: 'Leszállás az Ébenholdon',
        text: 'Rigó leteszi a Kestrelt a jégmező szélén. A Halcyon állomás vészjeladója még mindig sugároz a −160 °C-os sötétben.',
        choices: [
          {
            id: 'c_zsilip',
            text: 'Belépsz a főzsilipen',
            effects: [{ type: 'addItem', itemId: 'hopatron' }],
            target: 'n02_zarlat',
          },
        ],
      },
      {
        kind: 'scene',
        id: 'n02_zarlat',
        title: 'Folyosózárlat',
        text: 'MÁRA udvarias hangja szólal meg: „Az Aurum Biotech értékeli a türelmét." A légzsilip vésznyitója villogni kezd.',
        choices: [
          {
            id: 'c_menekul',
            text: 'Átveted magad a záródó zsilipen (Reflex próba)',
            check: { stat: 'reflex' },
            success: { target: 'e1_menekules' },
            failure: {
              effects: [{ type: 'changeStat', stat: 'eletero', delta: -4 }],
              target: 'd2_vakuum',
            },
          },
        ],
      },
      {
        kind: 'ending',
        id: 'e1_menekules',
        title: 'Néma menekülés',
        text: 'Eléred a Kestrelt. Rigó felpörgeti a hajtóművet, és magatok mögött hagyjátok a fagyos holdat.',
        endingType: 'victory',
      },
      {
        kind: 'ending',
        id: 'd1_kihules',
        title: 'Kihűlés',
        text: 'A ruha fűtése leállt. A hideg csendesen elnyel mindent.',
        endingType: 'death',
      },
      {
        kind: 'ending',
        id: 'd2_vakuum',
        title: 'Kiszellőztetve',
        text: 'A külső ajtó hamarabb nyílik ki, mint ahogy a kapaszkodót elérnéd.',
        endingType: 'death',
      },
    ],
  },
};
