"use client";

import useSWR from "swr";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
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
  fetchJobsByCategory,
  fetchSuccessRate,
  formatNumber,
  type CategoryDatum,
  type SuccessRateDatum,
} from "@/lib/analytics-data";

const categoryColors: Record<string, string> = {
  Plomería: "var(--plumbing)",
  Gas: "var(--gas)",
  Electricidad: "var(--electrical)",
};

function ChartTooltip({
  active,
  payload,
  suffix = "",
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload?: { fill?: string };
  }>;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: entry.color ?? entry.payload?.fill }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium text-popover-foreground">
            {formatNumber(entry.value)}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function JobsByCategoryChart() {
  const { data, isLoading } = useSWR<CategoryDatum[]>(
    "jobs-by-category",
    fetchJobsByCategory,
  );
  const total = data?.reduce((acc, d) => acc + d.jobs, 0) ?? 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Trabajos por Categoría
        </CardTitle>
        <CardDescription>Distribución de servicios · Rider App</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="flex h-70 items-center justify-center">
            <Skeleton className="size-48 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="relative h-55 w-full max-w-60">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="jobs"
                    nameKey="category"
                    innerRadius={62}
                    outerRadius={95}
                    paddingAngle={2}
                    strokeWidth={2}
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={categoryColors[entry.category]}
                        stroke="var(--card)"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip suffix=" trabajos" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-(family-name:--font-display)text-2xl font-bold">
                  {formatNumber(total)}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 sm:max-w-45">
              {data.map((entry) => {
                const pct = ((entry.jobs / total) * 100).toFixed(1);
                return (
                  <div
                    key={entry.category}
                    className="flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 rounded-full"
                        style={{
                          backgroundColor: categoryColors[entry.category],
                        }}
                      />
                      <span className="text-sm text-foreground">
                        {entry.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuccessRateChart() {
  const { data, isLoading } = useSWR<SuccessRateDatum[]>(
    "success-rate",
    fetchSuccessRate,
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Tasa de Éxito
        </CardTitle>
        <CardDescription>
          Completados vs. cancelados · Rider App
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-70 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barGap={6}>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v) => formatNumber(v)}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={<ChartTooltip />}
              />
              <Legend
                iconType="circle"
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              />
              <Bar
                dataKey="completados"
                name="Completados"
                fill="var(--plumbing)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="cancelados"
                name="Cancelados"
                fill="var(--brand-accent)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsCharts() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <JobsByCategoryChart />
      <SuccessRateChart />
    </div>
  );
}
