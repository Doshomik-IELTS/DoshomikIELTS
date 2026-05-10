import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  Headphones,
  LockKeyhole,
  Mic,
  PenLine,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { PublicHeader } from "@/components/layout/public-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: GraduationCap,
    title: "Basic-English-to-IELTS path",
    text: "Start with sentence structure, parts of speech, grammar rules, vocabulary, synonyms, and common errors before attempting full mock tests.",
  },
  {
    icon: BookOpen,
    title: "Owned resource library",
    text: "Text-based resources for Basic English, words, synonyms, grammar, Reading, Listening, Writing, and Speaking strategies.",
  },
  {
    icon: FileCheck2,
    title: "Objective practice scoring",
    text: "Reading, Listening, vocabulary, synonym, and grammar practice can be marked instantly with explanations and accepted answer variants.",
  },
  {
    icon: BrainCircuit,
    title: "Transparent AI feedback",
    text: "Writing and Speaking feedback includes criterion-level band estimates, strengths, weaknesses, improved examples, and a next task.",
  },
  {
    icon: BarChart3,
    title: "Progress dashboard",
    text: "Track module progress, recent attempts, saved resources, estimated bands, and score history from one learner dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Copyright-safe content",
    text: "The platform is designed for original, licensed, public-domain-valid, or internally reviewed generated content only.",
  },
];

const modules = [
  {
    icon: Headphones,
    title: "Listening",
    text: "Original audio, transcripts, objective answers, accepted variants, and instant estimated band scoring.",
  },
  {
    icon: BookOpen,
    title: "Reading",
    text: "IELTS-style passages, question sets, answer explanations, and source-span rationale for each item.",
  },
  {
    icon: PenLine,
    title: "Writing",
    text: "Task 1 and Task 2 responses evaluated against IELTS-style criteria with practical improvement suggestions.",
  },
  {
    icon: Mic,
    title: "Speaking",
    text: "Part 1, Part 2, and Part 3 practice with text or audio response paths and feedback after evaluation.",
  },
];

const steps = [
  "Set your target band and exam date.",
  "Study foundation lessons and save key resources.",
  "Practise focused vocabulary, grammar, Reading, and Listening drills.",
  "Complete Writing and Speaking responses for AI-assisted feedback.",
  "Finish all four modules in a mock test to unlock an unofficial score prediction.",
];

const trustItems = [
  "No Cambridge IELTS PDFs, scans, copied passages, copied questions, or copyrighted audio.",
  "Answer keys stay hidden from learner-facing test screens.",
  "Scores are clearly labelled as unofficial practice estimates.",
  "Private speaking recordings use protected storage and signed URL flows.",
];

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicHeader />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-blue-50/60">
          <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-8 lg:py-28">
            <div>
              <Badge className="bg-white text-blue-700 ring-blue-200">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Basic English to IELTS readiness
              </Badge>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Build foundations, practise smarter, and complete IELTS-style mock tests.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                IELTS++ helps learners move from Basic English to IELTS preparation with owned resources,
                original practice, transparent feedback, and score prediction after a complete test attempt.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start learning <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/resources">
                  <Button variant="outline" size="lg" className="w-full bg-white sm:w-auto">
                    Explore resources
                  </Button>
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Foundation lessons
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Full mock flow
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" /> Unofficial band prediction
                </span>
              </div>
            </div>

            <Card className="border-blue-100 bg-white/90 shadow-xl shadow-blue-900/5">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-blue-700">Learner journey</p>
                    <CardTitle className="mt-1 text-2xl">From basics to band estimate</CardTitle>
                  </div>
                  <Target className="h-8 w-8 text-blue-700" />
                </div>
              </CardHeader>
              <CardContent>
                <ol className="space-y-4">
                  {steps.map((step, index) => (
                    <li key={step} className="flex gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-700 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <span className="pt-1 text-sm leading-6 text-slate-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">MVP features</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Everything needed for a complete IELTS practice loop.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              The MVP connects learning resources, focused practice, mock tests, evaluation, and progress tracking.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
                <CardHeader>
                  <feature.icon className="h-7 w-7 text-blue-700" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-slate-600">{feature.text}</CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section id="modules" className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Four modules</p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                  Practise each IELTS skill, then combine them in a mock test.
                </h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Reading and Listening are scored objectively. Writing and Speaking are evaluated with rubric-based feedback.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {modules.map((module) => (
                  <Card key={module.title}>
                    <CardHeader>
                      <module.icon className="h-7 w-7 text-blue-700" />
                      <CardTitle>{module.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm leading-6 text-slate-600">{module.text}</CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Transparent scoring</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
                Score prediction only after a complete four-module attempt.
              </h2>
              <p className="mt-4 text-lg leading-8 text-slate-600">
                IELTS++ avoids overclaiming. Learners see module progress first, then an unofficial overall estimate only when Listening, Reading, Writing, and Speaking are complete.
              </p>
              <div className="mt-8 grid gap-3 text-sm text-slate-700">
                {trustItems.map((item) => (
                  <div key={item} className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4">
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card className="bg-slate-950 text-white">
              <CardHeader>
                <p className="text-sm font-medium text-blue-200">Example score card</p>
                <CardTitle className="text-2xl text-white">Unofficial prediction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {[
                    ["Listening", "6.5"],
                    ["Reading", "6.0"],
                    ["Writing", "6.0"],
                    ["Speaking", "6.5"],
                  ].map(([label, score]) => (
                    <div key={label} className="flex items-center justify-between rounded-lg bg-white/10 px-4 py-3">
                      <span className="text-sm text-slate-200">{label}</span>
                      <span className="font-semibold">Band {score}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-xl bg-blue-500/20 p-5">
                  <div className="flex items-end justify-between">
                    <span className="text-sm text-blue-100">Overall estimate</span>
                    <span className="text-4xl font-bold">6.5</span>
                  </div>
                  <p className="mt-3 text-xs leading-5 text-blue-100">
                    This is an unofficial IELTS band estimate for practice only. It is not an official IELTS result.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="bg-blue-700">
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-4 py-14 text-white sm:px-6 lg:flex-row lg:items-center lg:px-8">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Ready to start building IELTS readiness?</h2>
              <p className="mt-3 max-w-2xl text-blue-100">
                Create a profile, study foundation resources, practise each module, and track your progress toward your target band.
              </p>
            </div>
            <Link href="/register">
              <Button variant="secondary" size="lg" className="bg-white text-blue-800 hover:bg-blue-50">
                Create free account <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} IELTS++. Practice estimates only.</p>
          <p>Original and licensed content only. No copied IELTS book material.</p>
        </div>
      </footer>
    </div>
  );
}
