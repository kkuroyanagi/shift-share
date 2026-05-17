import { db } from "@/lib/db";
import { shiftAssignments, shiftSlots, workers } from "@/lib/db/schema";
import { eq, notInArray } from "drizzle-orm";
import { notFound } from "next/navigation";
import { assignWorker, confirmAssignments, removeAssignment } from "@/app/actions/assignments";
import { confirmSlot, deleteSlot } from "@/app/actions/slots";
import { formatTime, durationMinutes, formatMinutes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ShiftDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const slot = await db.select().from(shiftSlots).where(eq(shiftSlots.id, id)).limit(1);
  if (!slot.length) notFound();
  const s = slot[0];

  const assignments = await db
    .select({ id: shiftAssignments.id, workerId: shiftAssignments.workerId, source: shiftAssignments.source, status: shiftAssignments.status, name: workers.name })
    .from(shiftAssignments)
    .innerJoin(workers, eq(shiftAssignments.workerId, workers.id))
    .where(eq(shiftAssignments.shiftSlotId, id));

  const assignedWorkerIds = assignments.map((a) => a.workerId);

  const unassignedWorkers = assignedWorkerIds.length
    ? await db.select().from(workers).where(notInArray(workers.id, assignedWorkerIds))
    : await db.select().from(workers);

  const duration = durationMinutes(s.startTime, s.endTime);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{s.date}</h1>
          <p className="text-muted-foreground">
            {formatTime(s.startTime)} 〜 {formatTime(s.endTime)}
            <span className="ml-2">（{formatMinutes(duration)}）</span>
          </p>
        </div>
        <Badge variant={s.status === "confirmed" ? "success" : "secondary"} className="text-sm px-3 py-1">
          {s.status === "confirmed" ? "確定済" : "オープン"}
        </Badge>
      </div>

      {/* 割当済み */}
      <Card>
        <CardHeader>
          <CardTitle>割当状況 ({assignments.length}/{s.requiredCount}名)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>名前</TableHead>
                <TableHead>種別</TableHead>
                <TableHead>ステータス</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.source === "applied" ? "応募" : "割当"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={a.status === "confirmed" ? "success" : "secondary"}>
                      {a.status === "confirmed" ? "確定" : "仮"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={removeAssignment}>
                      <input type="hidden" name="id" value={a.id} />
                      <input type="hidden" name="slotId" value={id} />
                      <Button variant="ghost" size="sm" type="submit">外す</Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {assignments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">まだ割当なし</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* 従業員を追加 */}
          {unassignedWorkers.length > 0 && (
            <form action={assignWorker} className="flex gap-2 items-center">
              <input type="hidden" name="slotId" value={id} />
              <Select name="workerId" className="flex-1 max-w-xs">
                {unassignedWorkers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </Select>
              <Button type="submit" variant="outline">割当</Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* アクション */}
      <div className="flex gap-3 flex-wrap">
        {s.status === "open" && assignments.length > 0 && (
          <form action={confirmAssignments}>
            <input type="hidden" name="slotId" value={id} />
            <Button type="submit">割当を確定する</Button>
          </form>
        )}
        {s.status === "open" && (
          <form action={confirmSlot}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="secondary">枠を確定済みにする</Button>
          </form>
        )}
        <form action={deleteSlot}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" variant="destructive">枠を削除</Button>
        </form>
      </div>
    </div>
  );
}
