"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { applyRecurringPattern } from "@/app/actions/recurring-availability";

interface Pattern {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: string;
}

interface PatternPreviewProps {
  pattern: Pattern;
  workerId: string;
  onSuccess?: () => void;
}

const DAYS_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

export function PatternPreview({ pattern, workerId, onSuccess }: PatternPreviewProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [previewDates, setPreviewDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // プレビューの計算
  useEffect(() => {
    if (!startDate || !endDate) {
      setPreviewDates([]);
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates: string[] = [];

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      if (pattern.daysOfWeek.includes(dayOfWeek)) {
        dates.push(date.toISOString().split("T")[0]);
      }
    }

    setPreviewDates(dates.slice(0, 10)); // 最初の10件のみ表示
  }, [startDate, endDate, pattern.daysOfWeek]);

  const handleApply = async (formData: FormData) => {
    setIsLoading(true);
    try {
      const result = await applyRecurringPattern(formData);
      alert(
        `適用完了:\n` +
        `- 対象日数: ${result.totalDates}日\n` +
        `- 新規追加: ${result.appliedDates}日\n` +
        `- 既存でスキップ: ${result.skippedDates}日`
      );
      onSuccess?.();
    } catch (error) {
      console.error("適用に失敗しました:", error);
      alert("適用に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  // 今日の日付を取得（デフォルト値用）
  const today = new Date().toISOString().split("T")[0];
  
  // 3ヶ月後の日付を取得（デフォルト終了日用）
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  const defaultEndDate = threeMonthsLater.toISOString().split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>パターンを適用: {pattern.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleApply} className="space-y-4">
          <input type="hidden" name="patternId" value={pattern.id} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">開始日</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">終了日</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || today}
                required
              />
            </div>
          </div>

          {/* パターン情報表示 */}
          <div className="p-3 bg-muted rounded-lg text-sm">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="font-medium">曜日:</span>
              {pattern.daysOfWeek.sort().map((day) => (
                <Badge key={day} variant="outline">
                  {DAYS_LABELS[day]}
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <span className="font-medium">時間:</span>
              <span>{pattern.startTime.slice(0, 5)} 〜 {pattern.endTime.slice(0, 5)}</span>
            </div>
          </div>

          {/* プレビュー */}
          {previewDates.length > 0 && (
            <div className="space-y-2">
              <Label>適用プレビュー ({previewDates.length}日間)</Label>
              <div className="p-3 bg-muted rounded-lg text-sm max-h-32 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                  {previewDates.map((date, index) => {
                    const dateObj = new Date(date);
                    const dayOfWeek = DAYS_LABELS[dateObj.getDay()];
                    return (
                      <div key={date} className="text-xs">
                        {date} ({dayOfWeek})
                      </div>
                    );
                  })}
                </div>
                {previewDates.length === 10 && (
                  <div className="text-xs text-muted-foreground mt-2">
                    ...他にもあります
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!startDate || !endDate || previewDates.length === 0 || isLoading}
            >
              {isLoading ? "適用中..." : "適用する"}
            </Button>
            {onSuccess && (
              <Button type="button" variant="outline" onClick={onSuccess}>
                キャンセル
              </Button>
            )}
          </div>

          {startDate && endDate && previewDates.length === 0 && (
            <p className="text-sm text-muted-foreground">
              指定期間に該当する曜日がありません。
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}