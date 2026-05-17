import { cookies } from "next/headers";
import { getCurrentFiscalYear } from "@/lib/utils";

export async function getSelectedYear(): Promise<number> {
  const store = await cookies();
  const val = store.get("fiscal-year")?.value;
  if (val) {
    const n = parseInt(val);
    if (!isNaN(n) && n >= 2020 && n <= 2100) return n;
  }
  return getCurrentFiscalYear();
}
