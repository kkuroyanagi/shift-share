import Link from "next/link";
import { db } from "@/lib/db";
import { workers } from "@/lib/db/schema";
import { asc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function HomePage() {
  const allWorkers = await db.select().from(workers).orderBy(asc(workers.name));

  return (
    <div className="flex flex-col items-center gap-8 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Shift Share</h1>
        <p className="text-muted-foreground mt-2">担当者を選んでください</p>
      </div>

      {allWorkers.length === 0 ? (
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>従業員が登録されていません。</p>
            <Link href="/admin/workers" className="text-primary underline mt-2 inline-block">
              管理者ページで追加する
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl">
          {allWorkers.map((w) => (
            <Link key={w.id} href={`/worker/${w.id}`}>
              <Card className="cursor-pointer hover:shadow-md hover:border-primary transition-all text-center">
                <CardContent className="py-6">
                  <p className="font-semibold text-lg">{w.name}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
        管理者の方はこちら →
      </Link>
    </div>
  );
}
