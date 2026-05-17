"use server";

import { db } from "@/lib/db";
import { fiscalYears } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

export async function createFiscalYear(formData: FormData) {
  const year = z.coerce.number().int().min(2020).max(2100).parse(formData.get("year"));
  await db.insert(fiscalYears).values({ year });

  // 新しく作成した年度に自動切替
  const store = await cookies();
  store.set("fiscal-year", year.toString(), { path: "/" });

  revalidatePath("/admin/fiscal-years");
  redirect("/admin/fiscal-years");
}

export async function deleteFiscalYear(formData: FormData) {
  const id = formData.get("id") as string;
  await db.delete(fiscalYears).where(eq(fiscalYears.id, id));
  revalidatePath("/admin/fiscal-years");
}
