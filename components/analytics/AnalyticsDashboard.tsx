"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCards } from "@/components/analytics/KpiCards";
import { AnalyticsCharts } from "@/components/analytics/AnalyticsCharts";
import { RevenueTrendChart } from "@/components/analytics/RevenueTrendChart";
import { TopProfessionals } from "@/components/analytics/TopProfessionals";
import type { AnalyticsView } from "@/components/analytics/AnalyticsSidebar";

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

export function AnalyticsDashboard({ currentView }: AnalyticsDashboardProps) {
  const { title, subtitle } = titles[currentView];
  const now = new Date().toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-background/80 px-8 py-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-(family-name:--font-display) text-2xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-muted-foreground sm:inline">
            Actualizado: {now}
          </span>
          <Button variant="outline" size="sm" className="gap-2">
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
        </div>
      </header>

      {/* Content */}
      <div className="space-y-6 p-8">
        {currentView === "resumen" && (
          <>
            <KpiCards />
            <AnalyticsCharts />
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <RevenueTrendChart />
              <TopProfessionals />
            </div>
          </>
        )}

        {currentView === "analisis" && (
          <>
            <KpiCards />
            <AnalyticsCharts />
            <RevenueTrendChart />
          </>
        )}

        {currentView === "monitoreo" && (
          <>
            <KpiCards />
            <TopProfessionals />
          </>
        )}
      </div>
    </div>
  );
}
