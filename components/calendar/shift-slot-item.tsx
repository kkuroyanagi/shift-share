"use client";
import { cn, formatTime } from "@/lib/utils";

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

interface ShiftSlotItemProps {
  slot: ShiftSlot;
  assignments: ShiftAssignment[];
  workers: Map<string, Worker>;
  mode: "admin" | "worker";
  currentWorkerId?: string;
  onClick?: () => void;
}

export function ShiftSlotItem({
  slot,
  assignments,
  workers,
  mode,
  currentWorkerId,
  onClick,
}: ShiftSlotItemProps) {
  const confirmedAssignments = assignments.filter(a => a.status === "confirmed");
  const tentativeAssignments = assignments.filter(a => a.status === "tentative");
  const assignedCount = confirmedAssignments.length;
  const isFull = assignedCount >= slot.requiredCount;
  
  // Check if current worker is assigned
  const currentWorkerAssignment = currentWorkerId 
    ? assignments.find(a => a.workerId === currentWorkerId)
    : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  // Get background color based on status
  const getSlotColor = () => {
    if (mode === "worker" && currentWorkerAssignment) {
      return currentWorkerAssignment.status === "confirmed" 
        ? "bg-blue-100 border-blue-300" 
        : "bg-yellow-100 border-yellow-300";
    }
    
    if (slot.status === "confirmed") {
      return "bg-green-100 border-green-300";
    }
    
    if (isFull) {
      return "bg-gray-100 border-gray-300";
    }
    
    return "bg-white border-gray-200";
  };

  const getDisplayText = () => {
    if (mode === "admin") {
      return `${assignedCount}/${slot.requiredCount}`;
    }
    
    if (currentWorkerAssignment) {
      return currentWorkerAssignment.status === "confirmed" ? "確定" : "申請中";
    }
    
    return isFull ? "満" : "空";
  };

  return (
    <div
      className={cn(
        "text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-all",
        getSlotColor()
      )}
      onClick={handleClick}
    >
      <div className="font-medium">
        {formatTime(slot.startTime)}-{formatTime(slot.endTime)}
      </div>
      
      <div className="flex justify-between items-center mt-1">
        <span className={cn(
          "text-xs",
          mode === "worker" && currentWorkerAssignment?.status === "confirmed" && "text-blue-700",
          mode === "worker" && currentWorkerAssignment?.status === "tentative" && "text-yellow-700",
          slot.status === "confirmed" && "text-green-700"
        )}>
          {getDisplayText()}
        </span>
        
        {slot.status === "confirmed" && (
          <span className="text-xs text-green-600">✓</span>
        )}
      </div>

      {/* Show worker names in admin mode for small slots */}
      {mode === "admin" && confirmedAssignments.length > 0 && confirmedAssignments.length <= 2 && (
        <div className="mt-1 space-y-0.5">
          {confirmedAssignments.slice(0, 2).map(assignment => {
            const worker = workers.get(assignment.workerId);
            return (
              <div key={assignment.workerId} className="text-xs text-gray-600 truncate">
                {worker?.name || "不明"}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}