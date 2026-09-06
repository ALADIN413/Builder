import { DEEP_WORK_TARGET_MINUTES } from "./constants";

export type FounderScoreComponents = {
  deepWork: number; // 0-10
  technical: number; // 0-10
  output: number; // 0-10
  business: number; // 0-10
  discipline: number; // 0-10
};

export type FounderScoreResult = FounderScoreComponents & {
  total: number; // 0-50
};

/** Deep work score derived from minutes worked vs daily target (120). */
export function deepWorkScore(deepWorkMinutes: number): number {
  const raw = (deepWorkMinutes / DEEP_WORK_TARGET_MINUTES) * 10;
  return roundOneDecimals(clamp(raw, 0, 10));
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function roundOneDecimals(v: number): number {
  return Math.round(v * 10) / 10;
}

/** Build the full Founder Score dataset (each component 0-10, total 0-50). */
export function computeFounderScore(args: {
  deepWorkMinutes: number;
  technical?: number | null;
  output?: number | null;
  business?: number | null;
  discipline?: number | null;
}): FounderScoreResult {
  const technical = args.technical ?? 0;
  const output = args.output ?? 0;
  const business = args.business ?? 0;
  const discipline = args.discipline ?? 0;

  const components: FounderScoreComponents = {
    deepWork: deepWorkScore(args.deepWorkMinutes),
    technical,
    output,
    business,
    discipline,
  };

  const total = roundOneDecimals(
    components.deepWork +
      components.technical +
      components.output +
      components.business +
      components.discipline,
  );

  return { ...components, total };
}

export const SCORE_LABELS: Record<keyof FounderScoreComponents, string> = {
  deepWork: "Deep Work",
  technical: "Technical",
  output: "Output",
  business: "Business",
  discipline: "Discipline",
};