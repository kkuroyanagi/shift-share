import { db } from "@/lib/db";
import { businessDayRules, closedDates, fiscalYears } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { addClosedDate, deleteClosedDate, saveBusinessDays } from "@/app/actions/business-days";
import { dayOfWeekName } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DAYS = [1, 2, 3, 4, 5, 6, 0]; // 月〜日の順

export default async function BusinessDaysPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearStr } = await params;
  const yearNum = parseInt(yearStr);

  const fy = await db
    .select()
    .from(fiscalYears)
    .where(eq(fiscalYears.year, yearNum))
    .limit(1);
  if (!fy.length) notFound();

  const [rules, closed] = await Promise.all([
    db.select().from(businessDayRules).where(eq(businessDayRules.fiscalYearId, fy[0].id)),
    db.select().from(closedDates).where(eq(closedDates.fiscalYearId, fy[0].id)).orderBy(asc(closedDates.date)),
  ]);

  const openSet = new Set(rules.map((r) => r.dayOfWeek));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{yearNum}年度 営業日設定</h1>

      {/* 営業曜日 */}
      <Card>
        <CardHeader>
          <CardTitle>営業曜日</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveBusinessDays} className="space-y-4">
            <input type="hidden" name="fiscalYearId" value={fy[0].id} />
            <input type="hidden" name="year" value={yearNum} />
            <div className="flex flex-wrap gap-4">
              {DAYS.map((d) => (
                <label key={d} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name={`dow_${d}`}
                    defaultChecked={openSet.has(d)}
                    className="h-4 w-4 rounded border-input"
                  />
                  <span className="font-medium">{dayOfWeekName(d)}</span>
                </label>
              ))}
            </div>
            <Button type="submit">保存</Button>
          </form>
        </CardContent>
      </Card>

      {/* 休業日 */}
      <Card>
        <CardHeader>
          <CardTitle>休業日</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action={addClosedDate} className="flex flex-wrap gap-3 items-end">
            <input type="hidden" name="fiscalYearId" value={fy[0].id} />
            <input type="hidden" name="year" value={yearNum} />
            <div className="space-y-1">
              <Label htmlFor="date">日付</Label>
              <Input id="date" name="date" type="date" required className="w-44" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="name">名称</Label>
              <Input id="name" name="name" required placeholder="元日" className="w-40" />
            </div>
            <Button type="submit">追加</Button>
          </form>

          {closed.length > 0 && (
            <ul className="space-y-2">
              {closed.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span>
                    <span className="font-medium">{c.date}</span>
                    <span className="text-muted-foreground ml-2">{c.name}</span>
                  </span>
                  <form action={deleteClosedDate}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="year" value={yearNum} />
                    <Button variant="ghost" size="sm" type="submit">削除</Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
          {closed.length === 0 && (
            <p className="text-sm text-muted-foreground">休業日が登録されていません</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
