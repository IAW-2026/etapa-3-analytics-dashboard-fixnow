"use client";

import useSWR from "swr";
import { PieChart, Pie, Tooltip, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchReseñasStats, formatNumber, type ReseñasStats } from "@/lib/analytics-data";

function pct(n: number, total: number) {
  if (!total) return "0.0";
  return ((n / total) * 100).toFixed(1);
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { pct: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const { name, value, payload: p } = payload[0];
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium">{name}</p>
      <p className="text-muted-foreground">
        {formatNumber(value)} · {p.pct}%
      </p>
    </div>
  );
}

export function ReseñasDonut() {
  const { data, isLoading } = useSWR<ReseñasStats>(
    "resenas-stats",
    fetchReseñasStats,
  );

  const chartData = data
    ? [
        {
          name: "Aceptadas",
          value: data.aceptadas,
          pct: pct(data.aceptadas, data.total),
          fill: "var(--plumbing)",
        },
        {
          name: "Rechazadas",
          value: data.rechazadas,
          pct: pct(data.rechazadas, data.total),
          fill: "var(--destructive)",
        },
      ]
    : [];

  const tasaAceptacion = data ? pct(data.aceptadas, data.total) : null;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Tasa de Aceptación de Reseñas
        </CardTitle>
        <CardDescription>
          {data
            ? `${formatNumber(data.total)} reseñas recibidas · Feedback App`
            : "Reseñas aceptadas vs. rechazadas · Feedback App"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex items-center gap-6">
            <Skeleton className="size-40 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-full" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            {/* Donut */}
            <div className="relative shrink-0">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                    strokeWidth={0}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Porcentaje central */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-(family-name:--font-display) text-2xl font-bold">
                  {tasaAceptacion}%
                </span>
                <span className="text-xs text-muted-foreground">aceptadas</span>
              </div>
            </div>

            {/* Leyenda con stats */}
            <div className="flex w-full flex-col gap-3">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-plumbing" />
                  <span className="text-sm font-medium">Aceptadas</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {formatNumber(data.aceptadas)}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({pct(data.aceptadas, data.total)}%)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-destructive" />
                  <span className="text-sm font-medium">Rechazadas</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold">
                    {formatNumber(data.rechazadas)}
                  </span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({pct(data.rechazadas, data.total)}%)
                  </span>
                </div>
              </div>

              {/* Barra de progreso */}
              <div
                className="mt-1 h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--destructive)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    backgroundColor: "var(--plumbing)",
                    width: `${pct(data.aceptadas, data.total)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
