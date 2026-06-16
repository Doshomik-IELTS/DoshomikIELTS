import { Icon } from "@iconify/react";
import Link from "next/link";

const features = [
  {
    icon: "solar:notebook-minimalistic-outline",
    title: "Basic-English-to-IELTS path",
    description:
      "Move from grammar, vocabulary, synonyms, and sentence structures into full IELTS module readiness, following a structured learning journey.",
  },
  {
    icon: "solar:library-outline",
    title: "Owned resource library",
    description:
      "Study original lessons, explanations, and examples purpose-built for IELTS preparation — no copyrighted third-party content required.",
  },
  {
    icon: "solar:clipboard-check-outline",
    title: "Objective practice scoring",
    description:
      "Reading, Listening, vocabulary, and grammar exercises with instant scoring and detailed feedback on every attempt.",
  },
  {
    icon: "solar:magic-stick-3-outline",
    title: "Transparent AI feedback",
    description:
      "Writing and Speaking responses evaluated against IELTS criteria with clear, criterion-level feedback and estimated band scores.",
  },
  {
    icon: "solar:chart-square-outline",
    title: "Progress dashboard",
    description:
      "Track module progress, study streaks, achievements, and score trends over time — all in one place at a glance.",
  },
  {
    icon: "solar:shield-check-outline",
    title: "Copyright-safe workflow",
    description:
      "The platform is structured with original content from the ground up, ensuring full compliance and safe, ethical practice.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary mb-4">
            MVP features
          </p>
          <h2 className="text-midnight_text text-4xl lg:text-5xl font-semibold mb-5">
            Everything needed for a complete IELTS practice loop.
          </h2>
          <p className="text-black/70 text-lg max-w-2xl mx-auto mb-8">
            The platform connects learning resources, focused practice, mock
            tests, evaluation, and progress tracking.
          </p>
          <Link
            href="/dashboard"
            className="text-primary text-lg font-medium hover:tracking-widest duration-500 inline-block"
          >
            Open learner dashboard &gt;
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition"
            >
              <Icon
                icon={feature.icon}
                className="text-primary text-3xl mb-4 inline-block"
              />
              <h3 className="text-xl font-semibold text-midnight_text mb-3">
                {feature.title}
              </h3>
              <p className="text-black/70 text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
