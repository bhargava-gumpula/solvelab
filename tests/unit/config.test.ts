import { describe, expect, it } from "vitest";
import { milestones } from "@/data/milestones";
import { skills } from "@/data/skills";
import { exercises } from "@/data/exercises";
import { algorithmSets } from "@/data/algorithms/sets";
import { brand } from "@/lib/config/brand";
import { features, upcoming } from "@/lib/config/features";
import { navigation } from "@/lib/config/navigation";
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
  it("ships 3.1 with Train/Learn visible but not enabled", () => {
    expect(brand.version).toBe("3.1");
    expect(features.train).toBe(false);
    expect(features.learn).toBe(false);
    expect(features.algorithms).toBe(true);
    expect(upcoming).toEqual({ train: "3.4", learn: "3.4", algorithms: "3.3" });
    expect(navigation.map((item) => item.label)).toEqual([
      "Timer",
      "Coach",
      "Train",
      "Algorithms",
      "Learn",
      "Stats",
    ]);
    expect(navigation.find((item) => item.href === "/train")?.enabled).toBe(false);
    expect(navigation.find((item) => item.href === "/learn")?.enabled).toBe(false);
    expect(navigation.find((item) => item.href === "/algorithms")?.enabled).toBe(true);
  });
});
