"use server";

import { db } from "@/lib/db";
import { shiftAssignments } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function applyShift(formData: FormData) {
  const slotId = z.string().uuid().parse(formData.get("slotId"));
  const workerId = z.string().uuid().parse(formData.get("workerId"));

  await db.insert(shiftAssignments).values({
    shiftSlotId: slotId,
    workerId,
    source: "applied",
    status: "tentative",
  });
  revalidatePath(`/worker/${workerId}`);
  revalidatePath(`/admin/shifts/${slotId}`);
}

export async function withdrawShift(formData: FormData) {
  const slotId = z.string().uuid().parse(formData.get("slotId"));
  const workerId = z.string().uuid().parse(formData.get("workerId"));

  await db
    .delete(shiftAssignments)
    .where(and(eq(shiftAssignments.shiftSlotId, slotId), eq(shiftAssignments.workerId, workerId)));
  revalidatePath(`/worker/${workerId}`);
  revalidatePath(`/admin/shifts/${slotId}`);
}

export async function assignWorker(formData: FormData) {
  const slotId = z.string().uuid().parse(formData.get("slotId"));
  const workerId = z.string().uuid().parse(formData.get("workerId"));

  await db.insert(shiftAssignments).values({
    shiftSlotId: slotId,
    workerId,
    source: "assigned",
    status: "tentative",
  });
  revalidatePath(`/admin/shifts/${slotId}`);
  revalidatePath("/dashboard");
}

export async function removeAssignment(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const slotId = formData.get("slotId") as string;
  await db.delete(shiftAssignments).where(eq(shiftAssignments.id, id));
  revalidatePath(`/admin/shifts/${slotId}`);
  revalidatePath("/dashboard");
}

export async function confirmAssignments(formData: FormData) {
  const slotId = z.string().uuid().parse(formData.get("slotId"));
  await db
    .update(shiftAssignments)
    .set({ status: "confirmed" })
    .where(eq(shiftAssignments.shiftSlotId, slotId));
  revalidatePath(`/admin/shifts/${slotId}`);
  revalidatePath("/dashboard");
}
