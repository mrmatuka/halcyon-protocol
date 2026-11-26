import { expect, it } from 'vitest';
import {
  attributeCap,
  attributeValue,
  attributes,
  classIds,
  pointBudget,
  rollPoints,
  spentPoints,
  traitIds,
  writeProfiles,
} from '../../src/platform/profiles';

it('a véletlen és a kézi karakter is ugyanahhoz a plafonhoz és pontkerethez kötött', () => {
  for (const classId of classIds) {
    for (const traitId of traitIds) {
      for (const rng of [() => 0, () => 0.999, () => 0.5]) {
        const points = rollPoints({ classId, traitId }, rng);
        expect(spentPoints(points)).toBe(pointBudget);
        const values = attributes.map((stat) => attributeValue({ classId, traitId, points }, stat));
        expect(Math.max(...values)).toBeLessThanOrEqual(attributeCap);
        expect(Math.min(...values)).toBeLessThan(attributeCap);
      }
    }
  }
  expect(() =>
    writeProfiles({
      version: 1,
      defaultId: 'profile_a',
      assignments: {},
      profiles: [
        {
          id: 'profile_a',
          name: 'Test',
          classId: 'scout',
          traitId: 'nimble',
          portrait: 'preset:scout-1',
          points: { agility: 4, knowledge: 4, resolve: 4, presence: 4 },
        },
      ],
    }),
  ).toThrow();
});
