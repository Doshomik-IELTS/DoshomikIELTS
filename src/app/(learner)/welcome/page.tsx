import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: "📚",
    title: "Learning Resources",
    description: "Access vocabulary, grammar, and strategy materials tailored for IELTS.",
  },
  {
    icon: "🎯",
    title: "Practice Tests",
    description: "Test your skills with practice questions and mini mock tests.",
  },
  {
    icon: "📝",
    title: "Writing Evaluation",
    description: "Get AI-powered feedback on your writing tasks.",
  },
  {
    icon: "🎤",
    title: "Speaking Practice",
    description: "Practice speaking with text or audio responses.",
  },
  {
    icon: "🧠",
    title: "Spaced Repetition",
    description: "Build vocabulary efficiently with flashcard decks.",
  },
  {
    icon: "📊",
    title: "Progress Tracking",
    description: "Track your scores, streaks, and achievements.",
  },
];

export default function BetaWelcomePage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to DOshomik IELTS Beta!</h1>
        <p className="text-lg text-slate-600">
          Thank you for joining our closed beta. We are excited to have you try out our platform.
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">What to Expect</h2>
          <ul className="space-y-3 text-slate-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>We are still building! You may encounter some bugs or incomplete features.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Your feedback matters - use the feedback button to help us improve.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Your data is stored safely but may be reset during beta.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Scores are unofficial estimates for practice only.</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      <h2 className="text-xl font-semibold text-slate-900 mb-4">Explore the Platform</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-medium text-slate-900">{feature.title}</h3>
              <p className="text-sm text-slate-600">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center">
        <Link href="/dashboard">
          <Button size="lg">Go to Dashboard</Button>
        </Link>
      </div>

      <p className="text-center text-sm text-slate-500 mt-8">
        Need help? Use the feedback button or email us at support@ieltspp.local
      </p>
    </div>
  );
}