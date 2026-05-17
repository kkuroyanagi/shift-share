"use server";

import { db } from "@/lib/db";
import {
  recurringAvailabilityPatterns,
  recurringPatternApplications,
  availabilities,
  fiscalYears,
} from "@/lib/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// パターン作成・更新用スキーマ
const patternSchema = z.object({
  workerId: z.string().uuid(),
  fiscalYearId: z.string().uuid(),
  name: z.string().min(1),
  daysOfWeek: z.array(z.number().int().min(0).max(6)), // 0=日, 1=月, ..., 6=土
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  preference: z.enum(["preferred", "available", "unavailable"]),
});

// パターン適用用スキーマ
const applyPatternSchema = z.object({
  patternId: z.string().uuid(),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

// パターン作成
export async function createRecurringPattern(formData: FormData) {
  const data = patternSchema.parse({
    workerId: formData.get("workerId"),
    fiscalYearId: formData.get("fiscalYearId"),
    name: formData.get("name"),
    daysOfWeek: JSON.parse(formData.get("daysOfWeek") as string),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    preference: formData.get("preference"),
  });

  const [pattern] = await db
    .insert(recurringAvailabilityPatterns)
    .values({
      ...data,
      startTime: data.startTime + ":00",
      endTime: data.endTime + ":00",
    })
    .returning();

  revalidatePath(`/worker/${data.workerId}/recurring-availability`);
  return pattern;
}

// パターン更新
export async function updateRecurringPattern(formData: FormData) {
  const id = formData.get("id") as string;
  const data = patternSchema.partial().parse({
    name: formData.get("name"),
    daysOfWeek: formData.get("daysOfWeek") ? JSON.parse(formData.get("daysOfWeek") as string) : undefined,
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    preference: formData.get("preference"),
  });

  const updateData = { ...data };
  if (data.startTime) updateData.startTime = data.startTime + ":00";
  if (data.endTime) updateData.endTime = data.endTime + ":00";

  await db
    .update(recurringAvailabilityPatterns)
    .set(updateData)
    .where(eq(recurringAvailabilityPatterns.id, id));

  const pattern = await db
    .select()
    .from(recurringAvailabilityPatterns)
    .where(eq(recurringAvailabilityPatterns.id, id))
    .limit(1);

  if (pattern[0]) {
    revalidatePath(`/worker/${pattern[0].workerId}/recurring-availability`);
  }
}

// パターン削除
export async function deleteRecurringPattern(formData: FormData) {
  const id = formData.get("id") as string;
  const workerId = formData.get("workerId") as string;

  await db
    .delete(recurringAvailabilityPatterns)
    .where(eq(recurringAvailabilityPatterns.id, id));

  revalidatePath(`/worker/${workerId}/recurring-availability`);
}

// パターン適用（期間指定で一括生成）
export async function applyRecurringPattern(formData: FormData) {
  const data = applyPatternSchema.parse({
    patternId: formData.get("patternId"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  // パターン情報を取得
  const pattern = await db
    .select()
    .from(recurringAvailabilityPatterns)
    .where(eq(recurringAvailabilityPatterns.id, data.patternId))
    .limit(1);

  if (!pattern[0]) {
    throw new Error("パターンが見つかりません");
  }

  const { workerId, fiscalYearId, daysOfWeek, startTime, endTime, preference } = pattern[0];

  // 期間内の該当曜日を算出
  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);
  const applicableDates: string[] = [];

  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = date.getDay(); // 0=日, 1=月, ..., 6=土
    if (daysOfWeek.includes(dayOfWeek)) {
      applicableDates.push(date.toISOString().split("T")[0]);
    }
  }

  // 既存の競合チェック（同じ日付・従業員）
  const existingAvailabilities = await db
    .select()
    .from(availabilities)
    .where(
      and(
        eq(availabilities.workerId, workerId),
        eq(availabilities.fiscalYearId, fiscalYearId),
        gte(availabilities.date, data.startDate),
        lte(availabilities.date, data.endDate)
      )
    );

  const existingDates = new Set(existingAvailabilities.map((a) => a.date));
  const newDates = applicableDates.filter((date) => !existingDates.has(date));

  // 新規希望を一括挿入
  if (newDates.length > 0) {
    await db.insert(availabilities).values(
      newDates.map((date) => ({
        workerId,
        fiscalYearId,
        date,
        startTime,
        endTime,
        preference,
      }))
    );
  }

  // 適用履歴を記録
  await db.insert(recurringPatternApplications).values({
    patternId: data.patternId,
    startDate: data.startDate,
    endDate: data.endDate,
    appliedCount: newDates.length,
  });

  revalidatePath(`/worker/${workerId}/recurring-availability`);
  revalidatePath(`/worker/${workerId}/availability`);

  return {
    totalDates: applicableDates.length,
    appliedDates: newDates.length,
    skippedDates: applicableDates.length - newDates.length,
  };
}

// 適用済みパターンの削除（特定期間の希望を削除）
export async function removeAppliedPattern(formData: FormData) {
  const applicationId = formData.get("applicationId") as string;
  const workerId = formData.get("workerId") as string;

  // 適用履歴を取得
  const application = await db
    .select()
    .from(recurringPatternApplications)
    .where(eq(recurringPatternApplications.id, applicationId))
    .limit(1);

  if (!application[0]) {
    throw new Error("適用履歴が見つかりません");
  }

  const { patternId, startDate, endDate } = application[0];

  // パターン情報を取得
  const pattern = await db
    .select()
    .from(recurringAvailabilityPatterns)
    .where(eq(recurringAvailabilityPatterns.id, patternId))
    .limit(1);

  if (!pattern[0]) {
    throw new Error("パターンが見つかりません");
  }

  // 該当期間・従業員の希望を削除
  await db
    .delete(availabilities)
    .where(
      and(
        eq(availabilities.workerId, pattern[0].workerId),
        eq(availabilities.fiscalYearId, pattern[0].fiscalYearId),
        gte(availabilities.date, startDate),
        lte(availabilities.date, endDate)
      )
    );

  // 適用履歴も削除
  await db
    .delete(recurringPatternApplications)
    .where(eq(recurringPatternApplications.id, applicationId));

  revalidatePath(`/worker/${workerId}/recurring-availability`);
  revalidatePath(`/worker/${workerId}/availability`);
}