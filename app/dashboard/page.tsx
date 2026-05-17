import { db } from "@/lib/db";
import { shiftAssignments, shiftSlots, workers, fiscalYears } from "@/lib/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { getSelectedYear } from "@/lib/year";
import { durationMinutes, formatMinutes, stdDev } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const MONTHS = ["4月","5月","6月","7月","8月","9月","10月","11月","12月","1月","2月","3月"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const selectedYear = await getSelectedYear();

  const fy = await db
    .select()
    .from(fiscalYears)
    .where(eq(fiscalYears.year, selectedYear))
    .limit(1);

  if (!fy.length) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p>年度が設定されていません。</p>
        <p className="mt-1 text-sm">管理者ページで年度を作成してください。</p>
      </div>
    );
  }

  const fiscalYearId = fy[0].id;

  // 月フィルター計算
  const selectedMonth = monthParam ? parseInt(monthParam) : null; // 1-12 or null = 全体
  const calMonth = selectedMonth !== null
    ? selectedMonth >= 4 ? selectedMonth : selectedMonth + 12  // 4〜15 の内部表現
    : null;

  // 割当済みシフトを取得
  const assignments = await db
    .select({
      workerId: shiftAssignments.workerId,
      date: shiftSlots.date,
      startTime: shiftSlots.startTime,
      endTime: shiftSlots.endTime,
      status: shiftAssignments.status,
    })
    .from(shiftAssignments)
    .innerJoin(shiftSlots, eq(shiftAssignments.shiftSlotId, shiftSlots.id))
    .where(
      and(
        eq(shiftSlots.fiscalYearId, fiscalYearId),
        selectedMonth !== null
          ? sql`EXTRACT(MONTH FROM ${shiftSlots.date}::date) = ${selectedMonth}`
          : undefined,
      ),
    );

  const allWorkers = await db.select().from(workers).orderBy(workers.name);

  // 従業員ごとの集計
  const stats = allWorkers.map((w) => {
    const workerAssignments = assignments.filter((a) => a.workerId === w.id);
    const confirmed = workerAssignments.filter((a) => a.status === "confirmed");
    const tentative = workerAssignments.filter((a) => a.status === "tentative");

    const assignedMin = confirmed.reduce(
      (sum, a) => sum + durationMinutes(a.startTime, a.endTime),
      0,
    );
    const tentativeMin = tentative.reduce(
      (sum, a) => sum + durationMinutes(a.startTime, a.endTime),
      0,
    );

    // 月指定なし = 年度全体 (希望×12)、月指定あり = 月単位希望
    const desiredMin = selectedMonth !== null ? w.desiredHoursPerMonth : w.desiredHoursPerMonth * 12;
    const deviationMin = assignedMin - desiredMin;
    const deviationRate = desiredMin > 0 ? (deviationMin / desiredMin) * 100 : null;

    return { worker: w, assignedMin, tentativeMin, desiredMin, deviationMin, deviationRate };
  });

  const fairnessScore = stdDev(stats.filter((s) => s.desiredMin > 0).map((s) => s.deviationMin));

  function deviationBadge(rate: number | null) {
    if (rate === null) return <Badge variant="outline">-</Badge>;
    const abs = Math.abs(rate);
    if (abs <= 10) return <Badge variant="success">{rate > 0 ? "+" : ""}{rate.toFixed(1)}%</Badge>;
    if (abs <= 20) return <Badge variant="warning">{rate > 0 ? "+" : ""}{rate.toFixed(1)}%</Badge>;
    return <Badge variant="destructive">{rate > 0 ? "+" : ""}{rate.toFixed(1)}%</Badge>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <span className="text-muted-foreground text-sm">{selectedYear}年度</span>
      </div>

      {/* 月セレクター */}
      <div className="flex gap-2 flex-wrap">
        <a
          href="/dashboard"
          className={`px-3 py-1 rounded-md text-sm border transition-colors ${!selectedMonth ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
        >
          年度全体
        </a>
        {MONTHS.map((label, i) => {
          const m = i < 9 ? i + 4 : i - 8; // 4〜12, 1〜3
          return (
            <a
              key={m}
              href={`/dashboard?month=${m}`}
              className={`px-3 py-1 rounded-md text-sm border transition-colors ${selectedMonth === m ? "bg-primary text-primary-foreground" : "hover:bg-accent"}`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {/* 公平性スコア */}
      <Card>
        <CardHeader>
          <CardTitle>公平性スコア</CardTitle>
          <CardDescription>乖離の標準偏差（小さいほど公平）</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{formatMinutes(Math.round(fairnessScore))}</p>
        </CardContent>
      </Card>

      {/* 従業員別一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>従業員別 勤務時間</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead className="text-right">希望時間</TableHead>
                <TableHead className="text-right">確定</TableHead>
                <TableHead className="text-right">仮割当</TableHead>
                <TableHead className="text-right">乖離</TableHead>
                <TableHead className="text-right">乖離率</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.map(({ worker, assignedMin, tentativeMin, desiredMin, deviationMin, deviationRate }) => (
                <TableRow key={worker.id}>
                  <TableCell className="font-medium">{worker.name}</TableCell>
                  <TableCell className="text-right">{formatMinutes(desiredMin)}</TableCell>
                  <TableCell className="text-right">{formatMinutes(assignedMin)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">{formatMinutes(tentativeMin)}</TableCell>
                  <TableCell className="text-right">{formatMinutes(deviationMin)}</TableCell>
                  <TableCell className="text-right">{deviationBadge(deviationRate)}</TableCell>
                </TableRow>
              ))}
              {stats.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">従業員が登録されていません</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
