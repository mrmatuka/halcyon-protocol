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
