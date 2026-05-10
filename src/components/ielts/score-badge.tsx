import { Badge } from "@/components/ui/badge";

export function ScoreBadge({ band, label = "Band" }: { band?: number | null; label?: string }) {
  return <Badge>{band == null ? `${label}: pending` : `${label}: ${band.toFixed(1)}`}</Badge>;
}