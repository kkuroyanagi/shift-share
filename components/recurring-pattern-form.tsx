"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DaysOfWeekSelector } from "./days-of-week-selector";
import { createRecurringPattern, updateRecurringPattern } from "@/app/actions/recurring-availability";

interface RecurringPatternFormProps {
  workerId: string;
  fiscalYearId: string;
  pattern?: {
    id: string;
    name: string;
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    preference: string;
  };
  onSuccess?: () => void;
}

export function RecurringPatternForm({
  workerId,
  fiscalYearId,
  pattern,
  onSuccess,
}: RecurringPatternFormProps) {
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    pattern?.daysOfWeek || [1, 2, 3, 4, 5] // デフォルト: 月〜金
  );

  const isEditing = !!pattern;

  const handleSubmit = async (formData: FormData) => {
    try {
      if (isEditing) {
        await updateRecurringPattern(formData);
      } else {
        await createRecurringPattern(formData);
      }
      onSuccess?.();
    } catch (error) {
      console.error("エラーが発生しました:", error);
      // TODO: エラーハンドリングの改善
    }
  };

  // 時刻フォーマット変換（HH:MM:SS -> HH:MM）
  const formatTimeForInput = (timeString: string) => {
    if (!timeString) return "";
    return timeString.split(":").slice(0, 2).join(":");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isEditing ? "パターンを編集" : "新しいパターンを作成"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {isEditing && (
            <input type="hidden" name="id" value={pattern.id} />
          )}
          <input type="hidden" name="workerId" value={workerId} />
          <input type="hidden" name="fiscalYearId" value={fiscalYearId} />

          <div className="space-y-2">
            <Label htmlFor="name">パターン名</Label>
            <Input
              id="name"
              name="name"
              placeholder="例: 平日パターン"
              defaultValue={pattern?.name || ""}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>曜日</Label>
            <DaysOfWeekSelector
              value={daysOfWeek}
              onChange={setDaysOfWeek}
              name="daysOfWeek"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">開始時刻</Label>
              <Input
                id="startTime"
                name="startTime"
                type="time"
                defaultValue={
                  pattern ? formatTimeForInput(pattern.startTime) : "09:00"
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">終了時刻</Label>
              <Input
                id="endTime"
                name="endTime"
                type="time"
                defaultValue={
                  pattern ? formatTimeForInput(pattern.endTime) : "17:00"
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="preference">希望度</Label>
            <Select name="preference" defaultValue={pattern?.preference || "preferred"}>
              <option value="preferred">希望</option>
              <option value="available">可能</option>
              <option value="unavailable">不可</option>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit">
              {isEditing ? "更新" : "作成"}
            </Button>
            {onSuccess && (
              <Button type="button" variant="outline" onClick={onSuccess}>
                キャンセル
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}