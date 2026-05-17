import { db } from "@/lib/db";
import { fiscalYears, shiftTemplates } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { addTemplate, deleteTemplate, generateSlotsFromTemplates } from "@/app/actions/templates";
import { dayOfWeekName, formatTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const DAYS = [1, 2, 3, 4, 5, 6, 0];

export default async function TemplatesPage({ params }: { params: Promise<{ year: string }> }) {
  const { year: yearStr } = await params;
  const yearNum = parseInt(yearStr);

  const fy = await db.select().from(fiscalYears).where(eq(fiscalYears.year, yearNum)).limit(1);
  if (!fy.length) notFound();

  const templates = await db
    .select()
    .from(shiftTemplates)
    .where(eq(shiftTemplates.fiscalYearId, fy[0].id))
    .orderBy(asc(shiftTemplates.dayOfWeek), asc(shiftTemplates.startTime));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{yearNum}年度 シフトテンプレート</h1>

      {/* 追加フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>テンプレートを追加</CardTitle>
          <CardDescription>曜日・時間・必要人数のパターンを定義します</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addTemplate} className="flex flex-wrap gap-3 items-end">
            <input type="hidden" name="fiscalYearId" value={fy[0].id} />
            <input type="hidden" name="year" value={yearNum} />
            <div className="space-y-1">
              <Label>曜日</Label>
              <Select name="dayOfWeek" className="w-24">
                {DAYS.map((d) => (
                  <option key={d} value={d}>{dayOfWeekName(d)}</option>
                ))}
              </Select>
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

      {/* テンプレート一覧 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>曜日</TableHead>
                <TableHead>時間帯</TableHead>
                <TableHead className="text-right">必要人数</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Badge variant="secondary">{dayOfWeekName(t.dayOfWeek)}</Badge>
                  </TableCell>
                  <TableCell>{formatTime(t.startTime)} 〜 {formatTime(t.endTime)}</TableCell>
                  <TableCell className="text-right">{t.requiredCount}名</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteTemplate}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="year" value={yearNum} />
                      <Button variant="ghost" size="sm" type="submit">削除</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {templates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    テンプレートが登録されていません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 年度展開 */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>年度一括生成</CardTitle>
            <CardDescription>
              テンプレートから {yearNum}/4/1〜{yearNum + 1}/3/31 の全シフト枠を生成します。
              既存の枠には影響しません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={generateSlotsFromTemplates}>
              <input type="hidden" name="fiscalYearId" value={fy[0].id} />
              <input type="hidden" name="year" value={yearNum} />
              <Button type="submit">シフト枠を一括生成</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
