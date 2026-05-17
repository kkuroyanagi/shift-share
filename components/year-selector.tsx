"use client";

import { setFiscalYear } from "@/app/actions/year";

export function YearSelector({ years, currentYear }: { years: number[]; currentYear: number }) {
  return (
    <form action={setFiscalYear}>
      <select
        name="year"
        defaultValue={currentYear}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}年度
          </option>
        ))}
      </select>
    </form>
  );
}
