"use server";

import { db } from "@/lib/db";
import { businessDayRules, closedDates } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// 営業曜日を一括保存（既存を削除して再登録）
export async function saveBusinessDays(formData: FormData) {
  const fiscalYearId = formData.get("fiscalYearId") as string;
  const year = formData.get("year") as string;

  const selected: number[] = [];
  for (let i = 0; i <= 6; i++) {
    if (formData.get(`dow_${i}`) === "on") selected.push(i);
  }

  await db.delete(businessDayRules).where(eq(businessDayRules.fiscalYearId, fiscalYearId));
  if (selected.length > 0) {
    await db.insert(businessDayRules).values(selected.map((d) => ({ fiscalYearId, dayOfWeek: d })));
  }
  revalidatePath(`/admin/fiscal-years/${year}/business-days`);
}

export async function addClosedDate(formData: FormData) {
  const fiscalYearId = formData.get("fiscalYearId") as string;
  const year = formData.get("year") as string;
  const date = z.string().min(1).parse(formData.get("date"));
  const name = z.string().min(1).parse(formData.get("name"));

  await db.insert(closedDates).values({ fiscalYearId, date, name });
  revalidatePath(`/admin/fiscal-years/${year}/business-days`);
}

export async function deleteClosedDate(formData: FormData) {
  const id = formData.get("id") as string;
  const year = formData.get("year") as string;
  await db.delete(closedDates).where(eq(closedDates.id, id));
  revalidatePath(`/admin/fiscal-years/${year}/business-days`);
}
