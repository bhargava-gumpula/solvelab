import { describe, expect, it } from "vitest";
import { milestones } from "@/data/milestones";
import { skills } from "@/data/skills";
import { exercises } from "@/data/exercises";
import { algorithmSets } from "@/data/algorithms/sets";
describe("domain configuration integrity", () => {
  it("uses unique stable identifiers", () => {
    for (const entries of [milestones, exercises, algorithmSets])
      expect(new Set(entries.map((entry) => entry.id)).size).toBe(entries.length);
  });
  it("references only defined skills and milestones", () => {
    const milestoneIds = new Set(milestones.map((item) => item.id));
    for (const milestone of milestones)
      for (const skill of milestone.recommendedSkills) expect(skills[skill]).toBeDefined();
    for (const exercise of exercises) {
      for (const skill of [...exercise.skillsMeasured, ...exercise.skillsTrained])
        expect(skills[skill]).toBeDefined();
      for (const milestone of exercise.applicableMilestones)
        expect(milestoneIds.has(milestone)).toBe(true);
    }
  });
  it("orders time thresholds from introductory to advanced", () => {
    const thresholds = milestones.flatMap((item) =>
      item.thresholdMs === null ? [] : [item.thresholdMs],
    );
    expect(thresholds).toEqual([...thresholds].sort((a, b) => b - a));
  });
});
