import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string | null;
};

type AchievementsPanelProps = {
  badges: Achievement[];
};

const DEFAULT_BADGES: Achievement[] = [
  {
    id: "first-steps",
    name: "First Steps",
    description: "Complete your first practice session",
    icon: "📚",
    earnedAt: null,
  },
  {
    id: "seven-day-streak",
    name: "7-Day Streak",
    description: "Study 7 days in a row",
    icon: "🔥",
    earnedAt: null,
  },
  {
    id: "vocabulary-master",
    name: "Vocabulary Master",
    description: "Study 100+ flashcards",
    icon: "📖",
    earnedAt: null,
  },
  {
    id: "writing-pro",
    name: "Writing Pro",
    description: "Submit 5 writing tasks",
    icon: "✍️",
    earnedAt: null,
  },
  {
    id: "speaking-star",
    name: "Speaking Star",
    description: "Complete 5 speaking practice sessions",
    icon: "🎤",
    earnedAt: null,
  },
  {
    id: "mock-champion",
    name: "Mock Test Champion",
    description: "Complete a full mock test",
    icon: "🏆",
    earnedAt: null,
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Study before 7 AM",
    icon: "🌅",
    earnedAt: null,
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Study after 11 PM",
    icon: "🦉",
    earnedAt: null,
  },
];

export const AchievementsPanel = memo(function AchievementsPanel({ badges }: AchievementsPanelProps) {
  const displayBadges = badges.length > 0 ? badges : DEFAULT_BADGES;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span>🏅</span> Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {displayBadges.map((badge) => (
            <div
              key={badge.id}
              className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center transition-colors ${
                badge.earnedAt
                  ? "border-blue-200 bg-blue-50 cursor-default"
                  : "border-slate-200 bg-slate-50 grayscale opacity-60"
              }`}
              title={
                badge.earnedAt
                  ? `Earned ${new Date(badge.earnedAt).toLocaleDateString()}: ${badge.description}`
                  : `Locked: ${badge.description}`
              }
            >
              <span className="text-2xl">{badge.icon}</span>
              <p className="text-xs font-medium text-slate-700 leading-tight">{badge.name}</p>
              {badge.earnedAt ? (
                <p className="text-[10px] text-blue-600">
                  {new Date(badge.earnedAt).toLocaleDateString()}
                </p>
              ) : (
                <p className="text-[10px] text-slate-400">Locked</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
