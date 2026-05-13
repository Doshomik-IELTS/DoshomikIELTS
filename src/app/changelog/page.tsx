import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const changes = [
  {
    version: "0.1.0",
    date: "2026-05-13",
    badge: "Beta Launch",
    changes: [
      { type: "new", text: "Core platform launch - Learning resources, practice tests, mock tests" },
      { type: "new", text: "Flashcard system with spaced repetition (SM-2)" },
      { type: "new", text: "Writing and speaking evaluation with AI" },
      { type: "new", text: "Score prediction after completing all modules" },
      { type: "new", text: "Referral program with credits" },
      { type: "new", text: "Admin dashboard for content management" },
      { type: "new", text: "Feedback system for beta testing" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Changelog</h1>
        <p className="text-slate-600">Follow the latest updates to IELTS++</p>
      </div>

      <div className="space-y-8">
        {changes.map((release) => (
          <Card key={release.version}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-lg font-semibold text-slate-900">v{release.version}</span>
                <span className="text-sm text-slate-500">{release.date}</span>
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {release.badge}
                </span>
              </div>
              <ul className="space-y-2">
                {release.changes.map((change, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-600">
                    <span className={change.type === "new" ? "text-green-600" : "text-amber-600"}>
                      {change.type === "new" ? "✨" : "🔧"}
                    </span>
                    <span>{change.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}