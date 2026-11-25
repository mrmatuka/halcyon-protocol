# Adatmodell specifikáció (F2.1)

Forrás: [story-design.md](story-design.md) (jóváhagyva) és a F2-höz hozott döntések. A típusokat `zod` sémák adják (`src/engine/schema.ts`), a TypeScript típusok ezekből származnak (`z.infer`). Minden példa kódja és azonosítója ékezet nélküli, a megjelenő szövegek magyarok.

## 0. Döntések

| Téma                  | Döntés                                                                                                                                                                                                                                       | Forrás                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Runtime validátor     | `zod`                                                                                                                                                                                                                                        | felhasználó                                                  |
| Próba helye           | Mindig egy **választáshoz** tartozik; a játékos rákattint, ekkor dob. A sikeres és sikertelen ágnak külön hatása és célja van. Ahol nincs valódi választás (N03, N11, N14, N15), egy „Tovább / Próbát teszek" gomb van (egyetlen választás). | felhasználó                                                  |
| Feltétel nem teljesül | A választás **rejtett**                                                                                                                                                                                                                      | felhasználó                                                  |
| Tartalom fájlai       | `content/heroes.json`, `content/items.json`, `content/nodes.json`                                                                                                                                                                            | felhasználó                                                  |
| Navigáció             | Nem `Effect`, hanem a választás (vagy a próba ágának) `target` mezője                                                                                                                                                                        | tervezői döntés: a terv F2.5-ös „ugrás" eleme így egyszerűbb |
| Befejezés             | `StoryNode` egy fajtája (`kind: "ending"`), nem külön entitás                                                                                                                                                                                | tervezői döntés                                              |
| Halál                 | Életerő 0 → a motor a `deathEndingId` csomópontra ugrik (D1)                                                                                                                                                                                 | story-design.md                                              |

> [!NOTE]
> A „tervezői döntés" jelölésű pontok az én javaslataim, a felhasználó nem döntött róluk. Módosíthatók.

## 1. Azonosítók és alaptípusok

- `Id`: `^[a-z][a-z0-9_]*$` (pl. `n01_leszallas`, `mara_lie`). Egy entitástípuson belül egyedi.
- `Stat`: `reflex | technika | kitartas | szerencse | eletero`.
- `CheckStat` (próbázható): `reflex | technika | kitartas | szerencse`. Az `eletero` nem próbázható.
- Statértékek egész számok, `≥ 0`.

## 2. Hero (`heroes.json`: `Hero[]`)

```
Hero {
  id: Id
  name: string (nem üres)
  role: string
  description: string
  stats: { reflex, technika, kitartas, szerencse, eletero }   // kezdőértékek, mind egész ≥ 0, eletero ≥ 1
  card: Card
}

Card {
  id: Id
  name: string
  description: string
  options: CardOption[]   // legalább 1; a játékos az egyiket választja használatkor
}

CardOption =
  | { type: "autoSuccess", stats: CheckStat[] (≥1), choiceIds?: Id[] }   // egy próba automatikus siker
  | { type: "reroll", stats: CheckStat[] (≥1) }                          // egy sikertelen próba újradobása
  | { type: "heal", amount: egész > 0 }                                  // életerő-gyógyítás a maximumig
```

- A kártya **egyszer** használható egy játékban (az állapotban `cardUsed`).
- `choiceIds`: ha meg van adva, az `autoSuccess` csak ezeken a választásokon használható.
- `maxHp` = a hős kezdő `eletero` értéke.

Hősök a story-design.md szerint: Vass Dóra, Kő Bence, Dr. Imre Lili. A tényleges tartalom az F6-ban készül.

## 3. Item (`items.json`: `Item[]`)

```
Item {
  id: Id
  name: string
  description: string
  modifiers?: Modifier[]
}

Modifier { stat: CheckStat, delta: nem nulla egész, nodeId?: Id }   // nodeId: csak abban a csomópontban érvényes
```

Példa: Hőpatron: `{ stat: "reflex", delta: 1, nodeId: "n14_zarlat" }`.

A módosítók **alkalmazása** a próbakiértékelésben (`2d6 ≤ tulajdonság + módosító`) az F3.3-ban készül, F2-ben csak az adat és a validáció.

## 4. Condition

```
Condition =
  | { type: "hasItem", itemId: Id }
  | { type: "flag", flag: Id, value?: boolean }            // value alapértéke true; ismeretlen/beállítatlan flag = false
  | { type: "statAtLeast", stat: Stat, value: egész ≥ 0 }
  | { type: "all", conditions: Condition[] (≥1) }
  | { type: "any", conditions: Condition[] (≥1) }
  | { type: "not", condition: Condition }
```

Kiértékelés: `evaluateCondition(condition, state): boolean`, tiszta függvény.

## 5. Effect

```
Effect =
  | { type: "changeStat", stat: Stat, delta: nem nulla egész }
  | { type: "addItem", itemId: Id }
  | { type: "removeItem", itemId: Id }
  | { type: "setFlag", flag: Id, value?: boolean }          // alapérték true
```

Alkalmazás: `applyEffect(state, effect): GameState` és `applyEffects(state, effects)`, **tiszta** (a bemenet nem változik).

Szabályok (tervezői döntések, a felhasználó nem jelezte):

- `eletero` mindig `[0, maxHp]` között marad.
- A többi stat alsó határa `0`, felső határ nincs.
- `addItem` meglévő tárgyra és `removeItem` hiányzó tárgyra nem csinál semmit.
- Az életerő 0-ra csökkenése miatti halál-átirányítás **nem** az effekt dolga, hanem a motoré (F3.7).

## 6. StoryNode és Choice (`nodes.json`)

```
Story {
  startNodeId: Id
  deathEndingId: Id          // a kihűlés befejezés (D1) csomópontja
  nodes: StoryNode[]         // legalább 1
}

StoryNode =
  | { kind: "scene",  id: Id, title: string, text: string, choices: Choice[] (≥1) }
  | { kind: "ending", id: Id, title: string, text: string, endingType: "victory" | "death" }

Choice =
  | SimpleChoice
  | CheckedChoice

SimpleChoice  { id: Id, text: string, condition?: Condition, effects?: Effect[], target: Id }
CheckedChoice { id: Id, text: string, condition?: Condition, check: { stat: CheckStat },
                success: Outcome, failure: Outcome }

Outcome { effects?: Effect[], target: Id }
```

- A `nodes.json` szerkezete: `Story`.
- A `choice.id` az egész történetben egyedi (a kártya `choiceIds` és a tesztek miatt).
- Az `ending` csomópontnak nincs `choices` mezője (a séma szigorú, `strict`).
- Rejtett választás: ha a `condition` nem teljesül, a választás nem jelenik meg (F3.5).
- A story-design.md „nem-halál" befejezései `victory`, a halálok `death` típusúak. (Az E1 „Néma menekülés" is `victory` típus, mert nem halál. Az elnevezés a „nem-halál" rövidítése.)

## 7. GameState

```
GameState {
  heroId: Id
  nodeId: Id
  stats: { reflex, technika, kitartas, szerencse, eletero }   // aktuális értékek
  maxHp: egész ≥ 1
  items: Id[]               // egyedi elemek
  flags: Record<Id, boolean>
  cardUsed: boolean
  endingId: Id | null       // nem null, ha a játék véget ért
}
```

A `rngState` mező és a mentési `version` az F3.1 / F3.8-ban kerül hozzá (a RNG és a szerializálás határozza meg a formájukat).

## 8. Tartalom-validáció (két réteg)

1. **Séma** (zod): minden fájl önmagában szerkezetileg helyes.
2. **Hivatkozások** (`validateContent`): a három fájl együtt konzisztens. A hibák listát adnak `{ path, message }` alakban, magyar üzenettel, az érintett azonosítóval.

Hivatkozás-szabályok:

- Hős-, tárgy-, csomópont- és választás-azonosítók egyediek.
- `startNodeId` és `deathEndingId` létező csomópontra mutat; a `deathEndingId` csomópontja `ending`, `endingType: "death"`.
- Minden `target` létező csomópont.
- Minden `itemId` (feltételben, effektben) létező tárgy; a `Modifier.nodeId` és a `CardOption.choiceIds` létező csomópontra/választásra mutat.
- A flag-ek azonosítóit nem kell előre deklarálni.

A gráf-szintű elemzés (elérhetetlen csomópontok, holtpontok) az F8.1 feladata, nem az F2-é.

## 9. JSON Schema

A zod sémákból `z.toJSONSchema()` állítja elő a `content/schema/*.schema.json` fájlokat (szerkesztői támogatáshoz és az AI-eszközöknek). Generálás: `npm run schema`. Teszt ellenőrzi, hogy a fájlok naprakészek.
