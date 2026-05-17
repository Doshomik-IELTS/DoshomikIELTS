"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ScorePoint = {
  date: string;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  overall: number | null;
};

type ScoreTrendProps = {
  history: ScorePoint[];
};

const BAND_MIN = 1;
const BAND_MAX = 9;
const BAND_RANGE = BAND_MAX - BAND_MIN;
const SVG_HEIGHT = 160;
const SVG_WIDTH = 600;
const PADDING = { top: 20, right: 20, bottom: 30, left: 30 };
const CHART_HEIGHT = SVG_HEIGHT - PADDING.top - PADDING.bottom;
const CHART_WIDTH = SVG_WIDTH - PADDING.left - PADDING.right;

function xPos(index: number, total: number): number {
  if (total <= 1) return PADDING.left + CHART_WIDTH / 2;
  return PADDING.left + (index / (total - 1)) * CHART_WIDTH;
}

function yPos(band: number | null): number | null {
  if (band == null) return null;
  return PADDING.top + CHART_HEIGHT - ((band - BAND_MIN) / BAND_RANGE) * CHART_HEIGHT;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" });
}

function linePath(points: (number | null)[], total: number): string {
  const coords: [number, number][] = [];
  points.forEach((val, i) => {
    const x = xPos(i, total);
    const y = yPos(val);
    if (y != null) coords.push([x, y]);
  });
  if (coords.length < 2) return "";
  return coords.map((c, i) => `${i === 0 ? "M" : "L"}${c[0]},${c[1]}`).join(" ");
}

function dotPoints(points: (number | null)[], total: number): [number, number][] {
  return points
    .map((val, i) => {
      const x = xPos(i, total);
      const y = yPos(val);
      return y != null ? ([x, y] as [number, number]) : null;
    })
    .filter((p): p is [number, number] => p != null);
}

export function ScoreTrend({ history }: ScoreTrendProps) {
  if (!history || history.length === 0) return null;

  const total = history.length;
  const overallPath = linePath(history.map((h) => h.overall), total);
  const listeningPath = linePath(history.map((h) => h.listening), total);
  const readingPath = linePath(history.map((h) => h.reading), total);
  const writingPath = linePath(history.map((h) => h.writing), total);
  const speakingPath = linePath(history.map((h) => h.speaking), total);

  const overallDots = dotPoints(history.map((h) => h.overall), total);

  const bandLines = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="min-w-[320px] w-full"
            role="img"
            aria-label="Score trend chart showing band scores over time"
          >
            {bandLines.map((band) => {
              const y = yPos(band);
              if (y == null) return null;
              return (
                <g key={band}>
                  <line
                    x1={PADDING.left}
                    y1={y}
                    x2={SVG_WIDTH - PADDING.right}
                    y2={y}
                    stroke={band === 5.5 || band === 7 ? "#94a3b8" : "#e2e8f0"}
                    strokeWidth={band === 5.5 || band === 7 ? 1 : 0.5}
                    strokeDasharray={band === 5.5 || band === 7 ? "4 2" : "none"}
                  />
                  <text
                    x={PADDING.left - 6}
                    y={y + 4}
                    textAnchor="end"
                    className="fill-slate-400"
                    fontSize="10"
                  >
                    {band}
                  </text>
                </g>
              );
            })}

            {history.map((h, i) => (
              <text
                key={i}
                x={xPos(i, total)}
                y={SVG_HEIGHT - 8}
                textAnchor="middle"
                className="fill-slate-400"
                fontSize="9"
              >
                {formatDate(h.date)}
              </text>
            ))}

            {[
              { path: listeningPath, color: "#3b82f6", opacity: 0.3 },
              { path: readingPath, color: "#10b981", opacity: 0.3 },
              { path: writingPath, color: "#f59e0b", opacity: 0.3 },
              { path: speakingPath, color: "#8b5cf6", opacity: 0.3 },
            ].map((line, i) =>
              line.path ? (
                <path
                  key={`module-${i}`}
                  d={line.path}
                  fill="none"
                  stroke={line.color}
                  strokeWidth={1.5}
                  opacity={line.opacity}
                />
              ) : null
            )}

            {overallPath && (
              <path
                d={overallPath}
                fill="none"
                stroke="#1e40af"
                strokeWidth={2.5}
              />
            )}

            {overallDots.map(([x, y], i) => (
              <g key={`dot-${i}`}>
                <circle cx={x} cy={y} r={4} fill="#1e40af" stroke="white" strokeWidth={1.5} />
                <title>Attempt {i + 1}: {history[i]?.overall?.toFixed(1)}</title>
              </g>
            ))}
          </svg>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-blue-800" />
            Overall
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-blue-500 opacity-40" />
            Listening
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-green-500 opacity-40" />
            Reading
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-amber-500 opacity-40" />
            Writing
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-4 rounded-sm bg-violet-500 opacity-40" />
            Speaking
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function ScoreTrendSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Score Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-40 w-full" />
      </CardContent>
    </Card>
  );
}
