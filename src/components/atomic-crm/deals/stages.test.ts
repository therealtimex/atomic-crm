import { describe, it, expect } from "vitest";
import { getDealsByStage } from "./stages";
import type { Deal } from "../types";

describe("getDealsByStage", () => {
  const mockDealStages = [
    { value: "stage1", label: "Stage 1" },
    { value: "stage2", label: "Stage 2" },
  ];

  it("should group deals by stage", () => {
    const deals = [
      { id: 1, stage: "stage1", index: 0, name: "Deal 1" },
      { id: 2, stage: "stage2", index: 0, name: "Deal 2" },
      { id: 3, stage: "stage1", index: 1, name: "Deal 3" },
    ] as unknown as Deal[];

    const result = getDealsByStage(deals, mockDealStages);

    expect(result["stage1"]).toHaveLength(2);
    expect(result["stage2"]).toHaveLength(1);
    expect(result["stage1"].map((d) => d.name)).toEqual(["Deal 1", "Deal 3"]);
  });

  it("should ignore deals with unknown stages instead of crashing", () => {
    const deals = [
      { id: 1, stage: "stage1", index: 0, name: "Deal 1" },
      { id: 4, stage: "unknown_stage", index: 0, name: "Deal 4" }, // Malformed data
    ] as unknown as Deal[];

    const result = getDealsByStage(deals, mockDealStages);

    expect(result["stage1"]).toHaveLength(1);
    expect(result).not.toHaveProperty("unknown_stage");
  });

  it("should handle empty deal list", () => {
    const deals: Deal[] = [];
    const result = getDealsByStage(deals, mockDealStages);
    expect(result["stage1"]).toEqual([]);
    expect(result["stage2"]).toEqual([]);
  });

  it("should sort deals by index", () => {
    const deals = [
      { id: 1, stage: "stage1", index: 2, name: "Deal 1" },
      { id: 3, stage: "stage1", index: 1, name: "Deal 3" },
    ] as unknown as Deal[];

    const result = getDealsByStage(deals, mockDealStages);
    expect(result["stage1"][0].index).toBe(1);
    expect(result["stage1"][1].index).toBe(2);
  });
});
