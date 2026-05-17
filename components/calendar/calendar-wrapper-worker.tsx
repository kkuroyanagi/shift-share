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

interface CalendarWrapperWorkerProps {
  year: number;
  month: number;
  slots: ShiftSlot[];
  assignments: ShiftAssignment[];
  workers: Worker[];
  workerId: string;
}

export function CalendarWrapperWorker({ 
  year, 
  month, 
  slots, 
  assignments, 
  workers,
  workerId 
}: CalendarWrapperWorkerProps) {
  const router = useRouter();

  return (
    <Calendar
      year={year}
      month={month}
      slots={slots}
      assignments={assignments}
      workers={workers}
      mode="worker"
      currentWorkerId={workerId}
      onSlotClick={(slotId) => {
        router.push(`/admin/shifts/${slotId}`);
      }}
      onMonthChange={(newMonth) => {
        router.push(`/worker/${workerId}?month=${newMonth}&view=calendar`);
      }}
    />
  );
}