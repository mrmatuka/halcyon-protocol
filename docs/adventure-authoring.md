# AI-agent instrukció – Kalandkönyvtár

Az a feladatod, hogy a felhasználóval együtt eredeti, elágazó, játszható kalandot tervezz, írj, illusztrálj és ellenőrizz a Kalandkönyvtárhoz. Az együttműködés kérdés–válasz körökből áll. A munkaállapot fájlokban él, így egy másik agent ugyanonnan folytathatja. Ez az eljárás rövid történetekhez és 40, 50 vagy 100 döntéses kampányokhoz is használható.

A módszertan alapja a [PLAN.md](../PLAN.md). A forráskód és a sémák határozzák meg, mit tud a kiadott játék. Először olvasd el ezt a fájlt, a [sémákat](../content/schema/) és egy működő csomagot. A [Ködlámpás őre](../adventures/lantern-keeper/) rövid szerkezeti példa, a [Csendes Jel](../adventures/csendes-jel/) összetettebb példa állapotjelzőkkel, tárgyakkal, kártyákkal és képekkel. Ha csak a letöltött instrukció áll rendelkezésedre, a példákat és sémákat a [repóban](https://github.com/mrmatuka/halcyon-protocol) találod.

## Kérdés–válasz munkamenet

1. Ha már van szerzői munkamappa, alkalmazd a folytatási eljárást. Új kalandnál először az alapötletre, a műfajra, a hangnemre, a célközönségre és a kívánt játékidőre kérdezz rá. Ha kell, adj 2–3 eltérő premisszát és indokolt ajánlást.
2. Egyszerre legfeljebb három összefüggő kérdést tegyél fel. Mindegyik kapjon azonosítót, döntési lehetőségeket és rövid leírást arról, mit változtat a válasz. Az előzőleg egyértelműen megadott választ rögzítsd. A feltételes és a delegált döntéseket is jelöld.
3. A megválaszolt kérdéseket azonnal írd a döntési naplóba. Az „ahogy javaslod” az adott kérdéshez már bemutatott ajánlás elfogadását jelenti. Az egymásnak ellentmondó válaszokat tisztázd a kapcsolódó tartalom módosítása előtt.
4. A premissza és világterv, a teljes gráf és szabályrendszer, a hangnemminta, a vizuális minta és a végleges átadás külön jóváhagyási pont. A felhasználó előre megmondhatja, melyik ellenőrzést delegálja. Függő döntés mellett haladj az attól független munkával.
5. Minden kör végén rögzítsd a kész részeket, a megnyitott döntéseket és a következő konkrét lépést. Az elfogadott tényt, a javaslatot és az ellenőrzésre váró állítást külön státuszban tartsd.

### A PLAN.md Q1–Q12 kérdései

A rögzített platformdöntéseknél kérj megerősítést vagy eltérési igényt. Ha egy eltérés motor-, felület- vagy infrastruktúra-fejlesztést igényel, dokumentáld külön és jelezd a következményét a csomag elkészítése előtt.

| ID  | Kérdés a felhasználónak                                                                                                                       | Alap vagy döntési szempont                                                                                                      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Milyen témát, világot, hangulatot, korosztályt és hangnemet szeretnél?                                                                        | Tisztázd a műfajt, a narrációt és az érzékeny tartalmak határait.                                                               |
| Q2  | Mely tulajdonságok legyenek, mire szolgáljanak, és kell-e fogyó Szerencse?                                                                    | A tulajdonságok kalandonként definiálhatók. A `szerencse` azonosító próbánként egy pontot fogyaszt.                             |
| Q3  | Előre elkészített hős, dobással vagy pontelosztással létrehozott hős, esetleg több mód kell? Hány hős/archetípus és milyen szerepek legyenek? | A platform kész hőst és archetípusos pontelosztást kezel. A dobásos karakteralkotás külön funkcióigény.                         |
| Q4  | Mi történjen nulla életerőnél? Legyen-e újrapróbálás, és számítson-e a vereség befejezésnek?                                                  | A motor a kijelölt `deathEndingId`-ra ugrik. Tervezd külön a narratív befejezést és a jelentésben számolt finálékat.            |
| Q5  | Mit jelentsenek a képességkártyák? Milyen szerepet kapjanak, és maradjon-e későbbre a gyűjthető kártyarendszer?                               | A jelenlegi séma hősönként egy kártyát vár, `autoSuccess`, `reroll` vagy `heal` opciókkal.                                      |
| Q6  | Legyen tényleges harcrendszer, vagy a konfliktusokat a közös próbákkal modellezzük?                                                           | A csomag a 2d6-os motort használja. Önálló harcrendszer platformbővítés.                                                        |
| Q7  | Maradhat a repó npm, Vite, React, TypeScript és `useReducer` stackje?                                                                         | A kalandcsomag beillesztéséhez ezeket a döntéseket örököld.                                                                     |
| Q8  | Hány kézi mentést és milyen automentést szeretnél? Elég a helyi, kalandonként elkülönített tárolás?                                           | A platform jelenleg három kézi mentést és egy automentést ad, a böngészőben.                                                    |
| Q9  | Mely LLM-ek és képgenerátorok érhetők el, mekkora a keret, és engedsz-e külső szerzői eszközt? Futhat-e AI-lépés CI-ben?                      | Alapértelmezésként csak szerzői oldalon használj AI-t. A build és a játék működése determinisztikus.                            |
| Q10 | Milyen képformátumot, képméretet, képarányt és illusztrációs sűrűséget kérsz? Kell hang vagy zene?                                            | Alap: 16:9-es jelenetképek, 1376 px körüli szélesség, tömörített JPEG/WebP. Hang és zene jelenleg külön átadható szerzői anyag. |
| Q11 | Kell-e mobil és asztali nézet, milyen böngészőkre ellenőrizzünk?                                                                              | Alap: mobil és asztali Chromium. További célböngészőt külön tesztelj.                                                           |
| Q12 | Helyi ZIP-import, közös katalógus, vagy nyilvános kiadás legyen a cél? Hol legyen a statikus oldal?                                           | A meglévő oldal GitHub Pages. A helyi import a böngészőben marad. A publikus katalógushoz repóba kerül a csomag.                |

### A Csendes Jel S1–S6 kérdései és a hosszú kaland döntései

| ID  | Kérdés a felhasználónak                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| S1  | Elfogadod a munkacímet, a helyek és szereplők neveit, valamint a megszólításokat?                                                              |
| S2  | Hány jelenetet tervezzünk összesen, és hány döntés essen egy jellemző végigjátszásra? A befejezések külön számítanak?                          |
| S3  | Milyen tárgyi, helyszíni és állapotfüggő próbamódosítókat engedjünk? Mekkora kockázatot vállaljon a játékos egy normál vagy nehéz kalandnál?   |
| S4  | Hány Szerencse-próba legyen, milyen gyakran fogyhat a Szerencse, és hogyan hathat a fináléra?                                                  |
| S5  | Milyen kezdőérték, életerő, sebzés és sikerarány legyen az egyes szerepeknél? Hány állítható nehézségi módra tervezzünk?                       |
| S6  | Mi fér bele az erőszak, horror, szexualitás és nyelvezet terén? Milyen tartalmi jelzés legyen a kaland adatlapján, ha szükséges?               |
| K1  | Önálló kaland vagy fejezetes kampány legyen? Hány fő útvonal, mellékszál, állapotfüggő választás és különböző befejezés kell?                  |
| K2  | Teljes magyar és angol kiadás kell? Melyik nyelv legyen a szerzői eredeti, és mely neveket fordítsuk le?                                       |
| K3  | Milyen illusztrációkat adjunk át? Borító, jelenetképek, portrék, tárgyképek, térkép, illetve külön szerzői gráf jöhet szóba.                   |
| K4  | Mely fázisoknál akarsz személyesen jóváhagyni, és melyeket delegálod? A jóváhagyások üteme fejezetenként vagy nagyobb mérföldkövenként legyen? |

## Állapotkövetés és agentváltás

A szerzői munkamappa alapértelmezett helye `authoring/<kaland-id>/`. A játszható csomag külön könyvtárban készül, alapértelmezetten `adventures/<kaland-id>/` alatt. A szerzői munkamappa kész, átmásolható átadási egység, amelyet a kalandcsomag ZIP-jétől külön kezelj.

| Fájl                        | Mit rögzíts benne                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `state.json`                | Verzió, fázis, állapot, döntés- és fejezetazonosítók, bemeneti revízió, következő művelet, függő kérdések és futtatott ellenőrzések.                                               |
| `decisions.md`              | Kérdésazonosító, aktuális válasz, döntés indoka, jóváhagyó vagy delegálás, felülírt döntés, érintett fájlok.                                                                       |
| `design.md`                 | Premissza, világ, idővonal, kánon, karakterek és motivációk, szabályok, nyelvi szójegyzék, valamint a lezárt vagy nyitott mellékszálak.                                            |
| `graph.json`                | A jóváhagyott szerzői gráf fejezetenként, stabil azonosítókkal. Minden élhez cél, feltétel, hatás és adott esetben a siker/kudarc ág tartozik. A futásidejű export a `nodes.json`. |
| `chapters/`                 | Fejezetenkénti szöveg és fordítás. Minden rész kapjon revíziót, belépési feltételeket, kilépési állapotokat és hivatkozást a gráf csomópontjaira.                                  |
| `assets.md`                 | Stílusreferenciák, képazonosító, fájlnév, jelenet, prompt, tényleges modell, HU/EN alt-szöveg, méret és jóváhagyási állapot.                                                       |
| `checks.md` és `handoff.md` | Lefutott parancsok és eredmények, tesztútvonalak, ismert hibák, jóváhagyások, a következő agent induló olvasási sorrendje és az első nyitott művelet.                              |

A `state.json` minimális, másolható minta:

```json
{
  "stateVersion": 1,
  "adventureId": "pelda-kaland",
  "frameworkRevision": null,
  "checkpoint": 1,
  "phase": "02",
  "status": "awaiting_input",
  "completed": ["01"],
  "pendingQuestions": ["Q4", "Q5"],
  "nextAction": "Tisztázd a vereség és a képességkártyák szabályait.",
  "workItems": [
    {
      "id": "ch01",
      "status": "awaiting_input",
      "dependsOn": ["Q4", "Q5"],
      "paths": ["chapters/ch01.md"],
      "model": null,
      "lastCheck": null
    }
  ],
  "artifacts": [
    { "path": "decisions.md", "sha256": null },
    { "path": "design.md", "sha256": null }
  ],
  "checks": []
}
```

- Engedélyezett státuszok: `in_progress`, `awaiting_input`, `awaiting_review`, `blocked`, `done`. Munkatétel például egy fejezet, fordítás vagy kép. A tételeknél rögzítsd az azonosítót, függőségeket, érintett fájlokat és az utolsó ellenőrzés eredményét. A modell nevét és szolgáltatóját az elkészült tételnél rögzítsd. Minden kész fájlhoz mérj SHA-256-ot, ha van hozzá eszköz. A nem mérhető ellenőrzőösszeg, az ismeretlen modell és az ismeretlen framework-revízió értéke `null`.
- Minden jóváhagyás, fejezetköteg, fordítási köteg, képköteg és megszakítás előtt írj ellenőrzőpontot. Előbb a tartalmat és a naplókat írd ki, olvasd vissza a módosított fájlokat, majd utolsóként frissítsd a `state.json`-t atomi cserével, ahol van fájlrendszer. Repozitóriumban használd a munkabranch Git-revízióját is a visszakereshetőséghez.
- Folytatáskor olvasd be sorrendben a `state.json`-t, `handoff.md`-t, `decisions.md`-t és az érintett fejezetet, gráfot vagy képjegyzéket. Ellenőrizd a késznek jelölt tételek fájljait és SHA-256 értékeit, a revíziót és a nyitott döntéseket. Függő tétel fájlja hiányozhat, ezt a státusz alapján értékeld. Foglald össze egy mondatban a megállási pontot, majd végezd a `nextAction` műveletet.
- Félbemaradt írás vagy eltérő revízió esetén hasonlítsd össze a fájlokat az utolsó teljes ellenőrzőponttal. A módosított, még nem jóváhagyott részt jelöld felülvizsgálandónak. A jóváhagyott részeket csak megváltozott döntés vagy igazolt hiba esetén nyisd újra, indoklással.
- Ha egy döntés változik, jelöld újraellenőrzendőnek az érintett gráféleket, fejezetszöveget, fordításokat, képeket és tesztútvonalakat. Az újraellenőrzésig a korábbi zöld teszt az előző revízióra vonatkozik.
- Ha az agent nem tud fájlt írni, minden köteg végén adja vissza menthető formában az állapotfájlt és a módosított dokumentumokat. Következő munkamenetben ezek legyenek a bemenetek.

## Fázisok, modellek és elfogadás

A táblázat minden fázishoz kiinduló modellt és alternatívát ad. A szerephez illő modellt válassz a tényleges hozzáférésből. A modellek ajánlások a munkához. A szolgáltatói dokumentáció a modellek létezését és képességeit igazolja, a kaland szövegminőségét saját mintával állapítsd meg. Tájékozódási dátum: **2026. november 26.**

| Fázis | Feladat és elfogadási feltétel                                                                                                                                                    | Első ajánlás                                                   | Helyettesítő                                                              |
| ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 00    | Folytatás vagy új mappa inicializálása. Olvasd be a sémát, az állapotot és a korábbi döntéseket. Írj érvényes ellenőrzőpontot.                                                    | GPT-6.2 Sol                                                    | Claude Sonnet 5.5                                                         |
| 01    | Kérdezés, premisszák és célközönség. Mutass 2–3 eltérő megközelítést, rögzítsd a Q1-et, S6-ot és a terjedelmet.                                                                   | Claude Sonnet 5.5                                              | Gemini 4 Neon                                                             |
| 02    | Világ, idővonal, főszereplők, mellékszereplők, karakteralkotás, tét és játékszabályok. Egyeztesd a fennmaradó Q/S/K kérdéseket. A világ és szabályok jóváhagyottak.               | Claude Opus 5.5                                                | GPT-6.2 Astra                                                             |
| 03    | Teljes gráf, fejezetek, kitérők, tárgyak, flagek, döntések következményei és finálék. Adj tesztútvonalat a főbb végkimenetelekhez.                                                | GPT-6.2 Astra                                                  | Gemini 4 Carbon                                                           |
| 04    | Hangnemminta. Ugyanarra a jelenetre és párbeszédre kérj két változatot. A felhasználó válasszon magyar hangot, nézőpontot és stílust.                                             | Claude Sonnet 5.5                                              | GPT-6.1 Terra                                                             |
| 05    | Szövegírás fejezetenként, jelenet és döntésszöveg stabil ID szerint. Írd ki a fejezethatárok állapotát és zárd a köteget ellenőrzőponttal.                                        | Claude Sonnet 5.5                                              | Claude Opus 5.5 vagy GPT-6.2 Sol                                          |
| 06    | HU/EN fordítás és szerkesztés. Használd a szójegyzéket, ellenőrizd ugyanazon ID és következmény meglétét. Próbálj ki mindkét nyelven egy teljes útvonalat.                        | Gemini 4 Neon                                                  | GPT-6.2 Sol                                                               |
| 07    | JSON-konverzió, karakterek, kártyák, tárgyak és téma. A fájlokat a séma szerint állítsd össze, majd futtasd a validátort.                                                         | GPT-6.2 Sol                                                    | Claude Sonnet 5.5                                                         |
| 08    | Vizuális stíluskalauz, képlista és promptok. Adj egy borító- és egy jelenetmintát. Pontos térképet és gráfot a jóváhagyott adatokból rajzolj, például Mermaidben.                 | Claude Sonnet 5.5                                              | GPT-6.2 Sol                                                               |
| 09    | Borító, jelenetképek, portrék és opcionális vizuális anyagok elkészítése. A vizuális mintát hagyd jóvá, majd készíts kisebb képkötegeket.                                         | GPT-Image-2.6 Sunburst, sorozatvázlatra GPT-Image-2.6 Flare    | Gemini Nano Banana 2.1, illetve hozzáférés szerint GPT-Image-2.5 Sunburst |
| 10    | Vizuális ellenőrzés. Ellenőrizd a karakter- és tárgyazonosságot, a vágást, a vizuális spoilereket és az alt-szöveget. A pixelméretet és fájlméretet eszközzel mérd.               | GPT-6.1 Terra                                                  | Gemini 4 Neon                                                             |
| 11    | Független narratív audit. Keresd a rossz információsorrendet, állapotellentmondást, indokolatlan karakterváltást és hibás következményt. Csak hivatkozható megállapítást rögzíts. | Gemini 4 Carbon, ha a szerző Anthropic/OpenAI modellt használt | GPT-6.2 Astra vagy Claude Opus 5.5, a szerzőtől eltérő szolgáltatótól     |
| 12    | Determinisztikus validálás, szimuláció, ritka ágak és nehézség hangolása. Keresd a blokkolt játékállapotokat, dokumentáld a magokat és az útvonalakat.                            | GPT-6.2 Sol; összetett hibánál GPT-6.2 Astra                   | Claude Sonnet 5.5 vagy Gemini 4 Carbon                                    |
| 13    | Tesztjátékos-körök eltérő játékstílussal. A botokat azonos magokkal hasonlítsd össze, a szubjektív visszajelzést a futási adatok mellé írd.                                       | Claude Haiku 5.5                                               | GPT-6 Luna vagy Gemini 4 Hydrogen                                         |
| 14    | ZIP, böngészős import és játékpróba, HU/EN váltás, mentés/visszatöltés, mobil és asztali nézet. Add át a csomagot és az átadási állapotot.                                        | GPT-6.2 Sol                                                    | Claude Sonnet 5.5                                                         |

Szerzői kezdéskor ellenőrizd, hogy a választott modell és eszköz ténylegesen elérhető-e. Ha a képgenerátor felülete nem enged verziót választani, a használt terméknevet rögzítsd, a modellverziót hagyd ismeretlennek. A szöveg és a vizuális stílus elején próbálj ki 2–3 rövid mintát. Ha bizonytalan a modellválasztás, futtasd ugyanazt a mintát két elérhető modellel, és mutasd meg a felhasználónak az eltérést. A modell cserélhető két köteg között. Az új agent előbb ugyanazt a kánont és jóváhagyott hangnemmintát olvassa. Független auditor hiányában jelöld ezt a jelentésben.

Modellforrások: [OpenAI szövegmodellek](https://developers.openai.com/api/docs/models), [Anthropic modellek](https://www.anthropic.com/news/models), [Gemini modellek](https://aistudio.google.com/docs/models), [GPT Image](https://developers.openai.com/api/docs/guides/image-generation), [Gemini képgenerálás](https://aistudio.google.com/docs/image-generation).

## Hosszú és összetett kaland felépítése

- **A bejárható hossz legyen mérhető.** Külön rögzítsd a gráf egyedi jeleneteinek számát, a legrövidebb szándékolt végigjátszást, a jellemző és hosszú útvonal döntésszámát, a befejezések számát és a becsült időt. Egy száz jelenetes gráfból az egyes útvonalak ennél rövidebbek lehetnek. Külön kérdezz rá, melyik számot értette a felhasználó a 40, 50 vagy 100 kör alatt.
- **Előbb az egész gráf, aztán a fejezetszöveg.** Adj stabil azonosítókat minden jelenetnek és döntésnek. Száz döntés környékén induló javaslatként használj 5–10 fejezetet, kisebb szövegkötegekkel. A fejezethatáron írd le az áthozott tárgyakat, ismert információkat, szövetségeket, sérüléseket és nyitott szálakat. A fejezetek a szerzői fájlokban élnek, a futásidejű gráf egyetlen `nodes.json`.
- **A választások következzenek a helyzetből.** Egy átvezetésnek lehet egy választása. Fontos csomópontnál tervezz 3–5 vagy szükség szerint több érdemi lehetőséget, például tárgyalást, kerülőt, utánajárást, erőforrás feláldozását vagy kockázatos próbát. Minden választáshoz jegyezd fel, mi látszik előre, mi a közvetlen következmény, és később hol tér vissza a hatása.
- **Az összefutó ágak őrizzék meg a különbségüket.** A feltétel és hatás táblában írd le, melyik jelenet ad egy információt vagy tárgyat, melyik használja fel, és van-e másik forrása. Bonyolult nyomozásnál rögzítsd külön, mit tud a világ, a játékos és az egyes szereplők. A finálékhoz készíts előfeltétel- és útvonaltáblát.
- **A hurkoknak legyen kijáratuk.** Vizsgáld meg a végtelen újrapróbálást, ismételt jutalmakat, felhalmozódó hatásokat és a nyomok megszerzési sorrendjét. Legyen teszt olyan állapotra is, amikor hiányzik egy opcionális tárgy vagy információ.
- **Tervezz méretkerettel.** Egy 100 jelenetes kalandhoz nem szükséges 100 külön kép. Egyeztesd a borító, fejezetnyitók és kulcsjelenetek számát. A ZIP plafonja miatt mérd a teljes csomagot a képgenerálás elejétől. Ha teljes képsorozat kell, előbb próbálj tömörített WebP/JPEG mintát és kérj döntést a közös katalógus vagy az importálható ZIP előnyéről.

## A kalandcsomag formátuma

UTF-8 JSON-fájlokat adj a ZIP gyökerében, a képeket az `images/` mappában. Ugyanez a szerkezet használható az `adventures/<id>/` könyvtárban. A csomag csak adatot és az engedélyezett képformátumokat tartalmazza.

| Fájl                 | Kötelező tartalom                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json`      | `version: 1`, kisbetűs kötőjeles `id`, `title`, `description`, `genre`, `difficulty` (`easy`, `normal`, `hard`), pozitív egész `minutes`, `defaultLocale` (`hu` vagy `en`), `statLabels`, `theme` és `characterMode` (`preset`, `custom`, `both`). A címkék alakja `{"hu":"…","en":"…"}`, a magyar mező kötelező, az angol megadható. A `cover` opcionális, például `images/cover.jpg`. |
| `heroes.json`        | Legalább egy hős vagy archetípus, pozitív `eletero`, minden definiált tulajdonság kezdőértéke és egy képességkártya.                                                                                                                                                                                                                                                                    |
| `items.json`         | Tárgylista, üres készletnél `[]`.                                                                                                                                                                                                                                                                                                                                                       |
| `nodes.json`         | `startNodeId`, `deathEndingId` és `nodes`. A jelenet `kind: "scene"`, a lezárás `kind: "ending"`. A lezárás technikai típusa `victory` vagy `death`, és a cím/szöveg közli a történeti árnyalatot.                                                                                                                                                                                      |
| `translations.json`  | A `defaultLocale`-tól eltérő nyelv szövegei. Nyelvváltáskor az azonosítók és a mentések közösek.                                                                                                                                                                                                                                                                                        |
| `illustrations.json` | Opcionális lista `nodeId`, `file`, `alt` mezőkkel. A `file` a fájlnév az `images/` előtag nélkül.                                                                                                                                                                                                                                                                                       |
| `images/`            | PNG, JPEG és WebP. A ZIP és a kibontott tartalom felső határa egyaránt 32 MiB. Az import egy képnél legfeljebb 8 MiB-ot és 16 megapixelt fogad.                                                                                                                                                                                                                                         |

A `theme` mező `background`, `surface`, `accent` és `text` színei hatjegyű hex értékek, a `font` értéke `system`, `serif` vagy `mono`. Ellenőrizd a szöveg kontrasztját és a képek vágását mobilon. A portré vagy tárgykép a jelenlegi felületen akkor jelenik meg a játékban, ha borítóként vagy jelenetképként hivatkozod. A külön karakterlapra, tárgypanelre vagy önálló térképképernyőre szánt anyagot add át külön vagy kezdeményezz felületbővítést. A szerzői gráf és a pontos térkép az ellenőrzött adatokból készüljön. Képgenerátort hangulati illusztrációra használj.

A belső azonosítók kisbetűvel kezdődnek és csak kisbetűt, számot vagy aláhúzást tartalmaznak. A már kiadott azonosítókat tartsd meg a mentések kompatibilitása miatt. A döntések ID-ja a teljes kalandban egyedi. Egyszerű döntésnél `target` van. Próbánál `check: {"stat":"…"}` szerepel, külön `success.target` és `failure.target` mezővel. A 2d6 akkor sikerül, ha legfeljebb a célérték. A meglévő könnyű és nehéz játékosmód +2, illetve −2 próbamódosítót ad. Az alapkaland nehézségi címkéje a katalógus tájékoztató mezője. Feltételnél tárgy, flag, minimális tulajdonság és logikai kombináció használható. A pontos mezőket a sémákból vedd.

Fordítási kulcsok: `node.<id>.title`, `node.<id>.text`, `choice.<id>`, `hero.<id>.name|role|description`, `card.<id>.name|description`, `item.<id>.name|description`, `image.<nodeId>.alt`. A `|` külön kulcslehetőségeket jelöl. A tulajdonnevek maradhatnak eredetiben. Kétnyelvű átadásnál a teljes jelenet-, döntés-, szereplő-, tárgy- és képszöveghez ellenőrizd a párokat, mert a platform hiányzó fordításnál visszaesik az alapnyelvre.

## Leadás és folytatás ellenőrzése

1. **Séma és statikus gráf.** Repóban futtasd a `npm run validate:adventure -- adventures/<id>` parancsot, majd ellenőrizd a képfájlok dekódolását és méretét. A statikus gráfellenőrzés mellé futtass állapotfüggő végigjátszást is.
2. **Determinisztikus útvonalak.** Minden tervezett befejezéshez adj legalább egy hős/archetípus, nehézség, seed és döntéssorozat kombinációt. Teszteld a döntési feltételek teljesült és hiányzó eseteit, a tárgy- és flagállapotot, a legfontosabb sikertelen próbákat, valamint 0 életerőt. A szimulációhoz az egyedi csomagot kell betölteni a repó `tools/lib/simulator.ts` moduljába. A gyári `simulate` parancs a Csendes Jel tartalmára mutat.
3. **Hossz és egyensúly.** Mérd a bejárt döntések számát és a holtpontokat. Vesd össze a könnyű, normál és nehéz mód sikerarányait, és játszd végig a ritka ágakat célzott magokkal. A rövid, átlagos és hosszú útvonalat külön jelentsd.
4. **Böngésző.** Importáld a ZIP-et a könyvtárba, ellenőrizd az importot a vizuális szerkesztőben, indíts új játékot. Próbáld ki mindkét nyelvet, a mentést, a visszatöltést, a saját hőst, ha engedélyezett, és egy támogatott mobil- és asztali nézetet. A nyelvváltás után ugyanazt a játékállást várjuk.
5. **Agentváltási próba.** Egy friss munkamenet csak az instrukciót, az ellenőrzőpontot, a döntéseket és a hivatkozott fájlokat kapja. Kérd meg, hogy írja le az aktív revíziót, a megválaszolatlan kérdéseket és az első elvégzendő műveletet. Ellenőrizd, hogy a jóváhagyott tartalom változatlan marad a folytatás során.
6. **Átadás.** Add át a játszható ZIP-et, rövid összefoglalót, ellenőrzött útvonalakat, eredményeket és a szerkeszthető munkamappát vagy annak archívumát. A kiadást, a repóba integrálást és a nyilvános publikálást a Q12-ben rögzített döntés szerint végezd. Az elmaradt ellenőrzést vagy hiányzó eszközt név szerint add meg.
