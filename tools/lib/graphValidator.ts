import type { Choice, Condition, Effect, StoryNode } from '../../src/engine/schema';
import { validateContent, type Content } from '../../src/engine/validate';

export type GraphIssueCode =
  | 'CONTENT_ERROR'
  | 'UNREACHABLE_NODE'
  | 'DEAD_END'
  | 'CYCLE_WITHOUT_EXIT'
  | 'UNSATISFIABLE_CONDITION';

export interface GraphIssue {
  code: GraphIssueCode;
  nodeId?: string;
  choiceId?: string;
  message: string;
}

function collectEffects(choice: Choice): Effect[] {
  if ('check' in choice) {
    return [...(choice.success.effects ?? []), ...(choice.failure.effects ?? [])];
  }
  return choice.effects ?? [];
}

function collectTargets(choice: Choice): string[] {
  if ('check' in choice) {
    return [choice.success.target, choice.failure.target];
  }
  return [choice.target];
}

/**
 * Statikus ellenőrzés: teljesíthető-e elvileg a feltétel a történetben előforduló
 * `addItem` és `setFlag(..., true)` hatások alapján.
 */
function findUnsatisfiableReasons(
  cond: Condition,
  producibleItems: Set<string>,
  producibleTrueFlags: Set<string>,
): string[] {
  switch (cond.type) {
    case 'hasItem':
      return producibleItems.has(cond.itemId)
        ? []
        : [`a(z) „${cond.itemId}" tárgyat egyetlen effekt sem adja a játékosnak`];
    case 'flag': {
      const wantTrue = cond.value ?? true;
      if (wantTrue && !producibleTrueFlags.has(cond.flag)) {
        return [`a(z) „${cond.flag}" flag-et egyetlen effekt sem állítja true-ra`];
      }
      return [];
    }
    case 'statAtLeast':
      return [];
    case 'all':
      return cond.conditions.flatMap((c) =>
        findUnsatisfiableReasons(c, producibleItems, producibleTrueFlags),
      );
    case 'any': {
      const sub = cond.conditions.map((c) =>
        findUnsatisfiableReasons(c, producibleItems, producibleTrueFlags),
      );
      if (sub.some((reasons) => reasons.length === 0)) return [];
      return sub.flat();
    }
    case 'not':
      return [];
  }
}

/**
 * F8.1 – Determinisztikus gráfvalidátor:
 * ellenőrzi az elérhetetlen csomópontokat/befejezéseket, holtpontokat,
 * kijárat nélküli ciklusokat és a soha nem teljesülő feltételeket.
 */
export function validateStoryGraph(content: Content): GraphIssue[] {
  const issues: GraphIssue[] = [];

  for (const err of validateContent(content)) {
    issues.push({ code: 'CONTENT_ERROR', message: `${err.path}: ${err.message}` });
  }
  if (issues.length > 0) return issues;

  const { story } = content;
  const nodeMap = new Map<string, StoryNode>(story.nodes.map((n) => [n.id, n]));

  // 1. Mely tárgyak és true-flagek keletkezhetnek a történetben?
  const producibleItems = new Set<string>();
  const producibleTrueFlags = new Set<string>();
  for (const node of story.nodes) {
    if (node.kind !== 'scene') continue;
    for (const choice of node.choices) {
      for (const eff of collectEffects(choice)) {
        if (eff.type === 'addItem') producibleItems.add(eff.itemId);
        if (eff.type === 'setFlag' && (eff.value ?? true) === true) {
          producibleTrueFlags.add(eff.flag);
        }
      }
    }
  }

  // 2. Előre irányuló elérhetőség a startNodeId-ból (BFS)
  const forwardAdj = new Map<string, string[]>();
  const reverseAdj = new Map<string, string[]>();
  for (const node of story.nodes) {
    forwardAdj.set(node.id, []);
    reverseAdj.set(node.id, []);
  }

  for (const node of story.nodes) {
    if (node.kind !== 'scene') continue;
    let satisfiableChoices = 0;

    for (const choice of node.choices) {
      const reasons = choice.condition
        ? findUnsatisfiableReasons(choice.condition, producibleItems, producibleTrueFlags)
        : [];
      if (reasons.length > 0) {
        issues.push({
          code: 'UNSATISFIABLE_CONDITION',
          nodeId: node.id,
          choiceId: choice.id,
          message: `A(z) „${node.id}" csomópont „${choice.id}" választásának feltétele soha nem teljesül: ${reasons.join('; ')}.`,
        });
      } else {
        satisfiableChoices++;
        for (const target of collectTargets(choice)) {
          forwardAdj.get(node.id)!.push(target);
          reverseAdj.get(target)?.push(node.id);
        }
      }
    }

    if (satisfiableChoices === 0) {
      issues.push({
        code: 'DEAD_END',
        nodeId: node.id,
        message: `Holtpont: a(z) „${node.id}" jelenetnek nincs teljesíthető kimenő választása.`,
      });
    }
  }

  const reachableFromStart = new Set<string>();
  const queue: string[] = [story.startNodeId];
  reachableFromStart.add(story.startNodeId);
  while (queue.length > 0) {
    const curr = queue.shift()!;
    for (const next of forwardAdj.get(curr) ?? []) {
      if (!reachableFromStart.has(next)) {
        reachableFromStart.add(next);
        queue.push(next);
      }
    }
  }

  // A deathEndingId motor szintű halál-befejezés (bármely sebzésnél elérhető)
  for (const node of story.nodes) {
    if (node.id === story.deathEndingId) continue;
    if (!reachableFromStart.has(node.id)) {
      issues.push({
        code: 'UNREACHABLE_NODE',
        nodeId: node.id,
        message: `Elérhetetlen ${node.kind === 'ending' ? 'befejezés' : 'csomópont'}: „${node.id}".`,
      });
    }
  }

  // 3. Visszafelé elérhetőség a befejezésektől (kijárat nélküli ciklusok felderítése)
  const canReachEnding = new Set<string>();
  const revQueue: string[] = [];
  for (const node of story.nodes) {
    if (node.kind === 'ending') {
      canReachEnding.add(node.id);
      revQueue.push(node.id);
    }
  }
  while (revQueue.length > 0) {
    const curr = revQueue.shift()!;
    for (const prev of reverseAdj.get(curr) ?? []) {
      if (!canReachEnding.has(prev)) {
        canReachEnding.add(prev);
        revQueue.push(prev);
      }
    }
  }

  for (const nodeId of reachableFromStart) {
    const node = nodeMap.get(nodeId);
    if (node?.kind === 'scene' && !canReachEnding.has(nodeId)) {
      // Ha már holtpontként jeleztük, ne duplázzuk
      const alreadyDeadEnd = issues.some((i) => i.code === 'DEAD_END' && i.nodeId === nodeId);
      if (!alreadyDeadEnd) {
        issues.push({
          code: 'CYCLE_WITHOUT_EXIT',
          nodeId,
          message: `Kijárat nélküli ciklus vagy csapda: a(z) „${nodeId}" csomópontból nem érhető el egyetlen befejezés sem.`,
        });
      }
    }
  }

  return issues;
}
