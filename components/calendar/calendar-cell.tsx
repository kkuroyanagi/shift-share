"use client";
import { cn } from "@/lib/utils";
import { ShiftSlotItem } from "./shift-slot-item";

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

interface CalendarCellProps {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  slots: ShiftSlot[];
  assignments: ShiftAssignment[];
  workers: Map<string, Worker>;
  mode: "admin" | "worker";
  currentWorkerId?: string;
  onDateClick?: (date: string) => void;
  onSlotClick?: (slotId: string) => void;
}

export function CalendarCell({
  date,
  dateStr,
  isCurrentMonth,
  isToday,
  slots,
  assignments,
  workers,
  mode,
  currentWorkerId,
  onDateClick,
  onSlotClick,
}: CalendarCellProps) {
  const day = date.getDate();
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;

  // Group assignments by slot
  const assignmentsBySlot = new Map<string, ShiftAssignment[]>();
  assignments.forEach(assignment => {
    if (!assignmentsBySlot.has(assignment.shiftSlotId)) {
      assignmentsBySlot.set(assignment.shiftSlotId, []);
    }
    assignmentsBySlot.get(assignment.shiftSlotId)!.push(assignment);
  });

  const handleDateClick = () => {
    if (isCurrentMonth) {
      onDateClick?.(dateStr);
    }
  };

  return (
    <div
      className={cn(
        "min-h-[120px] border-r border-b p-1 cursor-pointer hover:bg-muted/50 transition-colors",
        !isCurrentMonth && "text-muted-foreground bg-muted/20",
        isToday && "bg-blue-50 border-blue-200",
        isWeekend && isCurrentMonth && "bg-red-50/30"
      )}
      onClick={handleDateClick}
    >
      {/* Date Number */}
      <div className="flex justify-between items-center mb-1">
        <span
          className={cn(
            "text-sm font-medium",
            isToday && "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs",
            isWeekend && "text-red-600"
          )}
        >
          {day}
        </span>
      </div>

      {/* Shift Slots */}
      <div className="space-y-1">
        {slots.slice(0, 3).map((slot) => {
          const slotAssignments = assignmentsBySlot.get(slot.id) || [];
          return (
            <ShiftSlotItem
              key={slot.id}
              slot={slot}
              assignments={slotAssignments}
              workers={workers}
              mode={mode}
              currentWorkerId={currentWorkerId}
              onClick={() => onSlotClick?.(slot.id)}
            />
          );
        })}
        
        {slots.length > 3 && (
          <div className="text-xs text-muted-foreground text-center">
            +{slots.length - 3}件
          </div>
        )}
      </div>
    </div>
  );
}