"use client";

import useSWR from "swr";
import { useState } from "react";
import {
  Users,
  ArrowLeftRight,
  Star,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchKpis,
  formatCompactCLP,
  formatNumber,
  type KpiData,
} from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";
import { ExportFinancialExcelButton } from "@/components/analytics/ExportFinancialExcelButton";

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
    trend: "+8.2%",
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
    trend: "+0.2",
  },
];

function getAverageOrderAmount(data: KpiData): number {
  if (data.averageTicket && data.averageTicket > 0) {
    return data.averageTicket;
  }

  if (data.completedOrders > 0) {
    return data.transactionVolume / data.completedOrders;
  }

  return 0;
}

export function KpiCards({ period }: KpiCardsProps) {
  const { data, isLoading } = useSWR<KpiData>(`kpis-${period ?? "all"}`, () =>
    fetchKpis(period),
  );

  const [expandedSummary, setExpandedSummary] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {cards.map((card) => {
        if (card.key === "custom") {
          const averageOrderAmount = data ? getAverageOrderAmount(data) : 0;

          return (
            <Card
              key={card.label}
              className="relative flex flex-col justify-between overflow-hidden border-border p-5 lg:col-span-3"
            >
              <div
                className="absolute inset-x-0 top-0 h-1"
                style={{ backgroundColor: card.accent }}
              />

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${card.accent} 18%, transparent)`,
                    }}
                  >
                    <ArrowLeftRight
                      className="size-5"
                      style={{ color: card.accent }}
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      {card.label}
                    </h3>

                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
                      {card.source}
                    </p>
                  </div>
                </div>

                <ExportFinancialExcelButton />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="pt-2 sm:px-2 sm:pt-0">
                  <p className="text-sm text-muted-foreground">
                    Volumen total
                  </p>

                  {isLoading || !data ? (
                    <Skeleton className="mt-1.5 h-8 w-32" />
                  ) : (
                    <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight">
                      {formatCompactCLP(data.transactionVolume)}
                    </p>
                  )}

                  {isLoading || !data ? (
                    <Skeleton className="mt-2 h-4 w-32" />
                  ) : (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNumber(data.completedOrders)} pedidos completados
                    </p>
                  )}
                </div>

                <div className="pt-4 sm:px-4 sm:pt-0">
                  <p className="text-sm text-muted-foreground">
                    Ingresos FixNow
                  </p>

                  {isLoading || !data ? (
                    <Skeleton className="mt-1.5 h-8 w-32" />
                  ) : (
                    <>
                      <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight text-foreground">
                        {formatCompactCLP(data.netRevenue)}
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Comisión neta estimada
                      </p>
                    </>
                  )}
                </div>

                <div className="pt-4 sm:px-4 sm:pt-0">
                  <p className="text-sm text-muted-foreground">
                    Monto promedio por pedido
                  </p>

                  {isLoading || !data ? (
                    <Skeleton className="mt-1.5 h-8 w-32" />
                  ) : (
                    <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight">
                      {formatCompactCLP(averageOrderAmount)}
                    </p>
                  )}

                  <p className="mt-1 text-xs text-muted-foreground">
                    Promedio abonado por trabajo
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setExpandedSummary((current) => !current)}
                  disabled={isLoading || !data}
                  className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                >
                  {expandedSummary ? (
                    <ChevronUp className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}

                  {expandedSummary
                    ? "Ocultar desglose financiero"
                    : "Ver desglose financiero"}
                </button>

                {expandedSummary && data && (
                  <div className="mt-4 grid grid-cols-1 gap-4 rounded-lg border border-border bg-muted/40 p-4 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Ingresos brutos
                      </span>

                      <span className="font-medium">
                        {formatCompactCLP(data.transactionVolume)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Comisión FixNow
                      </span>

                      <span className="font-medium text-primary">
                        {formatCompactCLP(data.netRevenue)}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Pago a profesionales
                      </span>

                      <span className="font-medium">
                        {formatCompactCLP(
                          data.transactionVolume - data.netRevenue,
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">
                        Porcentaje estimado de comisión
                      </span>

                      <span className="font-medium">
                        {data.transactionVolume > 0
                          ? `${(
                              (data.netRevenue / data.transactionVolume) *
                              100
                            ).toFixed(1)}%`
                          : "0.0%"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
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