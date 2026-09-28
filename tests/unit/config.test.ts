import { describe, expect, it } from "vitest";
import { milestones } from "@/data/milestones";
import { skills } from "@/data/skills";
import { exercises } from "@/data/exercises";
import { algorithmSets } from "@/data/algorithms/sets";
import { brand } from "@/lib/config/brand";
import { features, upcoming } from "@/lib/config/features";
import { isActiveItem, navigation, tabOf, TABS } from "@/lib/config/navigation";
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
  it("ships 4.1 with every surface turned on", () => {
    expect(brand.version).toBe("4.1");
    expect(features.train).toBe(true);
    expect(features.learn).toBe(true);
    expect(features.algorithms).toBe(true);
    expect(upcoming).toEqual({ train: "4.1", learn: "4.1", algorithms: "4.0" });
  });
  it("has two places, and every page belongs to one of them", () => {
    expect(navigation.map((item) => item.label)).toEqual(["Timer", "Learning Hub"]);
    expect(TABS.find((tab) => tab.id === "timer")?.sections.map((item) => item.label)).toEqual([
      "Timer",
      "Stats",
    ]);
    expect(TABS.find((tab) => tab.id === "hub")?.sections.map((item) => item.label)).toEqual([
      "Path",
      "Profile",
      "Practice",
      "Algorithms",
      "Library",
    ]);
    for (const [path, tab] of [
      ["/timer/", "timer"],
      ["/stats/", "timer"],
      ["/hub/", "hub"],
      ["/hub/lesson/lookahead/x/", "hub"],
      ["/coach/tests/cross_only/", "hub"],
      ["/learn/lookahead/", "hub"],
      ["/train/", "hub"],
      ["/algorithms/pll/", "hub"],
    ] as const) {
      expect(tabOf(path)?.id, path).toBe(tab);
    }
    expect(tabOf("/settings/")).toBeNull();
    expect(tabOf("/privacy/")).toBeNull();
  });
  it("lights one section at a time inside the Hub", () => {
    const hub = TABS.find((tab) => tab.id === "hub")!;
    const lit = (path: string) =>
      hub.sections.filter((item) => isActiveItem(path, item)).map((item) => item.label);
    expect(lit("/hub/")).toEqual(["Path"]);
    expect(lit("/hub/unit/lookahead/")).toEqual(["Path"]);
    expect(lit("/hub/profile/")).toEqual(["Profile"]);
    expect(lit("/coach/daily/")).toEqual(["Profile"]);
    expect(lit("/hub/library/")).toEqual(["Library"]);
    expect(lit("/learn/")).toEqual(["Library"]);
    expect(lit("/algorithms/oll/")).toEqual(["Algorithms"]);
  });
});
