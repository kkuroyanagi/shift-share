"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setFiscalYear(formData: FormData) {
  const year = parseInt(formData.get("year") as string);
  if (!isNaN(year) && year >= 2020 && year <= 2100) {
    const store = await cookies();
    store.set("fiscal-year", year.toString(), { path: "/" });
  }
  revalidatePath("/", "layout");
}
