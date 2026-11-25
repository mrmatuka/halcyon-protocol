# MVP állapot, ismert hiányosságok és következő lépések (F10.3)

## Elkészült funkciók
- **Játékmotor (`src/engine/`):** determinisztikus, seedelhető RNG, `2d6 ≤ tulajdonság + módosító` próbák, Szerencse-fogyás, hősönkénti képességkártyák (`autoSuccess`, `reroll`, `heal`), 0 életerő → halál-befejezés, verziózott szerializálás.
- **Mentés (`src/persistence/`):** cserélhető `SaveRepository` interfész, `localStorage` implementáció 3 kézi slottal + 1 automentéssel, sérült/ismeretlen verziójú mentés és megtelt tárhely kezelése.
- **Felület (`src/ui/`):** React + `useReducer`, reszponzív sötét sci-fi megjelenés, karakterlap, tárgylista, kockadobás-visszajelzés, mentés/betöltés ablak, alap hozzáférhetőség.
- **Tartalom (`content/`):** jóváhagyott magyar nyelvű „Csendes Jel” történet (15 jelenet + 5 befejezés, 3 hős, 2 tárgy, JSON Schema-k).
- **Szerzői és ellenőrző eszközök (`tools/`):** determinisztikus gráfvalidátor (`npm run validate:graph`), szimulációs bot (`npm run simulate`), LLM konzisztencia- és tesztjátékos-prompt generátorok.
- **Build:** `npm run build` sikeresen elkészíti a statikus `dist/` csomagot; lokálisan a `npm run dev` vagy `npm run preview` paranccsal indítható.

## Illusztrációk és kiadás

- **Illusztrációk (F7.3–F7.4):** Mind a 20 csomóponthoz elkészült a képfájl és az alt-szöveg. Az illusztrációs teszt zöld, mind a 20 JPEG megnyitható a production buildből.
- **Ellenőrzés:** 141 unit/RTL és 9 Playwright-teszt futott sikeresen.
- **Statikus hosting (Q12):** A GitHub Pages workflow a `main` ágra érkező push vagy kézi indítás után telepíti a buildet.

## Továbbfejlesztési irányok (MVP után)
- Procedurális történetgenerálás, dinamikus mesélő, gyűjthető kártyák, térkép, állapotfüggő illusztrációk, közös játékmód, szerveroldali `SaveRepository` implementáció.
