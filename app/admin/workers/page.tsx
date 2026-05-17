import { db } from "@/lib/db";
import { workers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { addWorker, deleteWorker } from "@/app/actions/workers";
import { formatMinutes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function WorkersPage() {
  const allWorkers = await db.select().from(workers).orderBy(asc(workers.name));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">従業員管理</h1>

      {/* 追加フォーム */}
      <Card>
        <CardHeader>
          <CardTitle>従業員を追加</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={addWorker} className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1">
              <Label htmlFor="name">名前</Label>
              <Input id="name" name="name" required placeholder="田中 太郎" className="w-48" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="desiredHoursPerMonth">月間希望時間 (h)</Label>
              <Input
                id="desiredHoursPerMonth"
                name="desiredHoursPerMonth"
                type="number"
                min={0}
                max={744}
                defaultValue={0}
                className="w-28"
              />
            </div>
            <Button type="submit">追加</Button>
          </form>
        </CardContent>
      </Card>

      {/* 一覧 */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead className="text-right">月間希望時間</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allWorkers.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-medium">{w.name}</TableCell>
                  <TableCell className="text-right">{formatMinutes(w.desiredHoursPerMonth)}</TableCell>
                  <TableCell className="text-right">
                    <form action={deleteWorker}>
                      <input type="hidden" name="id" value={w.id} />
                      <Button variant="destructive" size="sm" type="submit">削除</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {allWorkers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground">まだ登録されていません</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
