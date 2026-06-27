"use client";

import { FinancialKpiCard } from "@/components/analytics/FinancialKpiCard";
import useSWR from "swr";
import { Users, ArrowLeftRight, Star, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchKpis, formatNumber, type KpiData } from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";

interface KpiCardsProps {
  period?: Period;
}

interface KpiCard {
  key: keyof KpiData | "custom";
  label: string;
  icon: typeof Users;
  source: string;
  accent: string;
  format: (k: KpiData) => string;
  sub: (k: KpiData) => string;
  trend: string | ((k: KpiData) => string);
}

const cards: KpiCard[] = [
  {
    key: "totalUsers",
    label: "Usuarios Totales",
    icon: Users,
    source: "Rider + Driver App",
    accent: "var(--plumbing)",
    format: (k) => formatNumber(k.totalUsers),
    sub: (k) =>
      `${formatNumber(k.totalClients)} clientes · ${formatNumber(
        k.totalProfessionals,
      )} profesionales`,
    trend: (k) => `+${((k.totalClients / k.totalUsers) * 10).toFixed(1)}%`,
  },
  {
    key: "custom",
    label: "Resumen Financiero",
    icon: ArrowLeftRight,
    source: "Payments App",
    accent: "var(--brand-accent)",
    format: () => "",
    sub: () => "",
    trend: "",
  },
  {
    key: "globalRating",
    label: "Satisfacción Global",
    icon: Star,
    source: "Feedback App",
    accent: "#7aa7d6",
    format: (k) => `${k.globalRating.toFixed(1)} / 5.0`,
    sub: (k) => `${formatNumber(k.totalReviews)} reseñas`,
    trend: (k) => {
      const diff = k.globalRating - 4.5;
      return `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}`;
    },
  },
];

export function KpiCards({ period }: KpiCardsProps) {
  const { data, isLoading } = useSWR<KpiData>(`kpis-${period ?? "all"}`, () =>
    fetchKpis(period),
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        if (card.key === "custom") {
          return (
            <FinancialKpiCard
              key={card.label}
              data={data}
              isLoading={isLoading}
            />
          );
        }

        const Icon = card.icon;

        const trendValue =
          typeof card.trend === "function" && data
            ? card.trend(data)
            : typeof card.trend === "string"
              ? card.trend
              : "...";

        return (
          <Card
            key={card.label}
            className="relative overflow-hidden border-border p-5"
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: card.accent }}
            />

            <div className="flex items-start justify-between">
              <div
                className="flex size-10 items-center justify-center rounded-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${card.accent} 18%, transparent)`,
                }}
              >
                <Icon className="size-5" style={{ color: card.accent }} />
              </div>

              <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success-foreground">
                <ArrowUpRight className="size-3" />
                {trendValue}
              </span>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{card.label}</p>

              {isLoading || !data ? (
                <Skeleton className="mt-1.5 h-8 w-32" />
              ) : (
                <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight">
                  {card.format(data)}
                </p>
              )}

              {isLoading || !data ? (
                <Skeleton className="mt-2 h-4 w-40" />
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  {card.sub(data)}
                </p>
              )}
            </div>

            <p className="mt-4 border-t border-border pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {card.source}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
