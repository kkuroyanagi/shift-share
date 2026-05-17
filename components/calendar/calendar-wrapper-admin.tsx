"use client";
import { useRouter } from "next/navigation";
import { Calendar } from "./calendar";

interface ShiftSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  requiredCount: number;
  status: "open" | "confirmed";
}

interface ShiftAssignment {
  shiftSlotId: string;
  workerId: string;
  status: "tentative" | "confirmed";
}

interface Worker {
  id: string;
  name: string;
}

interface CalendarWrapperAdminProps {
  year: number;
  month: number;
  slots: ShiftSlot[];
  assignments: ShiftAssignment[];
  workers: Worker[];
}

export function CalendarWrapperAdmin({ 
  year, 
  month, 
  slots, 
  assignments, 
  workers 
}: CalendarWrapperAdminProps) {
  const router = useRouter();

  return (
    <Calendar
      year={year}
      month={month}
      slots={slots}
      assignments={assignments}
      workers={workers}
      mode="admin"
      onSlotClick={(slotId) => {
        router.push(`/admin/shifts/${slotId}`);
      }}
      onMonthChange={(newMonth) => {
        router.push(`/admin/shifts?month=${newMonth}&view=calendar`);
      }}
    />
  );
}