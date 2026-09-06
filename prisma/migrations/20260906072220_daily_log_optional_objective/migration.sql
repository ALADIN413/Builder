-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "primaryObjective" TEXT NOT NULL DEFAULT '',
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
INSERT INTO "new_DailyLog" ("businessScore", "createdAt", "date", "deepWorkMinutes", "disciplineScore", "focusScore", "highestLeverageNextAction", "id", "outputScore", "primaryObjective", "technicalGrowth", "updatedAt", "whatIAmAvoiding", "whatWentWell", "whatWentWrong") SELECT "businessScore", "createdAt", "date", "deepWorkMinutes", "disciplineScore", "focusScore", "highestLeverageNextAction", "id", "outputScore", "primaryObjective", "technicalGrowth", "updatedAt", "whatIAmAvoiding", "whatWentWell", "whatWentWrong" FROM "DailyLog";
DROP TABLE "DailyLog";
ALTER TABLE "new_DailyLog" RENAME TO "DailyLog";
CREATE UNIQUE INDEX "DailyLog_date_key" ON "DailyLog"("date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
