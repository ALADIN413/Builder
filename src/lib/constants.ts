export const PROJECT_STATUSES = [
  "IDEA",
  "RESEARCH",
  "BUILDING",
  "TESTING",
  "LAUNCHED",
  "GROWING",
  "PAUSED",
  "KILLED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const MILESTONE_STATUSES = [
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "BLOCKED",
] as const;
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number];

export const EVIDENCE_TYPES = [
  "GITHUB",
  "LIVE_PRODUCT",
  "SCREENSHOT",
  "DOCUMENT",
  "CUSTOMER",
  "PAYMENT",
  "METRIC",
  "OTHER",
] as const;
export type EvidenceType = (typeof EVIDENCE_TYPES)[number];

export const DISTRACTION_CATEGORIES = [
  "YOUTUBE",
  "SOCIAL_MEDIA",
  "GAMING",
  "ENTERTAINMENT",
  "RANDOM_BROWSING",
  "MESSAGING",
  "OTHER",
] as const;
export type DistractionCategory = (typeof DISTRACTION_CATEGORIES)[number];

export const SKILL_LEVELS = [
  { value: 0, label: "Unknown" },
  { value: 1, label: "Beginner" },
  { value: 2, label: "Basic" },
  { value: 3, label: "Functional" },
  { value: 4, label: "Strong" },
  { value: 5, label: "Advanced" },
  { value: 6, label: "Exceptional" },
] as const;

export const FOCUS_PRESETS = [30, 60, 90, 120] as const;

export const DEEP_WORK_TARGET_MINUTES = 120;

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const EVIDENCE_TYPE_LABELS: Record<EvidenceType, string> = {
  GITHUB: "GitHub",
  LIVE_PRODUCT: "Live Product",
  SCREENSHOT: "Screenshot",
  DOCUMENT: "Document",
  CUSTOMER: "Customer",
  PAYMENT: "Payment",
  METRIC: "Metric",
  OTHER: "Other",
};

export const DISTRACTION_LABELS: Record<DistractionCategory, string> = {
  YOUTUBE: "YouTube",
  SOCIAL_MEDIA: "Social Media",
  GAMING: "Gaming",
  ENTERTAINMENT: "Entertainment",
  RANDOM_BROWSING: "Random Browsing",
  MESSAGING: "Messaging",
  OTHER: "Other",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  IDEA: "Idea",
  RESEARCH: "Research",
  BUILDING: "Building",
  TESTING: "Testing",
  LAUNCHED: "Launched",
  GROWING: "Growing",
  PAUSED: "Paused",
  KILLED: "Killed",
};

export const MILESTONE_STATUS_LABELS: Record<MilestoneStatus, string> = {
  PLANNED: "Planned",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  BLOCKED: "Blocked",
};