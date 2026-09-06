-- CreateTable
CREATE TABLE "DailyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "primaryObjective" TEXT NOT NULL,
    "deepWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "technicalGrowth" INTEGER,
    "outputScore" INTEGER,
    "businessScore" INTEGER,
    "disciplineScore" INTEGER,
    "focusScore" INTEGER,
    "whatWentWell" TEXT,
    "whatWentWrong" TEXT,
    "whatIAmAvoiding" TEXT,
    "highestLeverageNextAction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FocusSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "startTime" DATETIME,
    "endTime" DATETIME,
    "durationMinutes" INTEGER NOT NULL,
    "objective" TEXT NOT NULL,
    "accomplishment" TEXT,
    "output" TEXT,
    "blocker" TEXT,
    "focusScore" INTEGER,
    "evidenceUrl" TEXT,
    "evidenceType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Distraction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "SkillEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkillEvidence_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDEA',
    "startDate" DATETIME,
    "targetDate" DATETIME,
    "primaryObjective" TEXT,
    "currentMilestone" TEXT,
    "nextAction" TEXT,
    "users" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "targetDate" DATETIME,
    "completedDate" DATETIME,
    "evidenceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BusinessMetric" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "peopleContacted" INTEGER NOT NULL DEFAULT 0,
    "conversations" INTEGER NOT NULL DEFAULT 0,
    "problemsDiscovered" INTEGER NOT NULL DEFAULT 0,
    "demos" INTEGER NOT NULL DEFAULT 0,
    "trials" INTEGER NOT NULL DEFAULT 0,
    "payingCustomers" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "retention" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WeeklyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weekStartDate" DATETIME NOT NULL,
    "deepWorkSessions" INTEGER NOT NULL DEFAULT 0,
    "deepWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "avgFocus" REAL NOT NULL DEFAULT 0,
    "projectsProgressed" INTEGER NOT NULL DEFAULT 0,
    "projectsShipped" INTEGER NOT NULL DEFAULT 0,
    "peopleContacted" INTEGER NOT NULL DEFAULT 0,
    "customerConversations" INTEGER NOT NULL DEFAULT 0,
    "payingCustomers" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "distractionMinutes" INTEGER NOT NULL DEFAULT 0,
    "avgFounderScore" REAL NOT NULL DEFAULT 0,
    "accomplished" TEXT,
    "notAccomplished" TEXT,
    "avoiding" TEXT,
    "wastedTime" TEXT,
    "mostLeverage" TEXT,
    "stopDoing" TEXT,
    "startDoing" TEXT,
    "nextObjective" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MonthlyReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "month" TEXT NOT NULL,
    "deepWorkMinutes" INTEGER NOT NULL DEFAULT 0,
    "outputScore" REAL NOT NULL DEFAULT 0,
    "technicalCapability" REAL NOT NULL DEFAULT 0,
    "projectsCount" INTEGER NOT NULL DEFAULT 0,
    "users" INTEGER NOT NULL DEFAULT 0,
    "customers" INTEGER NOT NULL DEFAULT 0,
    "revenue" REAL NOT NULL DEFAULT 0,
    "customerConversations" INTEGER NOT NULL DEFAULT 0,
    "distractionMinutes" INTEGER NOT NULL DEFAULT 0,
    "avgFounderScore" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "description" TEXT,
    "relatedType" TEXT,
    "relatedId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "BusinessMetric_date_key" ON "BusinessMetric"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WeeklyReview_weekStartDate_key" ON "WeeklyReview"("weekStartDate");

-- CreateIndex
CREATE UNIQUE INDEX "MonthlyReview_month_key" ON "MonthlyReview"("month");
