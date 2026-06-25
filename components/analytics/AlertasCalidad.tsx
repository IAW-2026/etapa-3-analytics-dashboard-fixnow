"use client";

import useSWR from "swr";
import { AlertTriangle, Droplets, Zap, Flame } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchAlertas, type AlertaProfesional } from "@/lib/analytics-data";

const categoryConfig: Record<
  string,
  { icon: typeof Droplets; color: string; label: string }
> = {
  PLOMERIA: { icon: Droplets, color: "var(--plumbing)", label: "Plomería" },
  ELECTRICIDAD: { icon: Zap, color: "var(--electrical)", label: "Electricidad" },
  GAS: { icon: Flame, color: "var(--gas)", label: "Gas" },
};

function riesgo(pro: AlertaProfesional): "alto" | "medio" {
  if (pro.calificacionPromedio < 3.0 || pro.totalCancelaciones > 20) return "alto";
  return "medio";
}

function tasaCancelacion(pro: AlertaProfesional): string {
  if (!pro.totalTrabajos) return "—";
  return ((pro.totalCancelaciones / pro.totalTrabajos) * 100).toFixed(0) + "%";
}

export function AlertasCalidad() {
  const { data, isLoading } = useSWR<AlertaProfesional[]>(
    "alertas-calidad",
    fetchAlertas,
  );

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="size-4 text-destructive" />
          <CardTitle className="font-(family-name:--font-display) text-lg">
            Alertas de Calidad
          </CardTitle>
        </div>
        <CardDescription>
          Profesionales con rating &lt; 3.5 o más de 10 cancelaciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin alertas activas — todos los profesionales están dentro del umbral
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Profesional</th>
                  <th className="pb-2 pr-4 font-medium">Categoría</th>
                  <th className="pb-2 pr-4 font-medium">Ciudad</th>
                  <th className="pb-2 pr-4 text-center font-medium">Rating</th>
                  <th className="pb-2 pr-4 text-center font-medium">Cancelaciones</th>
                  <th className="pb-2 text-center font-medium">Riesgo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.map((pro) => {
                  const cat = categoryConfig[pro.categoria];
                  const Icon = cat?.icon ?? Droplets;
                  const nivel = riesgo(pro);
                  const bajoRating = pro.calificacionPromedio < 3.5;
                  const muchasCancelaciones = pro.totalCancelaciones > 10;

                  return (
                    <tr key={pro.id} className="group">
                      <td className="py-3 pr-4 font-medium text-foreground">
                        {pro.nombre}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-1.5">
                          <Icon
                            className="size-3.5"
                            style={{ color: cat?.color }}
                          />
                          <span className="text-muted-foreground">
                            {cat?.label ?? pro.categoria}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {pro.ciudad}
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span
                          className={
                            bajoRating
                              ? "font-semibold text-destructive"
                              : "text-foreground"
                          }
                        >
                          ★ {pro.calificacionPromedio.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        <span
                          className={
                            muchasCancelaciones
                              ? "font-semibold text-destructive"
                              : "text-foreground"
                          }
                        >
                          {pro.totalCancelaciones}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({tasaCancelacion(pro)})
                          </span>
                        </span>
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={nivel === "alto" ? "destructive" : "outline"}
                          className={
                            nivel === "medio"
                              ? "border-orange-400 text-orange-500"
                              : ""
                          }
                        >
                          {nivel === "alto" ? "Alto" : "Medio"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
