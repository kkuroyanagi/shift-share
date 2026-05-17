import Link from "next/link";
import { db } from "@/lib/db";
import { fiscalYears, shiftAssignments, shiftSlots, workers } from "@/lib/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { getSelectedYear } from "@/lib/year";
import { addSlot } from "@/app/actions/slots";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CalendarWrapperAdmin } from "@/components/calendar/calendar-wrapper-admin";

export default async function ShiftsPage({ searchParams }: { searchParams: Promise<{ month?: string; view?: string }> }) {
  const { month: monthParam, view: viewParam } = await searchParams;
  const selectedYear = await getSelectedYear();

  const fy = await db.select().from(fiscalYears).where(eq(fiscalYears.year, selectedYear)).limit(1);
  const fiscalYearId = fy[0]?.id;

  const selectedMonth = monthParam ? parseInt(monthParam) : new Date().getMonth() + 1;
  const isCalendarView = viewParam === "calendar";

  const slots = fiscalYearId
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

  // 割当を取得
  const assignments = slots.length
    ? await db
        .select()
        .from(shiftAssignments)
        .where(sql`${shiftAssignments.shiftSlotId} = ANY(ARRAY[${sql.join(slots.map((s) => sql`${s.id}::uuid`))}])`)
    : [];

  // 割当数を取得
  const assignmentCounts = slots.length
    ? await db
        .select({
          slotId: shiftAssignments.shiftSlotId,
          count: sql<number>`count(*)::int`,
        })
        .from(shiftAssignments)
        .where(sql`${shiftAssignments.shiftSlotId} = ANY(ARRAY[${sql.join(slots.map((s) => sql`${s.id}::uuid`))}])`)
        .groupBy(shiftAssignments.shiftSlotId)
    : [];

  const countMap = new Map(assignmentCounts.map((a) => [a.slotId, a.count]));

  // ワーカーを取得
  const allWorkers = await db.select().from(workers);

  // 日付ごとにグループ化
  const grouped = new Map<string, typeof slots>();
  for (const slot of slots) {
    if (!grouped.has(slot.date)) grouped.set(slot.date, []);
    grouped.get(slot.date)!.push(slot);
  }

  const MONTHS = ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">シフト枠一覧 — {selectedYear}年度</h1>
        
        {/* 表示切替 */}
        <div className="flex gap-2">
          <Link
            href={`/admin/shifts?month=${selectedMonth}&view=list`}
            className={`px-3 py-1 rounded-md text-sm border transition-colors ${!isCalendarView ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            リスト表示
          </Link>
          <Link
            href={`/admin/shifts?month=${selectedMonth}&view=calendar`}
            className={`px-3 py-1 rounded-md text-sm border transition-colors ${isCalendarView ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
          >
            カレンダー表示
          </Link>
        </div>
      </div>

      {/* 月タブ */}
      <div className="flex gap-2 flex-wrap">
        {MONTHS.map((label, i) => {
          const m = i < 9 ? i + 4 : i - 8;
          const currentView = isCalendarView ? "calendar" : "list";
          return (
            <Link
              key={m}
              href={`/admin/shifts?month=${m}&view=${currentView}`}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${selectedMonth === m ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* 個別追加 */}
      {fiscalYearId && (
        <Card>
          <CardHeader>
            <CardTitle>シフト枠を個別追加</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addSlot} className="flex flex-wrap gap-3 items-end">
              <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
              <div className="space-y-1">
                <Label>日付</Label>
                <Input name="date" type="date" required className="w-44" />
              </div>
              <div className="space-y-1">
                <Label>開始</Label>
                <Input name="startTime" type="time" required className="w-32" />
              </div>
              <div className="space-y-1">
                <Label>終了</Label>
                <Input name="endTime" type="time" required className="w-32" />
              </div>
              <div className="space-y-1">
                <Label>必要人数</Label>
                <Input name="requiredCount" type="number" min={1} defaultValue={1} className="w-20" />
              </div>
              <Button type="submit">追加</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* カレンダー表示またはリスト表示 */}
      {isCalendarView ? (
        <CalendarWrapperAdmin
          year={selectedYear}
          month={selectedMonth}
          slots={slots}
          assignments={assignments}
          workers={allWorkers}
        />
      ) : (
        /* 日付別一覧 */
        grouped.size === 0 ? (
          <p className="text-muted-foreground text-center py-12">この月にシフト枠がありません</p>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries()).map(([date, daySlots]) => (
              <Card key={date}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{date}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {(daySlots as typeof slots).map((slot) => {
                      const assigned = countMap.get(slot.id) ?? 0;
                      const full = assigned >= slot.requiredCount;
                      return (
                        <Link key={slot.id} href={`/admin/shifts/${slot.id}`}>
                          <div className={`px-3 py-2 rounded-md border text-sm cursor-pointer hover:shadow transition-shadow ${full ? "bg-green-50 border-green-200" : "hover:border-primary"}`}>
                            <p className="font-medium">{formatTime(slot.startTime)}〜{formatTime(slot.endTime)}</p>
                            <p className="text-muted-foreground">{assigned}/{slot.requiredCount}名</p>
                            <Badge variant={slot.status === "confirmed" ? "success" : "secondary"} className="mt-1">
                              {slot.status === "confirmed" ? "確定" : "オープン"}
                            </Badge>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}
    </div>
  );
}
