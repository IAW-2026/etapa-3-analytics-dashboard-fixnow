"use client";

import useSWR from "swr";
import {
  Award,
  Briefcase,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCompactCLP,
  formatNumber,
  fetchProfessionalRevenueRanking,
  type ProfessionalRevenueRow,
} from "@/lib/analytics-data";

export function ProfessionalRevenueRanking() {
  // Ahora llamamos directamente a la función limpia desde SWR
  const { data: ranking, isLoading, error } = useSWR<ProfessionalRevenueRow[]>(
    "professional-revenue-ranking",
    fetchProfessionalRevenueRanking
  );

  const topProfessional = ranking?.[0];

  return (
    <Card className="border-border p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-(family-name:--font-display) text-xl font-semibold tracking-tight">
            Ranking financiero de profesionales
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Profesionales que más facturación generan para la plataforma ·
            Payments App
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-brand-accent">
          <DollarSign className="size-4" />
          Payments App
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : error ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No se pudo cargar el ranking financiero de profesionales.
        </p>
      ) : !ranking || ranking.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No hay trabajos completados disponibles para calcular el ranking.
        </p>
      ) : (
        <>
          {topProfessional && (
            <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-background text-brand-accent">
                    <Award className="size-5" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Profesional con mayor facturación
                    </p>

                    <h3 className="mt-1 text-lg font-bold text-foreground">
                      {topProfessional.professionalName}
                    </h3>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-2xl font-black text-foreground">
                    {formatCompactCLP(topProfessional.totalRevenue)}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {formatNumber(topProfessional.completedJobs)} trabajos
                    completados
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 border-b border-border bg-muted/40 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <span>Profesional</span>
              <span>Total generado</span>
              <span>Comisión FixNow</span>
              <span>Trabajos</span>
            </div>

            {ranking.map((professional, index) => (
              <div
                key={professional.professionalId}
                className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-4 border-b border-border px-4 py-4 text-sm last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground">
                    {index + 1}
                  </div>

                  <div>
                    <p className="font-semibold text-foreground">
                      {professional.professionalName}
                    </p>

                    <p className="text-xs text-muted-foreground">
                      Promedio:{" "}
                      {formatCompactCLP(professional.averageAmount)} por
                      trabajo
                    </p>
                  </div>
                </div>

                <div className="flex items-center font-semibold text-foreground">
                  {formatCompactCLP(professional.totalRevenue)}
                </div>

                <div className="flex items-center text-brand-accent font-semibold">
                  {formatCompactCLP(professional.fixNowCommission)}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="size-4" />
                  {formatNumber(professional.completedJobs)}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
            <TrendingUp className="mt-0.5 size-4 text-brand-accent" />

            <p>
              Este ranking permite identificar qué profesionales generan mayor
              volumen económico, complementando el monitoreo de calificaciones y
              desempeño operativo.
            </p>
          </div>
        </>
      )}
    </Card>
  );
}