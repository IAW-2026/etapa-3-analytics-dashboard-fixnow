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
  Cell,
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

const STAR_COLORS: Record<number, string> = {
  1: "var(--destructive)",
  2: "#f97316",
  3: "#eab308",
  4: "var(--electrical)",
  5: "#22c55e",
};

function StarLabel({ value }: { value: number }) {
  return <span>{"★".repeat(value)}</span>;
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
      <p className="font-medium">{"★".repeat(estrellas)} {estrellas} estrella{estrellas !== 1 ? "s" : ""}</p>
      <p className="text-muted-foreground">{formatNumber(cantidad)} reseñas</p>
    </div>
  );
}

export function RatingHistogram() {
  const { data, isLoading } = useSWR<RatingBucket[]>(
    "rating-distribution",
    fetchRatingDistribution,
  );

  const total = data?.reduce((acc, b) => acc + b.cantidad, 0) ?? 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Distribución de Calificaciones
        </CardTitle>
        <CardDescription>
          {total > 0
            ? `${formatNumber(total)} reseñas en total · Feedback App`
            : "Reseñas por cantidad de estrellas · Feedback App"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
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
                tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar dataKey="cantidad" radius={[4, 4, 0, 0]}>
                {data.map((entry) => (
                  <Cell
                    key={entry.estrellas}
                    fill={STAR_COLORS[entry.estrellas]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
