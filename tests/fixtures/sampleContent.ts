import type { Hero, Item, Story } from '../../src/engine/schema';

export const sampleHeroes: Hero[] = [
  {
    id: 'dora',
    name: 'Vass Dóra',
    role: 'Mérnök',
    description: 'Tesztmérnök.',
    stats: { reflex: 7, technika: 10, kitartas: 8, szerencse: 8, eletero: 12 },
    card: {
      id: 'rovidzar',
      name: 'Rövidzár',
      description: 'Egy Technika-próba automatikus siker.',
      options: [{ type: 'autoSuccess', stats: ['technika'] }],
    },
  },
];

export const sampleItems: Item[] = [
  {
    id: 'hopatron',
    name: 'Hőpatron',
    description: 'Fűti a kezed.',
    modifiers: [{ stat: 'reflex', delta: 1, nodeId: 'n02_zarlat' }],
  },
  { id: 'kartya', name: 'Parancsnoki kártya', description: 'Nyitja az ajtókat.' },
];

export const sampleStory: Story = {
  startNodeId: 'n01_start',
  deathEndingId: 'd1_kihules',
  nodes: [
    {
      kind: 'scene',
      id: 'n01_start',
      title: 'Kezdet',
      text: 'Leszállsz.',
      choices: [
        {
          id: 'c_bemegy',
          text: 'Bemész',
          effects: [{ type: 'addItem', itemId: 'hopatron' }],
          target: 'n02_zarlat',
        },
      ],
    },
    {
      kind: 'scene',
      id: 'n02_zarlat',
      title: 'Zárlat',
      text: 'Lezár az ajtó.',
      choices: [
        {
          id: 'c_fut',
          text: 'Futsz',
          check: { stat: 'reflex' },
          success: { effects: [{ type: 'setFlag', flag: 'ment' }], target: 'e1_siker' },
          failure: {
            effects: [{ type: 'changeStat', stat: 'eletero', delta: -3 }],
            target: 'd2_vakuum',
          },
        },
        {
          id: 'c_kartya',
          text: 'Kártyával nyitod',
          condition: { type: 'hasItem', itemId: 'kartya' },
          target: 'e1_siker',
        },
      ],
    },
    { kind: 'ending', id: 'e1_siker', title: 'Siker', text: 'Élsz.', endingType: 'victory' },
    { kind: 'ending', id: 'd1_kihules', title: 'Kihűlés', text: 'Meghalsz.', endingType: 'death' },
    {
      kind: 'ending',
      id: 'd2_vakuum',
      title: 'Vákuum',
      text: 'Kiszellőztetve.',
      endingType: 'death',
    },
  ],
};
