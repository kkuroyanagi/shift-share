import { db } from "@/lib/db";
import { availabilities, fiscalYears, workers } from "@/lib/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getSelectedYear } from "@/lib/year";
import { upsertAvailability, deleteAvailability } from "@/app/actions/availabilities";
import { formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const PREFERENCE_LABELS: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  preferred: { label: "希望", variant: "success" },
  available:  { label: "可能", variant: "warning" },
  unavailable: { label: "不可", variant: "destructive" },
};

export default async function AvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const selectedYear = await getSelectedYear();

  const worker = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!worker.length) notFound();

  const fy = await db.select().from(fiscalYears).where(eq(fiscalYears.year, selectedYear)).limit(1);
  const fiscalYearId = fy[0]?.id;

  const avails = fiscalYearId
    ? await db
        .select()
        .from(availabilities)
        .where(and(eq(availabilities.workerId, id), eq(availabilities.fiscalYearId, fiscalYearId)))
        .orderBy(asc(availabilities.date))
    : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{worker[0].name}さんの希望提出</h1>
      <p className="text-muted-foreground">{selectedYear}年度</p>

      {/* 提出フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>希望を追加</CardTitle>
        </CardHeader>
        <CardContent>
          {fiscalYearId ? (
            <form action={upsertAvailability} className="flex flex-wrap gap-3 items-end">
              <input type="hidden" name="fiscalYearId" value={fiscalYearId} />
              <input type="hidden" name="workerId" value={id} />
              <div className="space-y-1">
                <Label>日付</Label>
                <Input name="date" type="date" required className="w-44" />
              </div>
              <div className="space-y-1">
                <Label>開始</Label>
                <Input name="startTime" type="time" required defaultValue="09:00" className="w-32" />
              </div>
              <div className="space-y-1">
                <Label>終了</Label>
                <Input name="endTime" type="time" required defaultValue="17:00" className="w-32" />
              </div>
              <div className="space-y-1">
                <Label>希望度</Label>
                <Select name="preference" className="w-28">
                  <option value="preferred">希望</option>
                  <option value="available">可能</option>
                  <option value="unavailable">不可</option>
                </Select>
              </div>
              <Button type="submit">提出</Button>
            </form>
          ) : (
            <p className="text-muted-foreground text-sm">年度が設定されていません。管理者に連絡してください。</p>
          )}
        </CardContent>
      </Card>

      {/* 提出済み一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>提出済み</CardTitle>
        </CardHeader>
        <CardContent>
          {avails.length === 0 ? (
            <p className="text-sm text-muted-foreground">まだ提出していません</p>
          ) : (
            <ul className="space-y-2">
              {avails.map((a) => {
                const pref = PREFERENCE_LABELS[a.preference];
                return (
                  <li key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{a.date}</span>
                      <span className="text-muted-foreground text-sm">
                        {formatTime(a.startTime)} 〜 {formatTime(a.endTime)}
                      </span>
                      <Badge variant={pref.variant}>{pref.label}</Badge>
                    </div>
                    <form action={deleteAvailability}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="workerId" value={id} />
                      <Button variant="ghost" size="sm" type="submit">削除</Button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
