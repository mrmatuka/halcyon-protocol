# AI-szerzői munkafolyamat (F8.6)

Ez a dokumentum rögzíti, hogyan használjuk az LLM-eket és determinisztikus szkripteket a történet bővítése és ellenőrzése során. **A kiadott böngészős játék futásidőben nem hív LLM-et.**

## 1. Jelenet- és párbeszéd-tervezési sablon

Új jelenet vagy átírás készítésekor add meg az LLM-nek:

1. A [story-design.md](story-design.md) világleírását és hangnemi szabályait (komoly sci-fi, Rigó tegez, MÁRA magáz, 18+).
2. A környező csomópontok azonosítóit, a garantáltan meglévő és az opcionális flageket/tárgyakat.
3. A `content/schema/nodes.schema.json` sémát.

**Prompt-sablon:**

> Írj egy `StoryNode` (kind: `"scene"`) JSON-bejegyzést a „Csendes Jel” játékhoz az alábbi paraméterekkel:
>
> - Csomópont ID: `<id>`, belépő csomópontok: `<prevIds>`, kimenő célok: `<targetIds>`
> - Hangnem: komoly sci-fi, sötét/száraz humor, magyar nyelv, 2–3 rövid bekezdés
> - Kizárólag a `nodes.schema.json` szerinti mezőket használd, ne hivatkozz olyan tárgyra vagy flagre, amely nincs a bemeneti állapotban.

## 2. Kereszt-ellenőrzési szabály (PLAN.md §3)

- A jelenetet író és a konzisztenciát ellenőrző modell **különböző szolgáltatótól** származzon.
- A generált szöveg **soha nem kerül be emberi jóváhagyás nélkül** a `content/` mappába.

## 3. Ellenőrzési lépések (minden tartalommódosítás után)

1. `npm test` — zod séma + hivatkozások + gráfvalidátor + szimuláció.
2. `npm run validate:graph` — determinisztikus gráfvalidátor (holtpont, ciklus, elérhetetlen csomópont).
3. `npm run simulate` — 500–500 seedelt végigjátszás hősönként (véletlen és tulajdonság-tudatos bottal).
4. `npx tsx tools/llm-consistency.ts` → a legenerált `docs/reports/llm-consistency-prompt.md` lefuttatása külső LLM-en, majd a jelentés emberi átvizsgálása.
5. `npx tsx tools/llm-playtester.ts <heroId> <seed>` → tesztjátékos-napló értékelése.
