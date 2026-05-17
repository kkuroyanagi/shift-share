"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DaysOfWeekSelectorProps {
  value: number[];
  onChange: (daysOfWeek: number[]) => void;
  name?: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: "月", shortLabel: "月" },
  { value: 2, label: "火", shortLabel: "火" },
  { value: 3, label: "水", shortLabel: "水" },
  { value: 4, label: "木", shortLabel: "木" },
  { value: 5, label: "金", shortLabel: "金" },
  { value: 6, label: "土", shortLabel: "土" },
  { value: 0, label: "日", shortLabel: "日" },
];

export function DaysOfWeekSelector({ value, onChange, name }: DaysOfWeekSelectorProps) {
  const handleChange = (dayValue: number, checked: boolean) => {
    if (checked) {
      onChange([...value, dayValue]);
    } else {
      onChange(value.filter((day) => day !== dayValue));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-4">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day.value} className="flex items-center space-x-2">
            <Checkbox
              id={`day-${day.value}`}
              checked={value.includes(day.value)}
              onCheckedChange={(checked) =>
                handleChange(day.value, checked === true)
              }
            />
            <Label
              htmlFor={`day-${day.value}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {day.label}
            </Label>
          </div>
        ))}
      </div>
      {/* Hidden input for form submission */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={JSON.stringify(value)}
        />
      )}
    </div>
  );
}