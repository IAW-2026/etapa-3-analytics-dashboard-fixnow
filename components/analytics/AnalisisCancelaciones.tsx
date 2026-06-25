"use client";

import useSWR from "swr";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
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
  fetchCancelaciones,
  fetchSuccessRate,
  formatNumber,
  type CancelacionDatum,
  type SuccessRateDatum,
} from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";
import { useMemo } from "react";

const categoryColors: Record<string, string> = {
  Plomería: "var(--plumbing)",
  Gas: "var(--gas)",
  Electricidad: "var(--electrical)",
};

// Tooltip para el gráfico de motivos (barras horizontales)
function MotivoTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {payload[0].payload.motivo}
      </p>
      <div className="flex items-center gap-2 text-sm font-semibold text-brand-accent">
        <span>{formatNumber(payload[0].value)} cancelaciones</span>
      </div>
    </div>
  );
}

// Tooltip para el gráfico de tasas (%)
function TasaTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <div className="flex items-center gap-2 text-sm">
        <span
          className="size-2.5 rounded-full"
          style={{ backgroundColor: payload[0].payload.fill }}
        />
        <span className="text-muted-foreground">
          {payload[0].payload.category}:
        </span>
        <span className="font-semibold text-popover-foreground">
          {payload[0].value}%
        </span>
      </div>
    </div>
  );
}

export function AnalisisCancelaciones({ period = "6m" }: { period?: Period }) {
  // Traemos los datos de motivos y la tasa de éxito (para sacar la proporción)
  const { data: motivosRaw, isLoading: loadingMotivos } = useSWR<
    CancelacionDatum[]
  >(
    "cancelaciones-motivos", // Los motivos globales (el seed no los vinculó por mes, así que traemos todo)
    fetchCancelaciones,
  );

  const { data: successData, isLoading: loadingSuccess } = useSWR<
    SuccessRateDatum[]
  >(`success-rate-${period}`, () => fetchSuccessRate(period));

  // Procesamiento 1: Agrupar los motivos globales para el gráfico de barras horizontales
  const motivosData = useMemo(() => {
    if (!motivosRaw) return [];

    // Le decimos a TS que curr es 'any' para evitar que se queje de la interfaz estricta
    const agrupados = motivosRaw.reduce(
      (acc, curr: any) => {
        // Prisma devuelve el count anidado en groupBy: _count: { motivo: X }
        // Atajamos ese caso, y por las dudas también si viene como número directo
        const cantidad = curr._count?.motivo ?? curr._count ?? 1;

        const existente = acc.find((item) => item.motivo === curr.motivo);
        if (existente) {
          existente.total += cantidad;
        } else {
          acc.push({ motivo: curr.motivo, total: cantidad });
        }
        return acc;
      },
      [] as { motivo: string; total: number }[],
    );

    // Ordenamos de mayor a menor y nos quedamos con el top 5
    return agrupados.sort((a, b) => b.total - a.total).slice(0, 5);
  }, [motivosRaw]);

  // Procesamiento 2: Calcular la tasa de cancelación (%) por cada servicio
  const tasasData = useMemo(() => {
    if (!successData) return [];
    return successData.map((d) => {
      const total = d.completados + d.cancelados;
      const rate = total > 0 ? (d.cancelados / total) * 100 : 0;
      return {
        category: d.label,
        rate: parseFloat(rate.toFixed(1)),
        fill: categoryColors[d.label],
      };
    });
  }, [successData]);

  const loading = loadingMotivos || loadingSuccess;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* CARD 1: Gráfico de Barras Horizontales (Ocupa 2 columnas) */}
      <Card className="border-border lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-(family-name:--font-display) text-lg">
            Principales Motivos de Cancelación
          </CardTitle>
          <CardDescription>
            Razones más frecuentes reportadas por clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={motivosData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke="var(--border)"
                />
                <XAxis type="number" hide />
                <YAxis
                  dataKey="motivo"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  width={140}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={<MotivoTooltip />}
                />
                <Bar
                  dataKey="total"
                  fill="var(--brand-accent)"
                  radius={[0, 4, 4, 0]}
                  barSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* CARD 2: Tasa de Cancelación por Categoría (Ocupa 1 columna) */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-(family-name:--font-display) text-lg">
            Tasa de Cancelación
          </CardTitle>
          <CardDescription>% de caída sobre el volumen total</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[260px] w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={tasasData} margin={{ top: 10 }}>
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="category"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v) => `${v}%`}
                  width={40}
                />
                <Tooltip
                  cursor={{ fill: "var(--muted)" }}
                  content={<TasaTooltip />}
                />
                <Bar dataKey="rate" radius={[4, 4, 0, 0]} barSize={40}>
                  {tasasData.map((entry) => (
                    <Cell key={entry.category} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
