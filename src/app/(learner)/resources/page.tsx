import { ResourceList } from "@/components/resources/resource-list";
import { PageHeader } from "@/components/ui/page-header";

export default function ResourcesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resources"
        description="Study Basic English, words, synonyms, and grammar foundations."
      />
      <ResourceList />
    </div>
  );
}
