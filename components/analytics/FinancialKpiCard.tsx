"use client";

import { ArrowLeftRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCompactCLP,
  formatNumber,
  type KpiData,
} from "@/lib/analytics-data";
import { ExportFinancialExcelButton } from "@/components/analytics/ExportFinancialExcelButton";

interface FinancialKpiCardProps {
  data?: KpiData;
  isLoading: boolean;
}

function getAverageOrderAmount(data: KpiData): number {
  if (data.averageTicket && data.averageTicket > 0) {
    return data.averageTicket;
  }

  if (data.completedOrders > 0) {
    return data.transactionVolume / data.completedOrders;
  }

  return 0;
}

export function FinancialKpiCard({ data, isLoading }: FinancialKpiCardProps) {
  const averageOrderAmount = data ? getAverageOrderAmount(data) : 0;

  return (
    <Card className="relative flex h-full flex-col overflow-hidden border-border p-5 lg:col-span-3">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: "var(--brand-accent)" }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--brand-accent) 18%, transparent)",
            }}
          >
            <ArrowLeftRight
              className="size-5"
              style={{ color: "var(--brand-accent)" }}
            />
          </div>

          <div>
            <h3 className="text-base font-semibold text-foreground">
              Resumen Financiero
            </h3>

            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground/70">
              Payments App
            </p>
          </div>
        </div>

        <ExportFinancialExcelButton />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <div className="pt-2 sm:px-2 sm:pt-0">
          <p className="text-sm text-muted-foreground">Volumen total</p>

          {isLoading || !data ? (
            <Skeleton className="mt-1.5 h-8 w-32" />
          ) : (
            <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight">
              {formatCompactCLP(data.transactionVolume)}
            </p>
          )}

          {isLoading || !data ? (
            <Skeleton className="mt-2 h-4 w-32" />
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatNumber(data.completedOrders)} pedidos completados
            </p>
          )}
        </div>

        <div className="pt-4 sm:px-4 sm:pt-0">
          <p className="text-sm text-muted-foreground">Ingresos FixNow</p>

          {isLoading || !data ? (
            <Skeleton className="mt-1.5 h-8 w-32" />
          ) : (
            <>
              <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight">
                {formatCompactCLP(data.netRevenue)}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Comisión neta estimada
              </p>
            </>
          )}
        </div>

        <div className="pt-4 sm:px-4 sm:pt-0">
          <p className="text-sm text-muted-foreground">
            Monto promedio por pedido
          </p>

          {isLoading || !data ? (
            <Skeleton className="mt-1.5 h-8 w-32" />
          ) : (
            <p className="mt-1 font-(family-name:--font-display) text-3xl font-bold tracking-tight">
              {formatCompactCLP(averageOrderAmount)}
            </p>
          )}

          <p className="mt-1 text-xs text-muted-foreground">
            Promedio abonado por trabajo
          </p>
        </div>
      </div>

      {/* Aquí aplicamos el mt-auto para empujarlo exactamente hacia el fondo */}
      <p className="mt-auto border-t border-border pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
        Payments App
      </p>
    </Card>
  );
}