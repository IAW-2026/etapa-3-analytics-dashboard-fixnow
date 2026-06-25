"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Lightbulb,
  TrendingDown,
  CalendarDays,
  Sparkles,
  ArrowRight,
  Info,
  Target,
  BarChart3,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  fetchSuccessRate,
  formatNumber,
  type SuccessRateDatum,
} from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";

type InsightType = "demanda" | "foco" | "traccion";

const fetchRawJobs = async (period: Period) => {
  const hasta = new Date();
  const desde = new Date();
  if (period === "30d") desde.setDate(desde.getDate() - 30);
  else if (period === "90d") desde.setDate(desde.getDate() - 90);
  else if (period === "6m") desde.setMonth(desde.getMonth() - 6);
  else if (period === "1y") desde.setFullYear(desde.getFullYear() - 1);

  const params = `desde=${desde.toISOString().split("T")[0]}&hasta=${hasta.toISOString().split("T")[0]}`;
  const res = await fetch(`/api/trabajos?${params}`);
  if (!res.ok) throw new Error("Error al cargar trabajos crudos");
  return res.json();
};

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

export function AnalisisInsightsBanner({ period = "6m" }: { period?: Period }) {
  const [selectedInsight, setSelectedInsight] = useState<InsightType | null>(
    null,
  );

  const { data: rawJobs } = useSWR(`raw-jobs-${period}`, () =>
    fetchRawJobs(period),
  );
  const { data: successData } = useSWR<SuccessRateDatum[]>(
    `success-rate-${period}`,
    () => fetchSuccessRate(period),
  );

  const insights = useMemo(() => {
    if (!rawJobs || !successData || rawJobs.length === 0) return null;

    // 1. Análisis de Días
    const daysCount = [0, 0, 0, 0, 0, 0, 0];
    rawJobs.forEach((job: any) => {
      const date = new Date(job.fechaCreacion);
      daysCount[date.getDay()]++;
    });

    const totalJobs = rawJobs.length;
    const avgJobsPerDay = totalJobs / 7;

    let maxDayIdx = 0;
    let minDayIdx = 0;
    for (let i = 1; i < 7; i++) {
      if (daysCount[i] > daysCount[maxDayIdx]) maxDayIdx = i;
      if (daysCount[i] < daysCount[minDayIdx]) minDayIdx = i;
    }

    const minDayDiff =
      avgJobsPerDay > 0
        ? ((avgJobsPerDay - daysCount[minDayIdx]) / avgJobsPerDay) * 100
        : 0;

    // 2. Análisis de Cancelaciones
    let maxCancelCategory = "";
    let maxCancelRate = 0;
    let maxCancelTotal = 0;
    let maxCancelSolicitados = 0;

    successData.forEach((d) => {
      const total = d.completados + d.cancelados;
      const rate = total > 0 ? (d.cancelados / total) * 100 : 0;
      if (rate > maxCancelRate) {
        maxCancelRate = rate;
        maxCancelCategory = d.label;
        maxCancelTotal = d.cancelados;
        maxCancelSolicitados = total;
      }
    });

    return {
      totalJobsAnalizados: totalJobs,
      promedioDiario: Math.round(avgJobsPerDay),
      // Datos Baja Demanda
      diaMenor: diasSemana[minDayIdx],
      diaMenorPct: minDayDiff.toFixed(1),
      diaMenorTotal: daysCount[minDayIdx],
      // Datos Pico Demanda
      diaMayor: diasSemana[maxDayIdx],
      diaMayorTotal: daysCount[maxDayIdx],
      // Datos Foco Operativo
      peorCategoria: maxCancelCategory,
      peorTasa: maxCancelRate.toFixed(1),
      peorCategoriaCancelados: maxCancelTotal,
      peorCategoriaSolicitados: maxCancelSolicitados,
    };
  }, [rawJobs, successData]);

  if (!insights) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  // --- Renderizado del contenido del Modal según el Insight seleccionado ---
  const renderModalContent = () => {
    if (!selectedInsight) return null;

    if (selectedInsight === "demanda") {
      return (
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-sm">
              <BarChart3 className="size-4 text-brand-accent" /> Origen del Dato
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              El motor analítico evaluó una muestra de{" "}
              <strong>{formatNumber(insights.totalJobsAnalizados)}</strong>{" "}
              trabajos en el período seleccionado. El promedio de actividad es
              de <strong>{formatNumber(insights.promedioDiario)}</strong>{" "}
              solicitudes por día de la semana, pero los{" "}
              <strong>{insights.diaMenor}s</strong> caen a tan solo{" "}
              <strong>{formatNumber(insights.diaMenorTotal)}</strong>.
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-sm text-brand-accent">
              <Target className="size-4" /> Recomendación de Negocio
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Existe capacidad ociosa en la flota de profesionales. Se
              recomienda configurar descuentos automáticos o campañas de
              marketing por correo electrónico apuntadas específicamente a los
              días {insights.diaMenor} para reactivar la demanda y balancear la
              carga operativa.
            </p>
          </div>
        </div>
      );
    }

    if (selectedInsight === "foco") {
      return (
        <div className="space-y-4 py-2">
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-sm">
              <BarChart3 className="size-4 text-electrical" /> Origen del Dato
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Al analizar la tasa de éxito de todas las categorías, se detectó
              que de un total de{" "}
              <strong>{formatNumber(insights.peorCategoriaSolicitados)}</strong>{" "}
              solicitudes para <strong>{insights.peorCategoria}</strong>,
              <strong> {formatNumber(insights.peorCategoriaCancelados)}</strong>{" "}
              terminaron siendo canceladas, arrojando la tasa más alta del
              sistema ({insights.peorTasa}%).
            </p>
          </div>
          <div className="flex flex-col gap-2 rounded-lg border border-electrical/30 bg-electrical/5 p-4">
            <h4 className="flex items-center gap-2 font-semibold text-sm text-electrical">
              <Target className="size-4" /> Recomendación de Negocio
            </h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Esta métrica suele indicar falta de liquidez en la red (escasez de
              profesionales activos en esa categoría) o problemas de tarifas. Se
              sugiere contactar a los principales referentes de{" "}
              {insights.peorCategoria} para evaluar sus motivos de rechazo de
              viajes o incentivar nuevos ingresos en este oficio.
            </p>
          </div>
        </div>
      );
    }

    // traccion
    return (
      <div className="space-y-4 py-2">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-4">
          <h4 className="flex items-center gap-2 font-semibold text-sm">
            <BarChart3 className="size-4 text-plumbing" /> Origen del Dato
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Las estadísticas de creación de trabajos indican que los{" "}
            <strong>{insights.diaMayor}s</strong> lideran de forma consistente
            el volumen de actividad en la plataforma, registrando{" "}
            <strong>{formatNumber(insights.diaMayorTotal)}</strong> trabajos,
            superando ampliamente la media semanal de{" "}
            {formatNumber(insights.promedioDiario)}.
          </p>
        </div>
        <div className="flex flex-col gap-2 rounded-lg border border-plumbing/30 bg-plumbing/5 p-4">
          <h4 className="flex items-center gap-2 font-semibold text-sm text-plumbing">
            <Target className="size-4" /> Recomendación Técnica y Operativa
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Es vital garantizar la estabilidad de los servicios. Se aconseja
            pre-escalar la infraestructura en la nube (AWS/Vercel) para absorber
            el pico de peticiones y asegurar que el equipo de soporte técnico
            esté de guardia en este lapso crítico.
          </p>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="mb-6 rounded-xl border border-border bg-gradient-to-r from-plumbing/10 via-transparent to-transparent p-1">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className=" text-electrical" />
            Insights Automáticos
          </div>
          <span className="text-xs text-muted-foreground">
            Click en un panel para analizar
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 p-2 md:grid-cols-3">
          {/* Tarjeta 1: Demanda */}
          <button
            onClick={() => setSelectedInsight("demanda")}
            className="group flex flex-col items-start gap-3 rounded-lg bg-card p-4 text-left shadow-sm border border-border/50 transition-all hover:border-brand-accent/50 hover:shadow-md cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/15">
                  <TrendingDown className="size-3.5 text-brand-accent" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Alerta de Demanda
                </span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Los días{" "}
              <strong className="text-foreground">{insights.diaMenor}</strong>{" "}
              registran un{" "}
              <strong className="text-brand-accent">
                {insights.diaMenorPct}% menos
              </strong>{" "}
              de actividad que el promedio.
            </p>
          </button>

          {/* Tarjeta 2: Foco Operativo */}
          <button
            onClick={() => setSelectedInsight("foco")}
            className="group flex flex-col items-start gap-3 rounded-lg bg-card p-4 text-left shadow-sm border border-border/50 transition-all hover:border-electrical/50 hover:shadow-md cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-electrical/15">
                  <Lightbulb className="size-3.5 text-electrical" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Foco Operativo
                </span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong className="text-foreground">
                {insights.peorCategoria}
              </strong>{" "}
              lidera la tasa de cancelación con un preocupante{" "}
              <strong className="text-electrical">{insights.peorTasa}%</strong>{" "}
              actual.
            </p>
          </button>

          {/* Tarjeta 3: Tracción */}
          <button
            onClick={() => setSelectedInsight("traccion")}
            className="group flex flex-col items-start gap-3 rounded-lg bg-card p-4 text-left shadow-sm border border-border/50 transition-all hover:border-plumbing/50 hover:shadow-md cursor-pointer"
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-plumbing/15">
                  <CalendarDays className="size-3.5 text-plumbing" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  Día Pico
                </span>
              </div>
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Los días{" "}
              <strong className="text-foreground">{insights.diaMayor}</strong>{" "}
              son consistentemente el día de mayor tracción de la plataforma.
            </p>
          </button>
        </div>
      </div>

      <Dialog
        open={selectedInsight !== null}
        onOpenChange={(open) => !open && setSelectedInsight(null)}
      >
        <DialogContent className="sm:max-w-lg border-border bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-(family-name:--font-display) text-xl">
              <Info className="size-5" />
              Detalle del Insight Analítico
            </DialogTitle>
            <DialogDescription>
              Justificación de datos y recomendación automática de FixNow BI.
            </DialogDescription>
          </DialogHeader>

          {renderModalContent()}
        </DialogContent>
      </Dialog>
    </>
  );
}
