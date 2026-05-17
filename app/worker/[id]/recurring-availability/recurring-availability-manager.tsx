"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RecurringPatternForm } from "@/components/recurring-pattern-form";
import { PatternList } from "@/components/pattern-list";
import { PatternPreview } from "@/components/pattern-preview";
import { removeAppliedPattern } from "@/app/actions/recurring-availability";
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

interface Application {
  id: string;
  patternId: string;
  startDate: string;
  endDate: string;
  appliedCount: number;
  createdAt: Date;
  patternName: string;
}

interface RecurringAvailabilityManagerProps {
  workerId: string;
  fiscalYearId: string;
  patterns: Pattern[];
  applications: Application[];
}

export function RecurringAvailabilityManager({
  workerId,
  fiscalYearId,
  patterns,
  applications,
}: RecurringAvailabilityManagerProps) {
  const [activeView, setActiveView] = useState<
    "list" | "create" | "edit" | "apply"
  >("list");
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);

  const handleCreateNew = () => {
    setSelectedPattern(null);
    setActiveView("create");
  };

  const handleEdit = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setActiveView("edit");
  };

  const handleApply = (pattern: Pattern) => {
    setSelectedPattern(pattern);
    setActiveView("apply");
  };

  const handleSuccess = () => {
    setActiveView("list");
    setSelectedPattern(null);
    // ページリロードでデータを更新
    window.location.reload();
  };

  const handleRemoveApplication = async (applicationId: string) => {
    if (!confirm("この適用履歴を削除しますか？関連する希望もすべて削除されます。")) {
      return;
    }

    try {
      const formData = new FormData();
      formData.append("applicationId", applicationId);
      formData.append("workerId", workerId);
      await removeAppliedPattern(formData);
      window.location.reload();
    } catch (error) {
      console.error("削除に失敗しました:", error);
      alert("削除に失敗しました。");
    }
  };

  if (activeView === "create") {
    return (
      <div>
        <RecurringPatternForm
          workerId={workerId}
          fiscalYearId={fiscalYearId}
          onSuccess={handleSuccess}
        />
        <Button
          variant="outline"
          onClick={() => setActiveView("list")}
          className="mt-4"
        >
          戻る
        </Button>
      </div>
    );
  }

  if (activeView === "edit" && selectedPattern) {
    return (
      <div>
        <RecurringPatternForm
          workerId={workerId}
          fiscalYearId={fiscalYearId}
          pattern={selectedPattern}
          onSuccess={handleSuccess}
        />
        <Button
          variant="outline"
          onClick={() => setActiveView("list")}
          className="mt-4"
        >
          戻る
        </Button>
      </div>
    );
  }

  if (activeView === "apply" && selectedPattern) {
    return (
      <div>
        <PatternPreview
          pattern={selectedPattern}
          workerId={workerId}
          onSuccess={handleSuccess}
        />
        <Button
          variant="outline"
          onClick={() => setActiveView("list")}
          className="mt-4"
        >
          戻る
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* パターン一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>定期パターン</CardTitle>
            <Button onClick={handleCreateNew}>新しいパターンを作成</Button>
          </div>
        </CardHeader>
        <CardContent>
          <PatternList patterns={patterns} workerId={workerId} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* パターン適用 */}
      {patterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>パターンを適用</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              作成したパターンを期間指定で一括適用できます。
            </p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {patterns.map((pattern) => (
                <Button
                  key={pattern.id}
                  variant="outline"
                  className="h-auto p-3 text-left"
                  onClick={() => handleApply(pattern)}
                >
                  <div className="w-full">
                    <div className="font-medium">{pattern.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(pattern.startTime)} 〜 {formatTime(pattern.endTime)}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 適用履歴 */}
      {applications.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>適用履歴</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="font-medium">{app.patternName}</div>
                    <div className="text-sm text-muted-foreground">
                      {app.startDate} 〜 {app.endDate} ({app.appliedCount}日間)
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveApplication(app.id)}
                  >
                    削除
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}