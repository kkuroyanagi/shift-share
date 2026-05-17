"use server";

import { db } from "@/lib/db";
import { availabilities } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  fiscalYearId: z.string().uuid(),
  workerId: z.string().uuid(),
  date: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  preference: z.enum(["preferred", "available", "unavailable"]),
});

export async function upsertAvailability(formData: FormData) {
  const data = schema.parse({
    fiscalYearId: formData.get("fiscalYearId"),
    workerId: formData.get("workerId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    preference: formData.get("preference"),
  });

  // 同じ日付・従業員の既存レコードを削除して再登録
  await db
    .delete(availabilities)
    .where(and(eq(availabilities.workerId, data.workerId), eq(availabilities.date, data.date)));

  await db.insert(availabilities).values({
    ...data,
    startTime: data.startTime + ":00",
    endTime: data.endTime + ":00",
  });

  revalidatePath(`/worker/${data.workerId}/availability`);
}

export async function deleteAvailability(formData: FormData) {
  const id = formData.get("id") as string;
  const workerId = formData.get("workerId") as string;
  await db.delete(availabilities).where(eq(availabilities.id, id));
  revalidatePath(`/worker/${workerId}/availability`);
}
