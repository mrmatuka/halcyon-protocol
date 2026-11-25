# MVP állapot, ismert hiányosságok és következő lépések (F10.3)

## Elkészült funkciók
- **Játékmotor (`src/engine/`):** determinisztikus, seedelhető RNG, `2d6 ≤ tulajdonság + módosító` próbák, Szerencse-fogyás, hősönkénti képességkártyák (`autoSuccess`, `reroll`, `heal`), 0 életerő → halál-befejezés, verziózott szerializálás.
- **Mentés (`src/persistence/`):** cserélhető `SaveRepository` interfész, `localStorage` implementáció 3 kézi slottal + 1 automentéssel, sérült/ismeretlen verziójú mentés és megtelt tárhely kezelése.
- **Felület (`src/ui/`):** React + `useReducer`, reszponzív sötét sci-fi megjelenés, karakterlap, tárgylista, kockadobás-visszajelzés, mentés/betöltés ablak, alap hozzáférhetőség.
- **Tartalom (`content/`):** jóváhagyott magyar nyelvű „Csendes Jel” történet (15 jelenet + 5 befejezés, 3 hős, 2 tárgy, JSON Schema-k).
- **Szerzői és ellenőrző eszközök (`tools/`):** determinisztikus gráfvalidátor (`npm run validate:graph`), szimulációs bot (`npm run simulate`), LLM konzisztencia- és tesztjátékos-prompt generátorok.
- **Build:** `npm run build` sikeresen elkészíti a statikus `dist/` csomagot; lokálisan a `npm run dev` vagy `npm run preview` paranccsal indítható.

## Nyitott pontok az MVP teljes lezárásához
1. **8 hiányzó illusztráció (F7.3–F7.4):** A 20 csomópontból 12 kép elkészült a `public/images/` mappában. A maradék 8 (`n03_szervizakna.jpg`, `n04_labor.jpg`, `n05_lakokorlet.jpg`, `n09_orvosi.jpg`, `n10_mara_hivas.jpg`, `e3_szallitmany.jpg`, `d1_kihules.jpg`, `d2_kiszelloztetve.jpg`) a képgeneráló kvóta újraindulása után pótolható a `content/illustrations.json` promptjaiból; addig a UI elegáns fallbacket jelenít meg, és az `illustrations.test.ts` jelzi a hiányukat.
2. **Statikus hosting (Q12):** A `dist/` mappa bármely statikus tárhelyre (GitHub Pages, Cloudflare Pages, Netlify, Vercel) feltölthető, ha kiadásra kerül.

## Továbbfejlesztési irányok (MVP után)
- Procedurális történetgenerálás, dinamikus mesélő, gyűjthető kártyák, térkép, állapotfüggő illusztrációk, közös játékmód, szerveroldali `SaveRepository` implementáció.
