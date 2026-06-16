import { MODULE_BY_SLUG } from "@/lib/resources/modules";
import { ResourceDetail } from "@/components/resources/resource-detail";
import { ModuleHubPage } from "@/components/resources/module-hub";

export default async function ResourcePage({ params }: { params: Promise<{ moduleSlug: string }> }) {
  const { moduleSlug } = await params;

  // If the path segment matches a module slug, render the module hub
  const mod = MODULE_BY_SLUG[moduleSlug];
  if (mod) {
    return <ModuleHubPage mod={mod} />;
  }

  // Otherwise treat it as a resource ID/slug
  return <ResourceDetail id={moduleSlug} />;
}
