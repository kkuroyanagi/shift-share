import Link from "next/link";
import { db } from "@/lib/db";
import { fiscalYears } from "@/lib/db/schema";
import { getSelectedYear } from "@/lib/year";
import { YearSelector } from "@/components/year-selector";
import { asc } from "drizzle-orm";

export async function Header() {
  const [years, currentYear] = await Promise.all([
    db.select({ year: fiscalYears.year }).from(fiscalYears).orderBy(asc(fiscalYears.year)),
    getSelectedYear(),
  ]);

  return (
    <header className="border-b bg-card sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="font-bold text-lg tracking-tight">
          Shift Share
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
            ダッシュボード
          </Link>
          <Link href="/admin" className="px-3 py-1.5 rounded-md hover:bg-accent transition-colors">
            管理者
          </Link>
        </nav>

        <YearSelector years={years.map((y) => y.year)} currentYear={currentYear} />
      </div>
    </header>
  );
}
