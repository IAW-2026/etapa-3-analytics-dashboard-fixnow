"use client";

import useSWR from "swr";
import {
  ComposedChart,
  Line,
  Area,
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
  fetchComparativaMensual,
  formatCompactCLP,
  formatNumber,
  type ComparativaMensualDatum,
} from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";

// Tooltip personalizado para manejar diferentes formatos numéricos (plata vs. cantidad)
function ComparativaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-4 py-3 shadow-md">
      <p className="mb-2 text-sm font-semibold text-muted-foreground border-b border-border pb-1">
        {label}
      </p>
      <div className="flex flex-col gap-1.5">
        {payload.map((entry: any, i: number) => {
          const isCurrency = entry.dataKey === "ingresos";
          return (
            <div
              key={i}
              className="flex items-center justify-between gap-6 text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-muted-foreground">{entry.name}:</span>
              </div>
              <span className="font-medium text-popover-foreground">
                {isCurrency
                  ? formatCompactCLP(entry.value)
                  : formatNumber(entry.value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AnalisisComparativaChart({
  period = "6m",
}: {
  period?: Period;
}) {
  const { data, isLoading } = useSWR<ComparativaMensualDatum[]>(
    `comparativa-mensual-${period}`,
    () => fetchComparativaMensual(period),
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Comparativa Operativa y Financiera
        </CardTitle>
        <CardDescription>
          Ingresos vs. Volumen de trabajos y clientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-[320px] w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--electrical)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--electrical)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />

              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                dy={10}
              />

              {/* Eje Y Izquierdo (Para millones de pesos) */}
              <YAxis
                yAxisId="left"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v) => formatCompactCLP(v)}
                width={70}
              />

              {/* Eje Y Derecho (Para cantidades de trabajos y clientes) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                tickFormatter={(v) => formatNumber(v)}
                width={50}
              />

              <Tooltip content={<ComparativaTooltip />} />
              <Legend
                iconType="circle"
                wrapperStyle={{ paddingTop: 20, fontSize: 12 }}
              />

              {/* Área de fondo para los ingresos */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="ingresos"
                name="Ingresos (GMV)"
                fill="url(#colorIngresos)"
                stroke="var(--electrical)"
                strokeWidth={2}
              />

              {/* Líneas para las métricas operativas */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="completados"
                name="Completados"
                stroke="var(--plumbing)"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="nuevos"
                name="Clientes Nuevos"
                stroke="#7aa7d6"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="cancelados"
                name="Cancelados"
                stroke="var(--brand-accent)"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
