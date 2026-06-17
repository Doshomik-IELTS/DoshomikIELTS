import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

const features = [
  {
    icon: "solar:notebook-minimalistic-outline",
    title: "Basic-English-to-IELTS path",
    description:
      "Move from grammar, vocabulary, synonyms, and common errors into IELTS-style practice without losing the foundations.",
  },
  {
    icon: "solar:library-outline",
    title: "Owned resource library",
    description:
      "Study original lessons for Basic English, Reading, Listening, Writing, Speaking, vocabulary, and grammar.",
  },
  {
    icon: "solar:clipboard-check-outline",
    title: "Objective practice scoring",
    description:
      "Reading, Listening, vocabulary, synonym, and grammar practice marked instantly with accepted answer variants.",
  },
  {
    icon: "solar:magic-stick-3-outline",
    title: "Transparent AI feedback",
    description:
      "Writing and Speaking responses receive criterion-level band estimates, strengths, weaknesses, and next-step guidance.",
  },
  {
    icon: "solar:chart-square-outline",
    title: "Progress dashboard",
    description:
      "Track module progress, recent attempts, saved resources, estimated bands, and score history.",
  },
  {
    icon: "solar:shield-check-outline",
    title: "Copyright-safe workflow",
    description:
      "The platform is structured for original, licensed, public-domain-valid, or internally reviewed generated content only.",
  },
];

const Features = () => {
  return (
    <section id="features">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end mb-12">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              MVP features
            </p>
            <h2 className="mt-3 text-3xl lg:text-4xl font-semibold text-midnight-text">
              Everything needed for a complete IELTS practice loop.
            </h2>
            <p className="mt-4 text-grey text-lg">
              The platform connects learning resources, focused practice, mock tests, evaluation, and progress tracking.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="text-primary text-lg font-medium hover:tracking-widest duration-500"
          >
            Open learner dashboard&nbsp;&gt;
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <Icon
                icon={feature.icon}
                className="text-primary text-3xl mb-4 inline-block"
              />
              <h3 className="text-xl font-semibold text-midnight-text mb-3">
                {feature.title}
              </h3>
              <p className="text-grey text-sm leading-6">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
