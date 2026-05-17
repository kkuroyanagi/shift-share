"use server";

import { db } from "@/lib/db";
import { shiftSlots } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const slotSchema = z.object({
  fiscalYearId: z.string().uuid(),
  date: z.string().min(1),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  requiredCount: z.coerce.number().int().min(1),
});

export async function addSlot(formData: FormData) {
  const data = slotSchema.parse({
    fiscalYearId: formData.get("fiscalYearId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    requiredCount: formData.get("requiredCount") ?? 1,
  });
  await db.insert(shiftSlots).values({
    ...data,
    startTime: data.startTime + ":00",
    endTime: data.endTime + ":00",
  });
  revalidatePath("/admin/shifts");
}

export async function deleteSlot(formData: FormData) {
  const id = formData.get("id") as string;
  await db.delete(shiftSlots).where(eq(shiftSlots.id, id));
  revalidatePath("/admin/shifts");
}

export async function confirmSlot(formData: FormData) {
  const id = formData.get("id") as string;
  await db.update(shiftSlots).set({ status: "confirmed" }).where(eq(shiftSlots.id, id));
  revalidatePath(`/admin/shifts/${id}`);
  revalidatePath("/admin/shifts");
}
