"use client";

import useSWR from "swr";
import { useState } from "react";
import {
  Users,
  ArrowLeftRight,
  TrendingUp,
  Star,
  ArrowUpRight,
  ReceiptText,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchKpis,
  formatCompactCLP,
  formatNumber,
  type KpiData,
} from "@/lib/analytics-data";

interface KpiCard {
  key: keyof KpiData | "custom";
  label: string;
  icon: typeof Users;
  source: string;
  accent: string;
  format: (k: KpiData) => string;
  sub: (k: KpiData) => string;
  trend: string | ((k: KpiData) => string);
  expandable?: boolean;
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
      `${formatNumber(k.totalClients)} clientes · ${formatNumber(k.totalProfessionals)} profesionales`,
    trend: "+8.2%",
  },
  {
    key: "transactionVolume",
    label: "Volumen de Transacciones",
    icon: ArrowLeftRight,
    source: "Payments App",
    accent: "var(--brand-accent)",
    format: (k) => formatCompactCLP(k.transactionVolume),
    sub: (k) => `${formatNumber(k.completedOrders)} pedidos completados`,
    trend: "+12.5%",
    expandable: true,
  },
  {
    key: "netRevenue",
    label: "Ingresos FixNow",
    icon: TrendingUp,
    source: "Payments App",
    accent: "var(--electrical)",
    format: (k) => formatCompactCLP(k.netRevenue),
    sub: () => "Comisión neta (~15%)",
    trend: "+9.1%",
    expandable: true,
  },
  {
  key: "averageTicket",
  label: "Ticket Promedio Global",
  icon: ReceiptText,
  source: "Payments App",
  accent: "var(--brand-accent)",
  format: (k) => formatCompactCLP(k.averageTicket),
  sub: (k) => `${formatNumber(k.completedOrders)} pedidos completados`,
  trend: (k) => k.averageTicketTrend,
  expandable: true,
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

export function KpiCards() {
  const { data, isLoading } = useSWR<KpiData>("kpis", fetchKpis);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  return (
   <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
     {cards.map((card) => {
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
  onClick={() =>
    card.expandable &&
    setExpandedCard((current) =>
      current === card.label ? null : card.label,
    )
  }
  className={`relative overflow-hidden border-border p-5 ${
    card.expandable ? "cursor-pointer transition hover:-translate-y-0.5 hover:shadow-md" : ""
  }`}
>
            {/* Accent bar */}
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
              {!isLoading &&
  data &&
  card.expandable &&
  expandedCard === card.label && (
    <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3 text-xs">
      {card.key === "transactionVolume" && (
        <>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ingresos brutos</span>
            <span className="font-medium">
              {formatCompactCLP(data.transactionVolume)}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span className="text-muted-foreground">Pedidos completados</span>
            <span className="font-medium">
              {formatNumber(data.completedOrders)}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span className="text-muted-foreground">Comisión FixNow</span>
            <span className="font-medium">
              {formatCompactCLP(data.netRevenue)}
            </span>
          </div>
        </>
      )}

      {card.key === "netRevenue" && (
        <>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Comisión neta</span>
            <span className="font-medium">
              {formatCompactCLP(data.netRevenue)}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span className="text-muted-foreground">Sobre bruto total</span>
            <span className="font-medium">
              {formatCompactCLP(data.transactionVolume)}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span className="text-muted-foreground">Estimado comisión</span>
            <span className="font-medium">
              {data.transactionVolume > 0
                ? `${((data.netRevenue / data.transactionVolume) * 100).toFixed(1)}%`
                : "0.0%"}
            </span>
          </div>
        </>
      )}

      {card.key === "averageTicket" && (
        <>
          <div className="flex justify-between gap-3">
            <span className="text-muted-foreground">Ticket promedio</span>
            <span className="font-medium">
              {formatCompactCLP(data.averageTicket)}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span className="text-muted-foreground">Pedidos considerados</span>
            <span className="font-medium">
              {formatNumber(data.completedOrders)}
            </span>
          </div>
          <div className="mt-1.5 flex justify-between gap-3">
            <span className="text-muted-foreground">Variación mensual</span>
            <span className="font-medium">
              {data.averageTicketTrend}
            </span>
          </div>
        </>
      )}
    </div>
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
