"use client";

import useSWR from "swr";
import { Star, Droplets, Zap, Flame } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  fetchTopProfessionals,
  formatNumber,
  type TopProfessional,
} from "@/lib/analytics-data";

const categoryConfig: Record<
  TopProfessional["category"],
  { icon: typeof Droplets; color: string; bg: string }
> = {
  Plomería: {
    icon: Droplets,
    color: "var(--plumbing)",
    bg: "color-mix(in srgb, var(--plumbing) 15%, transparent)",
  },
  Electricidad: {
    icon: Zap,
    color: "var(--electrical)",
    bg: "color-mix(in srgb, var(--electrical) 18%, transparent)",
  },
  Gas: {
    icon: Flame,
    color: "var(--gas)",
    bg: "color-mix(in srgb, var(--gas) 12%, transparent)",
  },
};

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export function TopProfessionals() {
  const { data, isLoading } = useSWR<TopProfessional[]>(
    "top-professionals",
    fetchTopProfessionals,
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Top Profesionales
        </CardTitle>
        <CardDescription>
          Mejor calificados · Feedback &amp; Driver App
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((pro, index) => {
              const config = categoryConfig[pro.category];
              const Icon = config.icon;
              return (
                <li
                  key={pro.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      index === 0
                        ? "bg-electrical text-brand-dark"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
                      {initials(pro.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pro.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="flex size-4 items-center justify-center rounded"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon
                          className="size-2.5"
                          style={{ color: config.color }}
                        />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pro.category} · {pro.city}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="size-3.5 fill-electrical text-electrical" />
                      <span className="text-sm font-semibold">
                        {pro.rating.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(pro.jobs)} trabajos
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
