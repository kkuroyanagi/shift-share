"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CalendarCell } from "./calendar-cell";

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

interface CalendarProps {
  year: number;
  month: number;
  slots: ShiftSlot[];
  assignments?: ShiftAssignment[];
  workers?: Worker[];
  mode?: "admin" | "worker";
  currentWorkerId?: string;
  onDateClick?: (date: string) => void;
  onSlotClick?: (slotId: string) => void;
  onMonthChange?: (month: number) => void;
}

export function Calendar({
  year,
  month,
  slots,
  assignments = [],
  workers = [],
  mode = "admin",
  currentWorkerId,
  onDateClick,
  onSlotClick,
  onMonthChange,
}: CalendarProps) {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  const endDate = new Date(lastDay);
  endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));

  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    currentWeek.push(new Date(current));
    if (current.getDay() === 6) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    current.setDate(current.getDate() + 1);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  // Group slots by date
  const slotsByDate = new Map<string, ShiftSlot[]>();
  slots.forEach(slot => {
    if (!slotsByDate.has(slot.date)) {
      slotsByDate.set(slot.date, []);
    }
    slotsByDate.get(slot.date)!.push(slot);
  });

  // Group assignments by slot ID
  const assignmentsBySlot = new Map<string, ShiftAssignment[]>();
  assignments.forEach(assignment => {
    if (!assignmentsBySlot.has(assignment.shiftSlotId)) {
      assignmentsBySlot.set(assignment.shiftSlotId, []);
    }
    assignmentsBySlot.get(assignment.shiftSlotId)!.push(assignment);
  });

  const workersMap = new Map(workers.map(w => [w.id, w]));

  const handlePrevMonth = () => {
    const newMonth = month === 1 ? 12 : month - 1;
    onMonthChange?.(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = month === 12 ? 1 : month + 1;
    onMonthChange?.(newMonth);
  };

  const MONTHS = [
    "1月", "2月", "3月", "4月", "5月", "6月",
    "7月", "8月", "9月", "10月", "11月", "12月"
  ];

  const DAYS = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">
            {year}年 {MONTHS[month - 1]}
          </h2>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {DAYS.map((day, index) => (
            <div
              key={day}
              className={cn(
                "p-2 text-center text-sm font-medium",
                index === 0 && "text-red-600", // Sunday
                index === 6 && "text-blue-600"  // Saturday
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7">
            {week.map((date) => {
              const dateStr = date.toISOString().split('T')[0];
              const daySlots = slotsByDate.get(dateStr) || [];
              const isCurrentMonth = date.getMonth() === month - 1;
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <CalendarCell
                  key={dateStr}
                  date={date}
                  dateStr={dateStr}
                  isCurrentMonth={isCurrentMonth}
                  isToday={isToday}
                  slots={daySlots}
                  assignments={daySlots.flatMap(slot => 
                    assignmentsBySlot.get(slot.id) || []
                  )}
                  workers={workersMap}
                  mode={mode}
                  currentWorkerId={currentWorkerId}
                  onDateClick={onDateClick}
                  onSlotClick={onSlotClick}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}