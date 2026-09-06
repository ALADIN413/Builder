import { describe, expect, it } from "vitest";
import {
  computeFounderScore,
  deepWorkScore,
  SCORE_LABELS,
} from "@/lib/scoring";

describe("deepWorkScore", () => {
  it("scores the daily target (120 min) as 10", () => {
    expect(deepWorkScore(120)).toBe(10);
  });

  it("is proportional at half the target", () => {
    expect(deepWorkScore(60)).toBe(5);
  });

  it("scores 90 minutes as 7.5 with one-decimal rounding", () => {
    expect(deepWorkScore(90)).toBe(7.5);
  });

  it("is 0 for no deep work", () => {
    expect(deepWorkScore(0)).toBe(0);
  });

  it("clamps above the target to 10", () => {
    expect(deepWorkScore(240)).toBe(10);
  });

  it("clamps negatives/absurd inputs to 0", () => {
    expect(deepWorkScore(-50)).toBe(0);
  });
});

describe("computeFounderScore", () => {
  it("returns all zeros when nothing is provided", () => {
    const score = computeFounderScore({ deepWorkMinutes: 0 });
    expect(score).toEqual({
      deepWork: 0,
      technical: 0,
      output: 0,
      business: 0,
      discipline: 0,
      total: 0,
    });
  });

  it("treats null scores as 0", () => {
    const score = computeFounderScore({
      deepWorkMinutes: 0,
      technical: null,
      output: null,
      business: null,
      discipline: null,
    });
    expect(score.total).toBe(0);
  });

  it("reaches 50 with a perfect day", () => {
    const score = computeFounderScore({
      deepWorkMinutes: 120,
      technical: 10,
      output: 10,
      business: 10,
      discipline: 10,
    });
    expect(score.total).toBe(50);
  });

  it("clamps the deep-work component so the total never exceeds 50", () => {
    const score = computeFounderScore({
      deepWorkMinutes: 600,
      technical: 10,
      output: 10,
      business: 10,
      discipline: 10,
    });
    expect(score.deepWork).toBe(10);
    expect(score.total).toBe(50);
  });

  it("sums rounded components", () => {
    const score = computeFounderScore({
      deepWorkMinutes: 30, // 2.5
      technical: 2.5,
      output: 7,
      business: 3,
      discipline: 9,
    });
    expect(score.total).toBe(24);
  });

  it("exposes labels for every component", () => {
    expect(Object.keys(SCORE_LABELS)).toHaveLength(5);
    expect(SCORE_LABELS.deepWork).toBe("Deep Work");
  });
});