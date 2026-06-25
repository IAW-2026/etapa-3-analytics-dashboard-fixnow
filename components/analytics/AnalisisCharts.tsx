"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Importamos más iconos para enriquecer los diferentes modales
import {
  Activity,
  XCircle,
  DollarSign,
  Wrench,
  PieChart as PieChartIcon,
  AlertTriangle,
  Wallet,
  TrendingDown,
} from "lucide-react";
import {
  fetchJobsByCategory,
  fetchSuccessRate,
  fetchAverageTicket,
  formatNumber,
  formatCompactCLP,
  type CategoryDatum,
  type SuccessRateDatum,
  type AverageTicketDatum,
} from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";

const categoryColors: Record<string, string> = {
  Plomería: "var(--plumbing)",
  Gas: "var(--gas)",
  Electricidad: "var(--electrical)",
};

// --- Tipos para el Modal Dinámico ---
type ChartSource = "volume" | "success" | "ticket";

interface ModalState {
  category: string;
  source: ChartSource;
}

function ChartTooltip({
  active,
  payload,
  suffix = "",
  prefix = "",
}: {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color?: string;
    payload?: { fill?: string };
  }>;
  suffix?: string;
  prefix?: string;
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
            {prefix}
            {formatNumber(entry.value)}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}

function JobsByCategoryInteractive({
  period,
  onCategoryClick,
}: {
  period: Period;
  onCategoryClick: (cat: string, source: ChartSource) => void;
}) {
  const { data, isLoading } = useSWR<CategoryDatum[]>(
    `jobs-by-category-${period}`,
    () => fetchJobsByCategory(period),
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
          <div className="flex flex-col items-center gap-6">
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
                    onClick={(data: any) =>
                      data?.name && onCategoryClick(data.name, "volume")
                    }
                  >
                    {data.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={categoryColors[entry.category]}
                        stroke="var(--card)"
                        className="cursor-pointer hover:opacity-80 transition-opacity duration-200"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip suffix=" trabajos" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-(family-name:--font-display) text-2xl font-bold">
                  {formatNumber(total)}
                </span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {data.map((entry) => {
                const pct = ((entry.jobs / total) * 100).toFixed(1);
                return (
                  <div key={entry.category} className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{
                        backgroundColor: categoryColors[entry.category],
                      }}
                    />
                    <span className="text-sm text-foreground">
                      {entry.category}
                    </span>
                    <span className="text-sm font-semibold">{pct}%</span>
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

function SuccessRateInteractive({
  period,
  onCategoryClick,
}: {
  period: Period;
  onCategoryClick: (cat: string, source: ChartSource) => void;
}) {
  const { data, isLoading } = useSWR<SuccessRateDatum[]>(
    `success-rate-${period}`,
    () => fetchSuccessRate(period),
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
                onClick={(data: any) =>
                  data?.label && onCategoryClick(data.label, "success")
                }
                cursor="pointer"
              />
              <Bar
                dataKey="cancelados"
                name="Cancelados"
                fill="var(--brand-accent)"
                radius={[4, 4, 0, 0]}
                onClick={(data: any) =>
                  data?.label && onCategoryClick(data.label, "success")
                }
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

function AverageTicketChart({
  period,
  onCategoryClick,
}: {
  period: Period;
  onCategoryClick: (cat: string, source: ChartSource) => void;
}) {
  const { data, isLoading } = useSWR<AverageTicketDatum[]>(
    `average-ticket-${period}`,
    () => fetchAverageTicket(period),
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Monto Promedio por Servicio
        </CardTitle>
        <CardDescription>
          Comparación del valor promedio por categoría · Payments App
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <Skeleton className="h-70 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} barSize={40}>
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
                tickFormatter={(v) => formatCompactCLP(v)}
                width={50}
              />
              <Tooltip
                cursor={{ fill: "var(--muted)" }}
                content={<ChartTooltip prefix="$" />}
              />
              <Bar
                dataKey="ticket"
                name="Ticket"
                radius={[4, 4, 0, 0]}
                onClick={(data: any) =>
                  data?.category && onCategoryClick(data.category, "ticket")
                }
                cursor="pointer"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={entry.fill}
                    className="hover:opacity-80 transition-opacity"
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

function CategoryInsightModal({
  state,
  onClose,
  period,
}: {
  state: ModalState | null;
  onClose: () => void;
  period: Period;
}) {
  const { data: successData } = useSWR<SuccessRateDatum[]>(
    `success-rate-${period}`,
  );
  const { data: ticketData } = useSWR<AverageTicketDatum[]>(
    `average-ticket-${period}`,
  );

  if (!state) return null;

  const { category, source } = state;

  // Cálculos matemáticos corregidos y unificados
  const successStats = successData?.find((d) => d.label === category);
  const ticketStats = ticketData?.find((d) => d.category === category);

  const completados = successStats?.completados ?? 0;
  const cancelados = successStats?.cancelados ?? 0;

  // SOLUCIÓN BUG: El total real de trabajos solicitados es completados + cancelados
  const totalSolicitados = completados + cancelados;
  const tasaExito =
    totalSolicitados > 0
      ? ((completados / totalSolicitados) * 100).toFixed(1)
      : "0.0";
  const ticketPromedio = ticketStats?.ticket ?? 0;

  // Métricas avanzadas para BI
  const totalGlobalSolicitados =
    successData?.reduce((acc, d) => acc + d.completados + d.cancelados, 0) ?? 0;
  const participacionGlobal =
    totalGlobalSolicitados > 0
      ? ((totalSolicitados / totalGlobalSolicitados) * 100).toFixed(1)
      : "0.0";

  const facturacionBruta = completados * ticketPromedio;
  const ingresosPerdidos = cancelados * ticketPromedio;
  const comisionNeta = facturacionBruta * 0.15; // 15% estándar de FixNow

  // Configuramos el contenido dinámico según qué gráfico se clickeó
  let modalTitle = "";
  let modalDesc = "";
  let CardsContent = null;

  if (source === "volume") {
    modalTitle = `Análisis de Demanda: ${category}`;
    modalDesc = "Métricas de participación y volumen general del mercado.";
    CardsContent = (
      <>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PieChartIcon className="size-4" /> Volumen de Solicitudes
          </div>
          <span className="font-semibold text-xl">
            {formatNumber(totalSolicitados)}
          </span>
          <span className="text-xs text-muted-foreground">
            Trabajos ingresados al sistema
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="size-4" /> Cuota de Mercado
          </div>
          <span className="font-semibold text-xl text-plumbing">
            {participacionGlobal}%
          </span>
          <span className="text-xs text-muted-foreground">
            Del total de la plataforma
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wrench className="size-4" /> Completados
          </div>
          <span className="font-semibold text-xl text-success">
            {formatNumber(completados)}
          </span>
          <span className="text-xs text-muted-foreground">
            Trabajos finalizados
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="size-4" /> Cancelados
          </div>
          <span className="font-semibold text-xl text-brand-accent">
            {formatNumber(cancelados)}
          </span>
          <span className="text-xs text-muted-foreground">Trabajos caídos</span>
        </div>
      </>
    );
  } else if (source === "success") {
    modalTitle = `Rendimiento Operativo: ${category}`;
    modalDesc =
      "Análisis de eficiencia, cancelaciones y oportunidades de mejora.";
    CardsContent = (
      <>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="size-4" /> Tasa de Éxito
          </div>
          <span className="font-semibold text-xl text-plumbing">
            {tasaExito}%
          </span>
          <span className="text-xs text-muted-foreground">
            Efectividad de cierre
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AlertTriangle className="size-4" /> Ratio de Pérdida
          </div>
          <span className="font-semibold text-xl">
            1 de{" "}
            {cancelados > 0 ? Math.round(totalSolicitados / cancelados) : 0}
          </span>
          <span className="text-xs text-muted-foreground">
            Trabajos termina cancelado
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="size-4" /> Total Cancelaciones
          </div>
          <span className="font-semibold text-xl text-brand-accent">
            {formatNumber(cancelados)}
          </span>
          <span className="text-xs text-muted-foreground">
            En el período seleccionado
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingDown className="size-4 text-brand-accent" /> Dinero en la
            Mesa
          </div>
          <span className="font-semibold text-xl text-brand-accent">
            {formatCompactCLP(ingresosPerdidos)}
          </span>
          <span className="text-xs text-muted-foreground">
            Facturación perdida por caídas
          </span>
        </div>
      </>
    );
  } else {
    // Ticket (Finanzas)
    modalTitle = `Análisis Financiero: ${category}`;
    modalDesc = "Métricas de facturación, tickets y comisiones de FixNow.";
    CardsContent = (
      <>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="size-4" /> Ticket Promedio
          </div>
          <span className="font-semibold text-xl text-electrical">
            {formatCompactCLP(ticketPromedio)}
          </span>
          <span className="text-xs text-muted-foreground">
            Valor medio por servicio
          </span>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-border p-3 bg-muted/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" /> Facturación Bruta (GMV)
          </div>
          <span className="font-semibold text-xl">
            {formatCompactCLP(facturacionBruta)}
          </span>
          <span className="text-xs text-muted-foreground">
            Movido por profesionales
          </span>
        </div>
        <div className="col-span-2 flex flex-col gap-1 rounded-lg border border-electrical/30 bg-electrical/5 p-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="size-4 text-electrical" /> Ingresos FixNow
            Estimados (~15%)
          </div>
          <span className="font-semibold text-2xl text-electrical">
            {formatCompactCLP(comisionNeta)}
          </span>
          <span className="text-xs text-muted-foreground">
            Comisión neta para la plataforma
          </span>
        </div>
      </>
    );
  }

  return (
    <Dialog open={!!state} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md border-border bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-(family-name:--font-display) text-xl">
            <span
              className="size-3 rounded-full shrink-0"
              style={{ backgroundColor: categoryColors[category] }}
            />
            {modalTitle}
          </DialogTitle>
          <DialogDescription>{modalDesc}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">{CardsContent}</div>
      </DialogContent>
    </Dialog>
  );
}

export function AnalisisCharts({ period = "6m" }: { period?: Period }) {
  // Ahora el estado guarda qué categoría se seleccionó Y desde qué gráfico
  const [modalState, setModalState] = useState<ModalState | null>(null);

  const handleOpenModal = (category: string, source: ChartSource) => {
    setModalState({ category, source });
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <JobsByCategoryInteractive
          period={period}
          onCategoryClick={handleOpenModal}
        />
        <SuccessRateInteractive
          period={period}
          onCategoryClick={handleOpenModal}
        />
        <AverageTicketChart period={period} onCategoryClick={handleOpenModal} />
      </div>

      <CategoryInsightModal
        state={modalState}
        onClose={() => setModalState(null)}
        period={period}
      />
    </>
  );
}
