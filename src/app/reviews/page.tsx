import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, addWeeks, format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { aggregateMonth, aggregateWeek } from "@/lib/aggregations";
import { requireUser, resolveViewer } from "@/lib/auth";
import { fromDateKey, toDateKey, weekEnd, weekStart } from "@/lib/date";
import { WeeklyReviewForm } from "@/components/reviews/weekly-review-form";
import { MonthlyView } from "@/components/reviews/monthly-view";
import { TabBar } from "@/components/reviews/tabs";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Reviews" };

export default async function ReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; week?: string; month?: string; view?: string }>;
}) {
  const params = await searchParams;
  const current = await requireUser();
  const { user, isSelf } = await resolveViewer(params, current);
  const viewQs = params.view && params.view !== current.id ? params.view : "";
  const period = params.period === "monthly" ? "monthly" : "weekly";

  if (period === "monthly") {
    const today = new Date();
    const month =
      params.month && /^\d{4}-\d{2}$/.test(params.month)
        ? params.month
        : format(today, "yyyy-MM");
    const months = await historyForMonths(month, user.id);

    return (
      <PageShell period="monthly" weekKey="" month={month} view={viewQs}>
        <MonthlyView
          month={month}
          agg={months.agg}
          history={months.history}
          readOnly={!isSelf}
        />
      </PageShell>
    );
  }

  const today = new Date();
  const weekKey =
    params.week && /^\d{4}-\d{2}-\d{2}$/.test(params.week) ? params.week : toDateKey(weekStart(today));
  const weekStartDate = fromDateKey(weekKey);
  const weekStartDisp = weekStartDate;
  const weekEndDisp = weekEnd(weekStartDate);

  const agg = await aggregateWeek(weekStartDate, weekEndDisp, user.id);
  const existing = await prisma.weeklyReview.findUnique({
    where: { userId_weekStartDate: { userId: user.id, weekStartDate } },
  });

  const initialAnswers: Record<string, string> = existing
    ? {
        accomplished: existing.accomplished ?? "",
        notAccomplished: existing.notAccomplished ?? "",
        avoiding: existing.avoiding ?? "",
        wastedTime: existing.wastedTime ?? "",
        mostLeverage: existing.mostLeverage ?? "",
        stopDoing: existing.stopDoing ?? "",
        startDoing: existing.startDoing ?? "",
        nextObjective: existing.nextObjective ?? "",
      }
    : {};

  return (
    <PageShell
      period="weekly"
      weekKey={weekKey}
      month=""
      view={viewQs}
      weekLabel={`${format(weekStartDisp, "MMM d")} – ${format(weekEndDisp, "MMM d, yyyy")}`}
    >
      <WeeklyReviewForm weekKey={weekKey} agg={agg} initial={initialAnswers} readOnly={!isSelf} />
    </PageShell>
  );
}

async function historyForMonths(currentMonth: string, userId: string) {
  const [y, m] = currentMonth.split("-").map(Number);
  const currentStart = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const currentEnd = new Date(y, m, 0, 23, 59, 59, 999);
  const agg = await aggregateMonth(currentStart, currentEnd, userId);

  const history: { month: string; avgFounderScore: number; deepWorkMinutes: number; revenue: number; customers: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentStart);
    d.setMonth(d.getMonth() - i);
    const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const a = await aggregateMonth(start, end, userId);
    history.push({
      month: format(start, "MMM"),
      avgFounderScore: a.avgFounderScore,
      deepWorkMinutes: a.deepWorkMinutes,
      revenue: a.revenue,
      customers: a.customers,
    });
  }
  return { agg, history };
}

function PageShell({
  period,
  weekKey,
  month,
  view,
  weekLabel,
  children,
}: {
  period: "weekly" | "monthly";
  weekKey: string;
  month: string;
  view?: string;
  weekLabel?: string;
  children: React.ReactNode;
}) {
  const today = new Date();
  const isWeekly = period === "weekly";
  const v = view ? `&view=${view}` : "";

  return (
    <div className="fade-up flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-text">Reviews</h1>
          <p className="text-sm text-faint">
            {isWeekly ? "Look at the week straight. Answer honestly." : "Monthly view. No clutter."}
          </p>
        </div>
        <TabBar period={period} weekKey={weekKey} month={month} view={view} />
      </header>

      <div className="flex items-center gap-2">
        {isWeekly ? (
          <>
            <Link href={`/reviews?period=weekly&week=${toDateKey(addWeeks(fromDateKey(weekKey), -1))}${v}`}>
              <Button variant="ghost" size="icon" aria-label="Previous week">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="min-w-44 text-center font-mono text-sm tabular text-muted">
              {weekLabel}
            </span>
            <Link href={`/reviews?period=weekly&week=${toDateKey(addWeeks(fromDateKey(weekKey), 1))}${v}`}>
              <Button variant="ghost" size="icon" aria-label="Next week">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <span className="mx-2 h-4 w-px bg-border" />
            <Link href={`/reviews?period=weekly&week=${toDateKey(weekStart(today))}${v}`}>
              <Button variant="secondary" size="sm">This week</Button>
            </Link>
          </>
        ) : (
          <>
            <Link href={`/reviews?period=monthly&month=${format(addMonths(new Date(`${month}-01`), -1), "yyyy-MM")}${v}`}>
              <Button variant="ghost" size="icon" aria-label="Previous month">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="min-w-32 text-center font-mono text-sm tabular text-muted">{month}</span>
            <Link href={`/reviews?period=monthly&month=${format(addMonths(new Date(`${month}-01`), 1), "yyyy-MM")}${v}`}>
              <Button variant="ghost" size="icon" aria-label="Next month">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
            <span className="mx-2 h-4 w-px bg-border" />
            <Link href={`/reviews?period=monthly&month=${format(today, "yyyy-MM")}${v}`}>
              <Button variant="secondary" size="sm">This month</Button>
            </Link>
          </>
        )}
      </div>

      {children}
    </div>
  );
}