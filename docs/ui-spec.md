# UI specifikáció (F5.1)

## Döntések

- **Állapotkezelés:** React `useReducer` (`src/ui/gameReducer.ts`).
- **Stílus:** Tiszta CSS változókkal (`src/ui/styles.css`), sötét sci-fi / jeges űrállomás hangulat.
- **Reszponzivitás (Q11):** Asztali nézetben kétoszlopos elrendezés (balra a történet, jobbra a karakterlap és tárgylista), mobilon (legfeljebb 840 px szélességnél) egymás alatt.
- **Böngészőcél (Q11):** Chromium asztali és mobil nézetben.
- **Függőség-injektálás:** A közös játékfelület a kiválasztott kaland `content`, `manifest`, `saveRepository` és `resolveIllustration` értékeit a platformtól kapja.

## Képernyőtérkép

1. **Főmenü (`menu`)**
   - Cím: `Csendes Jel`
   - Műveletek: `Új játék` → `heroSelect`, `Betöltés` → `SaveLoadModal` (betöltés mód).
2. **Hősválasztás (`heroSelect`)**
   - A 3 hős kártyája (név, szerep, leírás, statok, képességkártya).
   - Opcionális seed mező (üresen véletlen, kitöltve determinisztikus).
   - Műveletek: `Kaland indítása` → `playing`, `Vissza` → `menu`.
3. **Játék (`playing`)**
   - Felső sáv: játékcím, `Mentés / Betöltés` gomb, `Főmenü` gomb.
   - Fő oszlop:
     - `SceneView`: csomópont címe, illusztráció helye (`figure`), szöveg, utolsó próba eredménye (`DiceRollBanner`), elérhető választások (próbánál tulajdonság-jelvény + opcionális kártyahasználat gomb, ha alkalmazható).
     - Befejezésnél (`endingId !== null`): `EndingView` (befejezés típusa: győzelem/halál, cím, szöveg, `Új játék` és `Főmenü` gombok).
   - Oldalsáv:
     - `CharacterSheet`: hős neve, szerepe, Életerő (`aktuális / max`), Reflex, Technika, Kitartás, Szerencse, képességkártya állapota (gyógyító kártyánál közvetlen használat gomb).
     - `InventoryPanel`: birtokolt tárgyak neve és leírása.
4. **Mentés / Betöltés ablak (`SaveLoadModal`)**
   - `role="dialog"`, `aria-modal="true"`, `Escape` bezárja.
   - 4 slot: `Automentés`, `1. mentés`, `2. mentés`, `3. mentés`.
   - Metaadatok: hős neve, csomópont címe, időbélyeg; sérült slot jelzése.
   - Műveletek: `Mentés` (csak játék közben, a 3 kézi slotra), `Betöltés`, `Törlés`.

## Hozzáférhetőség (F5.9)

- Szemantikus landmarkok (`header`, `main`, `aside`), egyetlen `h1` képernyőnként.
- `aria-live="polite"` a kockadobás eredményéhez és a mentési visszajelzésekhez.
- Fókuszkezelés: csomópontváltáskor a jelenet címsora fókuszba kerül (`tabIndex={-1}`); a modális ablak `Escape`-re bezárul.

## Könyvespolc, karaktertár és szerkesztő

- A Könyvespolc nézet a kalandok borítóit 2:3 keretben mutatja. Az új borítót álló képként érdemes felvinni. Kép nélküli kalandnak tipográfiai borítója van. A szerkesztés és a ZIP-import a Történetszerkesztő menüben érhető el.
- A Karakterek menüben a Felderítő, Tudós, Őrző és Közvetítő kasztból lehet választani. A kaszt fő tulajdonsága 8, a többi 6, egy egyéni adottság egy értékhez +1-et ad. A kézi és véletlen módban egyaránt összesen 4 pont osztható el, tulajdonságonként legfeljebb 10-es végértékig. A portré választható a kaszt képei közül, vagy feltölthető.
- A karaktergenerátorban az „Összes kaland” beállítás teszi alapértelmezetté a karaktert. Kikapcsolva egyenként választhatók ki a kalandok. A játék az adott kalandhoz rendelt karaktert használja, ennek híján a közös alapértelmezettet. Új látogatónál a karaktertár üres. Új játékhoz saját karaktert kell készíteni. A kalandok korábbi karakteradatai a szabályok kalibrálását és a meglévő mentések betöltését szolgálják.
- A `characterStatMap` opcionálisan a kaland tulajdonságait közös értékhez rendeli (`agility`, `knowledge`, `resolve`, `presence`). A játékszabály a kaland alapértékéhez adja a közös tulajdonság 7-től vett eltérését. Ismert régi tulajdonságoknak van alapértelmezett megfeleltetésük. A megfeleltetés nélküli érték a kaland alapértékén marad.
- A közös karakterek, hozzárendelések, mentések és a nyelvi beállítás a böngészőprofil helyi tárhelyén tárolódnak. Ha a hozzáférés tiltott vagy betelt a tárhely, a játék ideiglenesen az aktuális lap memóriáját használja. Erről jelzés jelenik meg. Az ideiglenes adatok újratöltéskor elveszhetnek. A futó kaland mentése saját karakterpillanatképet őriz, beleértve a portrét és a kasztképességet. A tárgyak, életerő és az elhasznált képesség a futó kaland állásához tartoznak.
