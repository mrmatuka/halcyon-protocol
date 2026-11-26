# Kalandcsomag-szerzői útmutató AI-nak

A feladat egy eredeti, játszható, elágazó kalandcsomag szerzői elkészítése a közös 2d6-os motorhoz. A szerző először adja meg a műfajt, a hangnemet, a célközönséget, a játékidőt, a kívánt nehézséget és a tartalmi határokat. Lényegi hiányzó döntés esetén kérdezz rá. A mindenkori működő mintát az `adventures/lantern-keeper/` és az `adventures/csendes-jel/` adja.

## Kimenet

Készíts egy ZIP-et az alábbi fájlokkal közvetlenül az archívum gyökerében. UTF-8 JSON-t adj, tömörített külső mappa és futtatható kód nélkül. Ugyanez a fájlszerkezet kerülhet az `adventures/<id>/` könyvtárba, ha a kalandot a platformmal együtt kell kiadni.

| Fájl                 | Tartalom                                                                                                                                                                                                                                                                                                                          |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json`      | `version: 1`, egyedi kisbetűs kötőjeles `id`, `title`, `description`, `genre`, `difficulty` (easy/normal/hard), pozitív egész `minutes`, `defaultLocale` (hu/en), `statLabels`, `theme`, `characterMode` (preset/custom/both). A nyelvi címkék alakja `{"hu":"…","en":"…"}`. Opcionális a `cover` mező, pl. `"images/cover.jpg"`. |
| `heroes.json`        | Legalább egy hős vagy archetípus, kezdőértékekkel és egy képességkártyával. Minden szereplőnek legyen pozitív `eletero` értéke és minden manifestbeli tulajdonsághoz kezdőértéke.                                                                                                                                                 |
| `items.json`         | Tárgyak listája. Tárgy nélküli történetnél az érték `[]`.                                                                                                                                                                                                                                                                         |
| `nodes.json`         | `startNodeId`, `deathEndingId`, `nodes`. A jelenet (`kind: "scene"`) ad választásokat, a befejezés (`kind: "ending"`) típusa `victory` vagy `death`.                                                                                                                                                                              |
| `translations.json`  | A másik nyelv szövegei azonosítók szerint. A kulcsok alább szerepelnek.                                                                                                                                                                                                                                                           |
| `illustrations.json` | Opcionális lista, elemként `nodeId`, `file` és `alt`; pl. `{"nodeId":"kapu","file":"kapu.jpg","alt":"Egy kőkapu"}`.                                                                                                                                                                                                               |
| `images/`            | Opcionális PNG, JPEG és WebP fájlok. Adj leíró alt-szöveget. Az archívum és a kibontott tartalom felső határa 32 MB.                                                                                                                                                                                                              |

A `theme` mezőben adj meg hatjegyű hex színt `background`, `surface`, `accent` és `text` kulcshoz, illetve `system`, `serif` vagy `mono` értéket `font`-ként. A szöveg és háttér kontrasztját ellenőrizd.

## Közös szabályok

- A kalandazonosító lehet kötőjeles. A belső azonosítók kisbetűvel kezdődnek, és kisbetűt, számot, aláhúzást tartalmazhatnak. A szöveg fordításakor és javításakor az azonosítók maradjanak stabilak a korábbi mentések miatt.
- Egyszerű választásnál `target` van. Próbánál `check: { "stat": "…" }` szerepel, külön `success` és `failure` célokkal. A dobás sikeres, ha a 2d6 összege legfeljebb a tulajdonság és a módosítók összege. Könnyű módban a célérték +2, nehézben −2.
- Az `eletero` nulla értékénél a motor a kijelölt halál-befejezésre ugrik. A `szerencse` opcionális, de ilyen nevű tulajdonság próba után egyet fogy. A többi tulajdonság kalandonként tetszőleges elnevezésű.
- A `condition` támogathat tárgyat, flaget, minimum tulajdonságot és ezek logikai kombinációját. Hatások adhatnak vagy elvehetnek tárgyat, változtathatnak tulajdonságot, illetve állíthatnak flaget. Az egzakt mezőkhöz használd a repó `content/schema/` sémáit és a működő mintákat.
- Írj érdemi döntéseket és legalább egy teljes, végigjátszható útvonalat. Minden szándékolt jelenet legyen elérhető, és ne legyen kijárat nélküli ciklus vagy olyan jelenet, ahol az adott útvonalon minden választás rejtett.
- A fordítás tartalmazza a teljes történetet és a választásokat. Kulcsok: `node.<id>.title`, `node.<id>.text`, `choice.<id>`, `hero.<id>.name|role|description`, `card.<id>.name|description`, `item.<id>.name|description`, `image.<nodeId>.alt`. Tulajdonnevek fordítása opcionális.

## Leadás előtt

1. Ellenőrizd minden hivatkozás, választás, kártya, tárgy és nyelvi kulcs egyezését.
2. Játszd végig a kezdéstől legalább két eltérő döntéssorozattal. Rövid kalandnál próbáld végig minden befejezést.
3. Futtasd a `npm run validate:adventure -- adventures/<id>` parancsot, ha helyben dolgozol. Importáld a ZIP-et a platform könyvtárába. Nyisd meg a vizuális szerkesztőt, és futtasd az **Ellenőrzés** műveletet.
4. Add át a ZIP-et, az egybekezdéses összefoglalót, a befejezésekhez vezető utak rövid leírását és az elvégzett ellenőrzéseket.
