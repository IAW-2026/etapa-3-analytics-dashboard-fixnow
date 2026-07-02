"use client";

import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchRatingDistribution,
  formatNumber,
  type RatingBucket,
} from "@/lib/analytics-data";
import type { Period } from "@/components/analytics/AnalyticsDashboard";

const STAR_COLORS: Record<number, string> = {
  1: "var(--destructive)",
  2: "var(--brand-accent)",
  3: "var(--electrical)",
  4: "var(--plumbing)",
  5: "var(--gas)",
};

interface RatingHistogramProps {
  period?: Period;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: RatingBucket }>;
}) {
  if (!active || !payload?.length) return null;
  const { estrellas, cantidad } = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">
        {"★".repeat(estrellas)} {estrellas} estrella{estrellas !== 1 ? "s" : ""}
      </p>
      <p className="text-muted-foreground">{formatNumber(cantidad)} reseñas</p>
    </div>
  );
}

export function RatingHistogram({ period }: RatingHistogramProps) {
  const { data: raw, isLoading } = useSWR<RatingBucket[]>(
    `rating-distribution-${period ?? "all"}`,
    () => fetchRatingDistribution(period),
  );

  const data = raw?.map((b) => ({ ...b, fill: STAR_COLORS[b.estrellas] })) ?? [];
  const total = data.reduce((acc, b) => acc + b.cantidad, 0);

  const periodLabel: Record<Period, string> = {
    "30d": "últimos 30 días",
    "90d": "últimos 90 días",
    "6m": "últimos 6 meses",
    "1y": "último año",
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Distribución de Calificaciones
        </CardTitle>
        <CardDescription>
          {total > 0
            ? `${formatNumber(total)} reseñas · ${period ? periodLabel[period] : "histórico"} · Feedback App`
            : "Reseñas por cantidad de estrellas · Feedback App"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !raw ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={192}>
            <BarChart
              data={data}
              margin={{ top: 4, right: 8, left: -16, bottom: 0 }}
              barCategoryGap="28%"
            >
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="estrellas"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 13 }}
                tickFormatter={(v) => "★".repeat(v)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                tickFormatter={(v) =>
                  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                }
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "var(--muted)", opacity: 0.4 }}
              />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
