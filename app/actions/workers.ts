"use server";

import { db } from "@/lib/db";
import { workers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).max(50),
  desiredHoursPerMonth: z.coerce.number().int().min(0).max(744),
});

export async function addWorker(formData: FormData) {
  const parsed = schema.parse({
    name: formData.get("name"),
    desiredHoursPerMonth: formData.get("desiredHoursPerMonth") ?? 0,
  });
  await db.insert(workers).values({
    name: parsed.name,
    desiredHoursPerMonth: parsed.desiredHoursPerMonth * 60, // 時間→分
  });
  revalidatePath("/admin/workers");
}

export async function deleteWorker(formData: FormData) {
  const id = formData.get("id") as string;
  await db.delete(workers).where(eq(workers.id, id));
  revalidatePath("/admin/workers");
}

export async function updateDesiredHours(formData: FormData) {
  const id = formData.get("id") as string;
  const hours = z.coerce.number().int().min(0).max(744).parse(formData.get("desiredHoursPerMonth"));
  await db.update(workers).set({ desiredHoursPerMonth: hours * 60 }).where(eq(workers.id, id));
  revalidatePath(`/worker/${id}/settings`);
  revalidatePath("/dashboard");
  revalidatePath("/admin");
}
