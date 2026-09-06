import { z } from "zod";
import {
  DISTRACTION_CATEGORIES,
  EVIDENCE_TYPES,
  MILESTONE_STATUSES,
  PROJECT_STATUSES,
} from "./constants";

const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

const optionalUrl = z
  .string()
  .trim()
  .max(1000, "URL too long")
  .optional()
  .or(z.literal(""))
  .refine(
    (v) => !v || /^https?:\/\/\S+$/i.test(v),
    "Must be a valid http(s) URL",
  );

const scoreSchema = z
  .number({ message: "Score must be a number" })
  .int()
  .min(1, "Score must be between 1 and 10")
  .max(10, "Score must be between 1 and 10");

export const primaryObjectiveSchema = z.object({
  objective: z
    .string()
    .trim()
    .min(1, "Objective is required")
    .max(300, "Objective too long"),
});

export const focusSessionInputSchema = z.object({
  date: dateKeySchema,
  durationMinutes: z.number().int().min(1).max(8 * 60),
  objective: z.string().trim().min(1, "Objective is required").max(300),
  accomplishment: z.string().trim().max(2000).optional().or(z.literal("")),
  output: z.string().trim().max(2000).optional().or(z.literal("")),
  blocker: z.string().trim().max(2000).optional().or(z.literal("")),
  focusScore: scoreSchema.nullable().optional(),
  evidenceUrl: optionalUrl,
  evidenceType: z.enum(EVIDENCE_TYPES).optional().default("LIVE_PRODUCT"),
});

export const dailyLogInputSchema = z.object({
  date: dateKeySchema,
  primaryObjective: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal("")),
  deepWorkMinutes: z.number().int().min(0).max(24 * 60).default(0),
  technicalGrowth: scoreSchema.nullable().optional(),
  outputScore: scoreSchema.nullable().optional(),
  businessScore: scoreSchema.nullable().optional(),
  disciplineScore: scoreSchema.nullable().optional(),
  focusScore: scoreSchema.nullable().optional(),
  whatWentWell: z.string().trim().max(3000).optional().or(z.literal("")),
  whatWentWrong: z.string().trim().max(3000).optional().or(z.literal("")),
  whatIAmAvoiding: z.string().trim().max(3000).optional().or(z.literal("")),
  highestLeverageNextAction: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),
});

export const distractionInputSchema = z.object({
  date: dateKeySchema,
  category: z.enum(DISTRACTION_CATEGORIES),
  minutes: z.number().int().min(1, "Minutes must be at least 1").max(24 * 60),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

const nullableDateKey = dateKeySchema.nullable().optional().or(z.literal(""));

export const projectInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(PROJECT_STATUSES).default("IDEA"),
  startDate: nullableDateKey,
  targetDate: nullableDateKey,
  primaryObjective: z.string().trim().max(500).optional().or(z.literal("")),
  currentMilestone: z
    .string()
    .trim()
    .max(500)
    .optional()
    .or(z.literal("")),
  nextAction: z.string().trim().max(500).optional().or(z.literal("")),
  users: z.number().int().min(0).default(0),
  revenue: z.number().min(0).default(0),
});

export const milestoneInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(MILESTONE_STATUSES).default("PLANNED"),
  targetDate: nullableDateKey,
  completedDate: nullableDateKey,
  evidenceUrl: optionalUrl,
});

export const milestoneStatusSchema = z.object({
  status: z.enum(MILESTONE_STATUSES),
});

export const projectStatusSchema = z.object({
  status: z.enum(PROJECT_STATUSES),
});

export const skillInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(60),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  level: z.number().int().min(0).max(6).default(0),
});

export const skillEvidenceInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  type: z.enum(EVIDENCE_TYPES).default("LIVE_PRODUCT"),
  url: z.string().trim().min(1, "URL is required").regex(/^https?:\/\/\S+$/i),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const businessMetricInputSchema = z.object({
  date: dateKeySchema,
  peopleContacted: z.number().int().min(0).default(0),
  conversations: z.number().int().min(0).default(0),
  problemsDiscovered: z.number().int().min(0).default(0),
  demos: z.number().int().min(0).default(0),
  trials: z.number().int().min(0).default(0),
  payingCustomers: z.number().int().min(0).default(0),
  revenue: z.number().min(0).default(0),
  retention: z.number().min(0).max(1).default(0),
});

export const weeklyReviewInputSchema = z.object({
  weekStartDate: dateKeySchema,
  accomplished: z.string().trim().max(4000).optional().or(z.literal("")),
  notAccomplished: z.string().trim().max(4000).optional().or(z.literal("")),
  avoiding: z.string().trim().max(4000).optional().or(z.literal("")),
  wastedTime: z.string().trim().max(4000).optional().or(z.literal("")),
  mostLeverage: z.string().trim().max(4000).optional().or(z.literal("")),
  stopDoing: z.string().trim().max(4000).optional().or(z.literal("")),
  startDoing: z.string().trim().max(4000).optional().or(z.literal("")),
  nextObjective: z.string().trim().max(500).optional().or(z.literal("")),
});

export const evidenceInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  type: z.enum(EVIDENCE_TYPES).default("LIVE_PRODUCT"),
  url: z.string().trim().min(1, "URL is required").regex(/^https?:\/\/\S+$/i),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  relatedType: z.string().optional().or(z.literal("")),
  relatedId: z.string().optional().or(z.literal("")),
});

export type FocusSessionInput = z.infer<typeof focusSessionInputSchema>;
export type DailyLogInput = z.infer<typeof dailyLogInputSchema>;
export type DistractionInput = z.infer<typeof distractionInputSchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
export type MilestoneInput = z.infer<typeof milestoneInputSchema>;
export type SkillInput = z.infer<typeof skillInputSchema>;
export type SkillEvidenceInput = z.infer<typeof skillEvidenceInputSchema>;
export type BusinessMetricInput = z.infer<typeof businessMetricInputSchema>;
export type WeeklyReviewInput = z.infer<typeof weeklyReviewInputSchema>;
export type EvidenceInput = z.infer<typeof evidenceInputSchema>;