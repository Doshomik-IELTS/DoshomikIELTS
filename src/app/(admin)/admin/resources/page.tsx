import { PageHeader } from "@/components/ui/page-header";
import { StrapiAuthoringPanel } from "@/components/admin/strapi-authoring-panel";

export default function AdminResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Resources" description="Author learning content in Strapi." />
      <StrapiAuthoringPanel
        collection="resources"
        title="Resource authoring moved to Strapi"
        description="Create, edit, publish, and unpublish IELTS++ lessons, vocabulary, grammar, spelling, and strategy resources in Strapi. The learner app reads published Strapi resources when STRAPI_BASE_URL and STRAPI_API_TOKEN are configured."
      />
    </div>
  );
}
