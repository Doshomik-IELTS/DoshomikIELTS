import { Badge } from "@/components/ui/badge";

export function EvaluationStatusBadge({ status }: { status: string }) {
  return <Badge className="capitalize">{status.replaceAll("_", " ")}</Badge>;
}
