"use server";

import { db } from "@/lib/db";
import { businessDayRules, closedDates, fiscalYears, shiftSlots, shiftTemplates } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const templateSchema = z.object({
  fiscalYearId: z.string().uuid(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  requiredCount: z.coerce.number().int().min(1),
});

export async function addTemplate(formData: FormData) {
  const data = templateSchema.parse({
    fiscalYearId: formData.get("fiscalYearId"),
    dayOfWeek: formData.get("dayOfWeek"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    requiredCount: formData.get("requiredCount") ?? 1,
  });
  // DB には HH:MM:SS 形式で保存
  await db.insert(shiftTemplates).values({
    ...data,
    startTime: data.startTime + ":00",
    endTime: data.endTime + ":00",
  });
  revalidatePath(`/admin/fiscal-years/${formData.get("year")}/templates`);
}

export async function deleteTemplate(formData: FormData) {
  const id = formData.get("id") as string;
  const year = formData.get("year") as string;
  await db.delete(shiftTemplates).where(eq(shiftTemplates.id, id));
  revalidatePath(`/admin/fiscal-years/${year}/templates`);
}

// テンプレートから年度全体のシフト枠を一括生成
export async function generateSlotsFromTemplates(formData: FormData) {
  const fiscalYearId = formData.get("fiscalYearId") as string;
  const yearNum = parseInt(formData.get("year") as string);

  const [templates, rules, closed] = await Promise.all([
    db.select().from(shiftTemplates).where(eq(shiftTemplates.fiscalYearId, fiscalYearId)),
    db.select().from(businessDayRules).where(eq(businessDayRules.fiscalYearId, fiscalYearId)),
    db.select().from(closedDates).where(eq(closedDates.fiscalYearId, fiscalYearId)),
  ]);

  const openDays = new Set(rules.map((r) => r.dayOfWeek));
  const closedSet = new Set(closed.map((c) => c.date));

  const slots: (typeof shiftSlots.$inferInsert)[] = [];
  const start = new Date(yearNum, 3, 1);   // 4月1日
  const end = new Date(yearNum + 1, 2, 31); // 翌3月31日

  for (const cur = new Date(start); cur <= end; cur.setDate(cur.getDate() + 1)) {
    const dow = cur.getDay();
    const dateStr = cur.toISOString().split("T")[0];
    if (!openDays.has(dow) || closedSet.has(dateStr)) continue;

    for (const tpl of templates.filter((t) => t.dayOfWeek === dow)) {
      slots.push({
        fiscalYearId,
        templateId: tpl.id,
        date: dateStr,
        startTime: tpl.startTime,
        endTime: tpl.endTime,
        requiredCount: tpl.requiredCount,
      });
    }
  }

  if (slots.length > 0) {
    // 100件ずつバッチ挿入
    for (let i = 0; i < slots.length; i += 100) {
      await db.insert(shiftSlots).values(slots.slice(i, i + 100));
    }
  }

  revalidatePath("/admin/shifts");
  revalidatePath(`/admin/fiscal-years/${yearNum}/templates`);
}
