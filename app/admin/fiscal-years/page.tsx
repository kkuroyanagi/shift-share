import Link from "next/link";
import { db } from "@/lib/db";
import { fiscalYears } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { createFiscalYear, deleteFiscalYear } from "@/app/actions/fiscal-years";
import { getCurrentFiscalYear } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function FiscalYearsPage() {
  const years = await db.select().from(fiscalYears).orderBy(desc(fiscalYears.year));
  const suggestYear = getCurrentFiscalYear();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">年度管理</h1>

      <Card>
        <CardHeader>
          <CardTitle>年度を作成</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFiscalYear} className="flex gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="year">年度</Label>
              <Input
                id="year"
                name="year"
                type="number"
                min={2020}
                max={2100}
                defaultValue={suggestYear}
                className="w-32"
                required
              />
            </div>
            <Button type="submit">作成</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>年度</TableHead>
                <TableHead>期間</TableHead>
                <TableHead>設定</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {years.map((fy) => (
                <TableRow key={fy.id}>
                  <TableCell className="font-medium">{fy.year}年度</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {fy.year}/4/1 〜 {fy.year + 1}/3/31
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/fiscal-years/${fy.year}/business-days`}
                        className="text-sm text-primary hover:underline"
                      >
                        営業日
                      </Link>
                      <Link
                        href={`/admin/fiscal-years/${fy.year}/templates`}
                        className="text-sm text-primary hover:underline"
                      >
                        テンプレート
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={deleteFiscalYear}>
                      <input type="hidden" name="id" value={fy.id} />
                      <Button variant="destructive" size="sm" type="submit">削除</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {years.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    年度が登録されていません
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
