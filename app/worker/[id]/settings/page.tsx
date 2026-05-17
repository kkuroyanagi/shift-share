import { db } from "@/lib/db";
import { workers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { updateDesiredHours } from "@/app/actions/workers";
import { formatMinutes } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function WorkerSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const worker = await db.select().from(workers).where(eq(workers.id, id)).limit(1);
  if (!worker.length) notFound();
  const w = worker[0];

  const currentHours = Math.round(w.desiredHoursPerMonth / 60);

  return (
    <div className="space-y-6 max-w-md">
      <h1 className="text-2xl font-bold">{w.name}さんの設定</h1>

      <Card>
        <CardHeader>
          <CardTitle>月間希望勤務時間</CardTitle>
          <CardDescription>
            現在: {formatMinutes(w.desiredHoursPerMonth)} / 月
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updateDesiredHours} className="flex gap-3 items-end">
            <input type="hidden" name="id" value={id} />
            <div className="space-y-1 flex-1">
              <Label htmlFor="desiredHoursPerMonth">1ヶ月あたりの希望時間 (h)</Label>
              <Input
                id="desiredHoursPerMonth"
                name="desiredHoursPerMonth"
                type="number"
                min={0}
                max={744}
                defaultValue={currentHours}
                required
              />
            </div>
            <Button type="submit">保存</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
