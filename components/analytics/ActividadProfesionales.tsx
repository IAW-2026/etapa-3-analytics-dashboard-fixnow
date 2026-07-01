"use client";

import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchActividadProfesionales,
  formatNumber,
  type ActividadBucket,
} from "@/lib/analytics-data";

export function ActividadProfesionales() {
  const { data, isLoading } = useSWR<ActividadBucket[]>(
    "actividad-profesionales",
    fetchActividadProfesionales,
  );

  const total = data?.reduce((acc, b) => acc + b.cantidad, 0) ?? 0;
  const activos = data?.[0]?.cantidad ?? 0;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-(family-name:--font-display) text-lg">
          Actividad de Profesionales
        </CardTitle>
        <CardDescription>
          {total > 0
            ? `${formatNumber(activos)} de ${formatNumber(total)} activos en los últimos 30 días · Driver App`
            : "Distribución por última actividad registrada · Driver App"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="space-y-4">
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Barra apilada proporcional */}
            <div className="flex h-3 w-full overflow-hidden rounded-full">
              {data.map((b) => (
                <div
                  key={b.bucket}
                  title={`${b.bucket}: ${formatNumber(b.cantidad)}`}
                  style={{
                    width: total ? `${(b.cantidad / total) * 100}%` : "25%",
                    backgroundColor: b.fill,
                  }}
                  className="h-full transition-all duration-500"
                />
              ))}
            </div>

            {/* Tiles de stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {data.map((b) => (
                <div
                  key={b.bucket}
                  className="flex flex-col gap-1 rounded-lg bg-muted/50 px-3 py-3"
                >
                  <span
                    className="h-1.5 w-5 rounded-full"
                    style={{ backgroundColor: b.fill }}
                  />
                  <span className="text-xl font-bold tabular-nums">
                    {formatNumber(b.cantidad)}
                  </span>
                  <span className="text-xs text-muted-foreground leading-tight">
                    {b.bucket}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}