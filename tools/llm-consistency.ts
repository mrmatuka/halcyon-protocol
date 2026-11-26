import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';

/**
 * F8.4 – LLM-es konzisztenciaellenőrző szerzői szkript.
 * Összeállítja a teljes történetgráfot egyetlen ellenőrző promptba, amely
 * szöveges ellentmondásokat (pl. megszerzés előtti tárgyemlítés, el nem magyarázott szereplők,
 * hangnem-törés) keres. Kimenet: jelentés-sablon / prompt (nem módosít fájlokat).
 *
 * Használat: npx tsx tools/llm-consistency.ts
 */
const heroes = readFileSync('adventures/csendes-jel/heroes.json', 'utf8');
const items = readFileSync('adventures/csendes-jel/items.json', 'utf8');
const nodes = readFileSync('adventures/csendes-jel/nodes.json', 'utf8');

const prompt = `# Konzisztenciaellenőrzés – Csendes Jel

Te egy szigorú narratív szerkesztő vagy. Ellenőrizd az alábbi interaktív kalandjáték JSON fájljait, és írj **jelentést** (ne javítsd automatikusan a JSON-t!).

## Mit keress?
1. **Állapot-ellentmondások:** Említ-e bármelyik szöveg olyan tárgyat, szereplőt vagy információt, amellyel a játékos adott útvonalon még nem találkozhatott?
2. **Próbák és kártyák összhangja:** A szöveg és a próbák statjai/kártyái összhangban vannak-e?
3. **Hangnem és világkonzisztencia:** Komoly sci-fi alap, száraz/sötét humor (Rigó, MÁRA), 18+ felnőtt hangnem. Van-e kilógó rész?
4. **Magyar nyelvhelyesség:** Elütések, magyartalan fordulatok, következetlen tegezés/magázás (MÁRA magáz, Rigó tegez).

## Hősök (heroes.json)
\`\`\`json
${heroes}
\`\`\`

## Tárgyak (items.json)
\`\`\`json
${items}
\`\`\`

## Történetgráf (nodes.json)
\`\`\`json
${nodes}
\`\`\`
`;

mkdirSync('docs/reports', { recursive: true });
const outPath = 'docs/reports/llm-consistency-prompt.md';
writeFileSync(outPath, prompt, 'utf8');
console.log(`Konzisztencia-ellenőrző prompt elkészült: ${outPath}`);
