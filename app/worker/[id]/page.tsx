import { db } from "@/lib/db";
import { fiscalYears, shiftAssignments, shiftSlots, workers } from "@/lib/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getSelectedYear } from "@/lib/year";
import { applyShift, withdrawShift } from "@/app/actions/assignments";
import { formatTime, durationMinutes, formatMinutes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function WorkerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  const { id } = await params;
  const { month: monthParam } = await searchParams;
  const selectedYear = await getSelectedYear();

  const worker = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!worker.length) notFound();
  const w = worker[0];

  const fy = await db.select().from(fiscalYears).where(eq(fiscalYears.year, selectedYear)).limit(1);
  const fiscalYearId = fy[0]?.id;

  const selectedMonth = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;

  // この月のオープンなシフト枠をすべて取得
  const allSlots = fiscalYearId
    ? await db
        .select()
        .from(shiftSlots)
        .where(
          and(
            eq(shiftSlots.fiscalYearId, fiscalYearId),
            sql`EXTRACT(MONTH FROM ${shiftSlots.date}::date) = ${selectedMonth}`,
          ),
        )
        .orderBy(asc(shiftSlots.date), asc(shiftSlots.startTime))
    : [];

  // 自分の割当
  const myAssignments = fiscalYearId
    ? await db
        .select({ shiftSlotId: shiftAssignments.shiftSlotId, status: shiftAssignments.status })
        .from(shiftAssignments)
        .where(eq(shiftAssignments.workerId, id))
    : [];
  const mySlotIds = new Set(myAssignments.map((a) => a.shiftSlotId));
  const myConfirmedMap = new Map(myAssignments.map((a) => [a.shiftSlotId, a.status]));

  // 月合計
  const confirmedSlots = allSlots.filter(
    (s) => mySlotIds.has(s.id) && myConfirmedMap.get(s.id) === "confirmed",
  );
  const totalConfirmedMin = confirmedSlots.reduce(
    (sum, s) => sum + durationMinutes(s.startTime, s.endTime),
    0,
  );
  const deviationMin = totalConfirmedMin - w.desiredHoursPerMonth;

  const grouped = new Map<string, typeof allSlots>();
  for (const slot of allSlots) {
    if (!grouped.has(slot.date)) grouped.set(slot.date, []);
    grouped.get(slot.date)!.push(slot);
  }

  const MONTHS = ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{w.name}さんのシフト</h1>
          <p className="text-muted-foreground text-sm">{selectedYear}年度</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/worker/${id}/availability`}>
            <Button variant="outline" size="sm">希望提出</Button>
          </Link>
          <Link href={`/worker/${id}/settings`}>
            <Button variant="ghost" size="sm">設定</Button>
          </Link>
        </div>
      </div>

      {/* 月サマリー */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">希望</p>
            <p className="text-xl font-bold">{formatMinutes(w.desiredHoursPerMonth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">確定</p>
            <p className="text-xl font-bold">{formatMinutes(totalConfirmedMin)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-xs text-muted-foreground">乖離</p>
            <p className={`text-xl font-bold ${deviationMin < 0 ? "text-destructive" : deviationMin > 0 ? "text-green-600" : ""}`}>
              {deviationMin > 0 ? "+" : ""}{formatMinutes(deviationMin)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 月タブ */}
      <div className="flex gap-2 flex-wrap">
        {MONTHS.map((label, i) => {
          const m = i < 9 ? i + 4 : i - 8;
          return (
            <Link
              key={m}
              href={`/worker/${id}?month=${m}`}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${selectedMonth === m ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* シフト一覧 */}
      {grouped.size === 0 ? (
        <p className="text-center text-muted-foreground py-12">この月にシフト枠がありません</p>
      ) : (
        <div className="space-y-3">
          {Array.from(grouped.entries()).map(([date, daySlots]) => (
            <Card key={date}>
              <CardContent className="py-4">
                <p className="font-semibold mb-2">{date}</p>
                <div className="flex flex-wrap gap-2">
                  {(daySlots as typeof allSlots).map((slot) => {
                    const isApplied = mySlotIds.has(slot.id);
                    const status = myConfirmedMap.get(slot.id);
                    return (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-md border text-sm ${isApplied ? "bg-blue-50 border-blue-200" : "bg-background"}`}
                      >
                        <p className="font-medium">{formatTime(slot.startTime)}〜{formatTime(slot.endTime)}</p>
                        <p className="text-muted-foreground text-xs">{formatMinutes(durationMinutes(slot.startTime, slot.endTime))}</p>
                        {isApplied ? (
                          <div className="mt-2 space-y-1">
                            <Badge variant={status === "confirmed" ? "success" : "warning"}>
                              {status === "confirmed" ? "確定" : "申請中"}
                            </Badge>
                            {status !== "confirmed" && (
                              <form action={withdrawShift}>
                                <input type="hidden" name="slotId" value={slot.id} />
                                <input type="hidden" name="workerId" value={id} />
                                <Button variant="ghost" size="sm" type="submit" className="h-6 text-xs">取消</Button>
                              </form>
                            )}
                          </div>
                        ) : slot.status === "open" ? (
                          <form action={applyShift} className="mt-2">
                            <input type="hidden" name="slotId" value={slot.id} />
                            <input type="hidden" name="workerId" value={id} />
                            <Button size="sm" type="submit" className="h-7 text-xs">応募</Button>
                          </form>
                        ) : (
                          <Badge variant="secondary" className="mt-2">確定済</Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
