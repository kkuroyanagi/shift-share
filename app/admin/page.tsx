import Link from "next/link";
import { db } from "@/lib/db";
import { fiscalYears, shiftSlots, workers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSelectedYear } from "@/lib/year";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminPage() {
  const selectedYear = await getSelectedYear();

  const [fy, allWorkers] = await Promise.all([
    db.select().from(fiscalYears).where(eq(fiscalYears.year, selectedYear)).limit(1),
    db.select().from(workers),
  ]);

  const slotCount = fy.length
    ? (await db.select().from(shiftSlots).where(eq(shiftSlots.fiscalYearId, fy[0].id))).length
    : 0;

  const links = [
    { href: "/admin/workers", label: "従業員管理", desc: `${allWorkers.length}名登録中` },
    { href: "/admin/fiscal-years", label: "年度管理", desc: "営業日・テンプレート設定" },
    { href: "/admin/shifts", label: "シフト枠一覧", desc: `${slotCount}枠` },
    { href: "/dashboard", label: "ダッシュボード", desc: "公平性確認" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">管理者メニュー</h1>
      <p className="text-muted-foreground">選択中の年度: {selectedYear}年度</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="cursor-pointer hover:shadow-md hover:border-primary transition-all h-full">
              <CardHeader>
                <CardTitle className="text-lg">{l.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{l.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
