import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { strapiAdminUrl } from "@/lib/strapi/content";

type StrapiAuthoringPanelProps = {
  title: string;
  description: string;
  collection: "resources" | "mock-tests";
};

const collectionTargets = {
  resources: {
    label: "Open Strapi Resources",
    href: "/content-manager/collection-types/api::resource.resource",
    secondaryLabel: "Resource content type",
  },
  "mock-tests": {
    label: "Open Strapi Mock Tests",
    href: "/content-manager/collection-types/api::mock-test.mock-test",
    secondaryLabel: "Mock test content type",
  },
};

export function StrapiAuthoringPanel({
  title,
  description,
  collection,
}: StrapiAuthoringPanelProps) {
  const target = collectionTargets[collection];
  const adminHref = strapiAdminUrl(target.href);
  const baseHref = strapiAdminUrl();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        <div className="flex flex-wrap gap-2">
          <Link href={adminHref} className={buttonVariants()} target="_blank" rel="noreferrer">
            {target.label}
          </Link>
          <Link
            href={baseHref}
            className={buttonVariants({ variant: "outline" })}
            target="_blank"
            rel="noreferrer"
          >
            Open Strapi Admin
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Configure <code>STRAPI_ADMIN_URL</code> if Strapi is not running at localhost:1337.
          Target: {target.secondaryLabel}.
        </p>
      </CardContent>
    </Card>
  );
}
