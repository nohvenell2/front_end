import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string;
  label: string;
  className?: string;
}

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <Card className={cn("rounded-sm shadow-none items-center py-3 gap-1", className)}>
      <CardContent className="flex flex-col items-center gap-1 px-4">
        <span className="text-2xl font-bold text-primary tabular-nums leading-tight">
          {value}
        </span>
        <span className="text-xs text-muted-foreground text-center">{label}</span>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="rounded-sm shadow-none py-3">
      <CardContent className="flex flex-col items-center gap-2 px-4">
        <div className="h-8 w-20 rounded-sm bg-muted animate-pulse" />
        <div className="h-3 w-16 rounded-sm bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}
