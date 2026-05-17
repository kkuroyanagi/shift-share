import { db } from "@/lib/db";
import {
  recurringAvailabilityPatterns,
  recurringPatternApplications,
  fiscalYears,
  workers,
} from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getSelectedYear } from "@/lib/year";
import { RecurringAvailabilityManager } from "./recurring-availability-manager";

export default async function RecurringAvailabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const selectedYear = await getSelectedYear();

  const worker = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!worker.length) notFound();

  const fy = await db
    .select()
    .from(fiscalYears)
    .where(eq(fiscalYears.year, selectedYear))
    .limit(1);
  const fiscalYearId = fy[0]?.id;

  const patterns = fiscalYearId
    ? await db
        .select()
        .from(recurringAvailabilityPatterns)
        .where(
          and(
            eq(recurringAvailabilityPatterns.workerId, id),
            eq(recurringAvailabilityPatterns.fiscalYearId, fiscalYearId)
          )
        )
        .orderBy(asc(recurringAvailabilityPatterns.createdAt))
    : [];

  const applications = fiscalYearId
    ? await db
        .select({
          id: recurringPatternApplications.id,
          patternId: recurringPatternApplications.patternId,
          startDate: recurringPatternApplications.startDate,
          endDate: recurringPatternApplications.endDate,
          appliedCount: recurringPatternApplications.appliedCount,
          createdAt: recurringPatternApplications.createdAt,
          patternName: recurringAvailabilityPatterns.name,
        })
        .from(recurringPatternApplications)
        .innerJoin(
          recurringAvailabilityPatterns,
          eq(recurringPatternApplications.patternId, recurringAvailabilityPatterns.id)
        )
        .where(eq(recurringAvailabilityPatterns.workerId, id))
        .orderBy(asc(recurringPatternApplications.createdAt))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{worker[0].name}さんの希望提出</h1>
        <p className="text-muted-foreground">{selectedYear}年度</p>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <a
            href={`/worker/${id}/availability`}
            className="border-b-2 border-transparent py-2 px-1 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-gray-300"
          >
            個別登録
          </a>
          <a
            href={`/worker/${id}/recurring-availability`}
            className="border-b-2 border-blue-500 py-2 px-1 text-sm font-medium text-blue-600"
          >
            定期パターン
          </a>
        </nav>
      </div>

      {fiscalYearId ? (
        <RecurringAvailabilityManager
          workerId={id}
          fiscalYearId={fiscalYearId}
          patterns={patterns}
          applications={applications}
        />
      ) : (
        <div className="text-center text-muted-foreground py-8">
          年度が設定されていません。管理者に連絡してください。
        </div>
      )}
    </div>
  );
}