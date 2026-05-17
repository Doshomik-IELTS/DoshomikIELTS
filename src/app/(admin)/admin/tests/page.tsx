import { PageHeader } from "@/components/ui/page-header";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default function AdminTestsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tests"
        description="Author mock tests in Strapi."
      />
      <StrapiAuthoringPanel
        collection="mock-tests"
        title="Mock-test authoring moved to Strapi"
        description="Create test definitions, sections, question groups, questions, answer keys, explanations, and media in Strapi. The learner app can list Strapi-published tests and materializes them into Prisma when a learner starts an attempt."
      />
    </div>
  );
}
