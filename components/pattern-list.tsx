"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deleteRecurringPattern } from "@/app/actions/recurring-availability";
import { formatTime } from "@/lib/utils";

interface Pattern {
  id: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  preference: string;
  active: boolean;
}

interface PatternListProps {
  patterns: Pattern[];
  workerId: string;
  onEdit?: (pattern: Pattern) => void;
}

const DAYS_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const PREFERENCE_LABELS: Record<string, { label: string; variant: "success" | "warning" | "destructive" }> = {
  preferred: { label: "希望", variant: "success" },
  available: { label: "可能", variant: "warning" },
  unavailable: { label: "不可", variant: "destructive" },
};

export function PatternList({ patterns, workerId, onEdit }: PatternListProps) {
  const handleDelete = async (patternId: string) => {
    if (!confirm("このパターンを削除しますか？")) return;

    const formData = new FormData();
    formData.append("id", patternId);
    formData.append("workerId", workerId);

    try {
      await deleteRecurringPattern(formData);
    } catch (error) {
      console.error("削除に失敗しました:", error);
      // TODO: エラーハンドリングの改善
    }
  };

  if (patterns.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        パターンがありません
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {patterns.map((pattern) => {
        const pref = PREFERENCE_LABELS[pattern.preference];
        const daysText = pattern.daysOfWeek
          .sort()
          .map((day) => DAYS_LABELS[day])
          .join("・");

        return (
          <Card key={pattern.id} className={pattern.active ? "" : "opacity-50"}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{pattern.name}</CardTitle>
                <Badge variant={pref.variant}>{pref.label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">曜日:</span>
                  <span>{daysText}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium">時間:</span>
                  <span>
                    {formatTime(pattern.startTime)} 〜 {formatTime(pattern.endTime)}
                  </span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(pattern)}
                  >
                    編集
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(pattern.id)}
                >
                  削除
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}