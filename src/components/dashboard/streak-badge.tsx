import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";

type StreakBadgeProps = {
  streak: number;
  longestStreak: number;
};

export const StreakBadge = memo(function StreakBadge({ streak, longestStreak }: StreakBadgeProps) {
  const hasStreak = streak > 0;

  return (
    <Card className={hasStreak ? "border-orange-200 bg-orange-50" : "border-slate-200"}>
      <CardContent className="flex items-center gap-4 p-4">
        <div className={`text-3xl ${hasStreak ? "" : "grayscale opacity-50"}`}>
          🔥
        </div>
        <div>
          <p className={`text-2xl font-bold ${hasStreak ? "text-orange-700" : "text-slate-400"}`}>
            {streak}
            <span className="text-sm font-normal text-slate-500 ml-1">day streak</span>
          </p>
          {longestStreak > 0 && (
            <p className="text-xs text-slate-400">
              Best: {longestStreak} day{longestStreak !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
