"use client";
import { ProfessionalRevenueRanking } from "@/components/analytics/ProfessionalRevenueRanking";
import { PaymentsFinancialInsight } from "@/components/analytics/PaymentsFinancialInsight";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/analytics/KpiCards";
import {
  AnalyticsCharts,
  RevenueByCategoryChart,
} from "@/components/analytics/AnalyticsCharts";
import { RevenueTrendChart } from "@/components/analytics/RevenueTrendChart";
import { TopProfessionals } from "@/components/analytics/TopProfessionals";
import { RatingHistogram } from "@/components/analytics/RatingHistogram";
import { AlertasCalidad } from "@/components/analytics/AlertasCalidad";
import { ReseñasDonut } from "@/components/analytics/ReseñasDonut";
import type { AnalyticsView } from "@/components/analytics/AnalyticsSidebar";
import { useState } from "react";
import { AnalisisCharts } from "@/components/analytics/AnalisisCharts";
import { AnalisisComparativaChart } from "@/components/analytics/AnalisisComparativaChart";
import { AnalisisCancelaciones } from "@/components/analytics/AnalisisCancelaciones";
import { AnalisisInsightsBanner } from "@/components/analytics/AnalisisInsightsBanner";
import { PaymentStatusChart } from "@/components/analytics/PaymentStatusChart";
import { sincronizarDatos } from "@/app/dashboard/actions";
export type Period = "30d" | "90d" | "6m" | "1y";

interface AnalyticsDashboardProps {
  currentView: AnalyticsView;
}

const titles: Record<AnalyticsView, { title: string; subtitle: string }> = {
  resumen: {
    title: "Resumen General",
    subtitle: "Vista consolidada del ecosistema FixNow en tiempo real",
  },
  analisis: {
    title: "Análisis de Operaciones",
    subtitle: "Distribución de trabajos, tasa de éxito y tendencia de ingresos",
  },
  monitoreo: {
    title: "Monitoreo de Profesionales",
    subtitle:
      "Ranking y desempeño de los mejores profesionales de la plataforma",
  },
};

const periods: { value: Period; label: string }[] = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "6m", label: "6 meses" },
  { value: "1y", label: "1 año" },
];

export function AnalyticsDashboard({ currentView }: AnalyticsDashboardProps) {
  const [period, setPeriod] = useState<Period>("6m");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { title, subtitle } = titles[currentView];
  const now = new Date().toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try{
      const resultado = await sincronizarDatos(); 

      if(!resultado.success){
        throw new Error(resultado.error || "Error al sincronizar las bases de datos");
      }

      window.location.reload();
    } catch(error){
      console.error("Hubo un error al actualizar:", error);
      alert("Hubo un error al actualizar.");
    } finally{
      setIsRefreshing(false)
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/80 px-8 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Selector de período — solo visible en Análisis */}
          {currentView === "analisis" && (
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
              {periods.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                    period === p.value
                      ? "bg-plumbing text-white shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Actualizado: {now}
          </span>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}/>
            {isRefreshing ? "Actualizando..." : "Actualizar"}
          </Button>
        </div>
      </header>

      <div className="space-y-6 p-8">
        {currentView === "resumen" && (
          <>
            <KpiCards />
            <AnalyticsCharts />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RevenueTrendChart />
              <RevenueByCategoryChart />
            </div>
            <TopProfessionals />
          </>
        )}

        {currentView === "analisis" && (
          <>
            <AnalisisInsightsBanner period={period} />
            <AnalisisCharts period={period} />
            <AnalisisComparativaChart period={period} />
            <PaymentsFinancialInsight period={period} />
            <PaymentStatusChart />
            <AnalisisCancelaciones period={period} />
          </>
        )}

        {currentView === "monitoreo" && (
          <>
            <TopProfessionals />
            <ProfessionalRevenueRanking />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RatingHistogram />
              <ReseñasDonut />
            </div>
            <AlertasCalidad />
          </>
        )}
      </div>
    </div>
  );
}
