"use client";

import { useMemo, useState, type ReactNode } from "react";
import useSWR from "swr";
import {
  AlertTriangle,
  ArrowRight,
  CreditCard,
  Info,
  ShieldCheck,
  Target,
  TrendingUp,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  fetchKpis,
  formatCompactCLP,
  formatNumber,
  type KpiData,
} from "@/lib/analytics-data";
import type { Period } from "./AnalyticsDashboard";

type UnknownRecord = Record<string, unknown>;
type PaymentStatus = "paid" | "pending" | "processing" | "failed";

interface PaymentsFinancialInsightProps {
  period?: Period;
}

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error("No se pudieron cargar los datos de Payments");
  }

  return response.json();
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractArray(data: unknown): UnknownRecord[] {
  if (Array.isArray(data)) return data.filter(isRecord);
  if (!isRecord(data)) return [];

  const possibleKeys = ["trabajos", "jobs", "data", "items", "payments"];

  for (const key of possibleKeys) {
    const value = data[key];

    if (Array.isArray(value)) {
      return value.filter(isRecord);
    }
  }

  return [];
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.toLowerCase().trim() : "";
}

function toNumber(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAmount(item: UnknownRecord): number {
  return toNumber(
    item.monto ||
      item.amount ||
      item.total ||
      item.montoTotal ||
      item.totalAmount,
  );
}

function getPaymentStatus(item: UnknownRecord): PaymentStatus {
  const directStatus =
    getString(item.paymentStatus) ||
    getString(item.estadoPago) ||
    getString(item.statusPago) ||
    getString(item.payment_status);

  if (
    directStatus === "paid" ||
    directStatus === "pagado" ||
    directStatus === "acreditado"
  ) {
    return "paid";
  }

  if (
    directStatus === "processing" ||
    directStatus === "procesando" ||
    directStatus === "en_proceso" ||
    directStatus === "en proceso"
  ) {
    return "processing";
  }

  if (
    directStatus === "failed" ||
    directStatus === "fallido" ||
    directStatus === "rechazado"
  ) {
    return "failed";
  }

  if (directStatus === "pending" || directStatus === "pendiente") {
    return "pending";
  }

  const payment = item.payment;

  if (isRecord(payment)) {
    const nestedStatus =
      getString(payment.status) ||
      getString(payment.estado) ||
      getString(payment.paymentStatus);

    if (
      nestedStatus === "paid" ||
      nestedStatus === "pagado" ||
      nestedStatus === "acreditado"
    ) {
      return "paid";
    }

    if (
      nestedStatus === "processing" ||
      nestedStatus === "procesando" ||
      nestedStatus === "en_proceso" ||
      nestedStatus === "en proceso"
    ) {
      return "processing";
    }

    if (
      nestedStatus === "failed" ||
      nestedStatus === "fallido" ||
      nestedStatus === "rechazado"
    ) {
      return "failed";
    }

    if (nestedStatus === "pending" || nestedStatus === "pendiente") {
      return "pending";
    }
  }

  const jobStatus = getString(item.estado) || getString(item.status);

  if (
    jobStatus === "completado" ||
    jobStatus === "completed" ||
    jobStatus === "paid" ||
    jobStatus === "pagado"
  ) {
    return "paid";
  }

  if (
    jobStatus === "processing" ||
    jobStatus === "procesando" ||
    jobStatus === "en_proceso" ||
    jobStatus === "en proceso"
  ) {
    return "processing";
  }

  if (
    jobStatus === "failed" ||
    jobStatus === "fallido" ||
    jobStatus === "cancelado" ||
    jobStatus === "cancelled"
  ) {
    return "failed";
  }

  return "pending";
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

type InsightKey = "health" | "risk" | "profitability";

type InsightCard = {
  key: InsightKey;
  title: string;
  icon: ReactNode;
  body: ReactNode;
  detailTitle: string;
  origin: ReactNode;
  recommendation: ReactNode;
};

export function PaymentsFinancialInsight({
  period = "6m",
}: PaymentsFinancialInsightProps) {
  const [selectedInsight, setSelectedInsight] = useState<InsightKey | null>(
    null,
  );

  const { data: kpis, isLoading: loadingKpis } = useSWR<KpiData>(
    `payments-financial-insight-${period}`,
    () => fetchKpis(period),
  );

  const urlParams = useMemo(() => {
    if (!period) return "";
    const hasta = new Date();
    const desde = new Date();
    if (period === "30d") desde.setDate(desde.getDate() - 30);
    else if (period === "90d") desde.setDate(desde.getDate() - 90);
    else if (period === "6m") desde.setMonth(desde.getMonth() - 6);
    else if (period === "1y") desde.setFullYear(desde.getFullYear() - 1);

    return `?desde=${desde.toISOString().split("T")[0]}&hasta=${hasta.toISOString().split("T")[0]}`;
  }, [period]);

  const {
    data: trabajosData,
    isLoading: loadingTrabajos,
    error,
  } = useSWR(`/api/trabajos${urlParams}`, fetcher);

  const stats = useMemo(() => {
    const trabajos = extractArray(trabajosData);

    const totalOperaciones = trabajos.length;

    let pagosAcreditados = 0;
    let pagosPendientes = 0;
    let pagosEnProceso = 0;
    let pagosFallidos = 0;

    let montoAcreditado = 0;
    let montoEnRiesgo = 0;

    for (const trabajo of trabajos) {
      const status = getPaymentStatus(trabajo);
      const amount = getAmount(trabajo);

      if (status === "paid") {
        pagosAcreditados += 1;
        montoAcreditado += amount;
      }

      if (status === "pending") {
        pagosPendientes += 1;
        montoEnRiesgo += amount;
      }

      if (status === "processing") {
        pagosEnProceso += 1;
        montoEnRiesgo += amount;
      }

      if (status === "failed") {
        pagosFallidos += 1;
        montoEnRiesgo += amount;
      }
    }

    const tasaPagosExitosos =
      totalOperaciones > 0 ? (pagosAcreditados / totalOperaciones) * 100 : 0;

    return {
      totalOperaciones,
      pagosAcreditados,
      pagosPendientes,
      pagosEnProceso,
      pagosFallidos,
      montoAcreditado,
      montoEnRiesgo,
      tasaPagosExitosos,
    };
  }, [trabajosData]);

  const isLoading = loadingKpis || loadingTrabajos;

  const volumenTotal = kpis?.transactionVolume ?? stats.montoAcreditado;
  const ingresosFixNow = kpis?.netRevenue ?? volumenTotal * 0.15;
  const pedidosCompletados = kpis?.completedOrders ?? stats.pagosAcreditados;

  const montoPromedioPorPedido =
    kpis?.averageTicket && kpis.averageTicket > 0
      ? kpis.averageTicket
      : pedidosCompletados > 0
        ? volumenTotal / pedidosCompletados
        : 0;

  const comisionPromedio =
    pedidosCompletados > 0 ? ingresosFixNow / pedidosCompletados : 0;

  const porcentajeComision =
    volumenTotal > 0 ? (ingresosFixNow / volumenTotal) * 100 : 0;

  const insights: InsightCard[] = [
    {
      key: "health",
      title: "Efectividad de pagos",
      icon: <ShieldCheck className="size-3.5 text-brand-accent" />,
      body: (
        <>
          El{" "}
          <strong className="text-foreground">
            {formatPercent(stats.tasaPagosExitosos)}
          </strong>{" "}
          de las operaciones se encuentran acreditadas.
        </>
      ),
      detailTitle: "Detalle de salud de pagos",
      origin: (
        <>
          El motor financiero evaluó{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(stats.totalOperaciones)} operaciones
          </span>{" "}
          registradas desde Payments App. De ese total,{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(stats.pagosAcreditados)}
          </span>{" "}
          figuran como pagos acreditados.
        </>
      ),
      recommendation: (
        <>
          Mantener una tasa alta de pagos exitosos ayuda a sostener la liquidez
          de la plataforma. Se recomienda monitorear diariamente los pagos que
          no pasen automáticamente a estado acreditado.
        </>
      ),
    },
    {
      key: "risk",
      title: "Control de Riesgo",
      icon: <AlertTriangle className="size-3.5 text-brand-accent" />,
      body: (
        <>
          Hay{" "}
          <strong className="text-brand-accent">
            {formatCompactCLP(stats.montoEnRiesgo)}
          </strong>{" "}
          en operaciones pendientes, en proceso o fallidas.
        </>
      ),
      detailTitle: "Detalle de riesgo financiero",
      origin: (
        <>
          Se detectaron{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(stats.pagosPendientes)}
          </span>{" "}
          pagos pendientes,{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(stats.pagosEnProceso)}
          </span>{" "}
          en proceso y{" "}
          <span className="font-semibold text-foreground">
            {formatNumber(stats.pagosFallidos)}
          </span>{" "}
          fallidos. El monto asociado a estos estados es de{" "}
          <span className="font-semibold text-foreground">
            {formatCompactCLP(stats.montoEnRiesgo)}
          </span>
          .
        </>
      ),
      recommendation: (
        <>
          Se recomienda revisar los pagos fallidos y contactar al cliente cuando
          corresponda. El objetivo es recuperar ingresos potenciales y evitar
          que operaciones iniciadas queden sin acreditar.
        </>
      ),
    },
    {
      key: "profitability",
      title: "Rentabilidad",
      icon: <TrendingUp className="size-3.5 text-brand-accent" />,
      body: (
        <>
          FixNow retiene una comisión estimada de{" "}
          <strong className="text-foreground">
            {formatCompactCLP(ingresosFixNow)}
          </strong>
          .
        </>
      ),
      detailTitle: "Detalle de rentabilidad",
      origin: (
        <>
          El volumen financiero analizado es de{" "}
          <span className="font-semibold text-foreground">
            {formatCompactCLP(volumenTotal)}
          </span>
          . Sobre ese total, FixNow registra una comisión estimada de{" "}
          <span className="font-semibold text-foreground">
            {formatCompactCLP(ingresosFixNow)}
          </span>
          , equivalente al{" "}
          <span className="font-semibold text-foreground">
            {formatPercent(porcentajeComision)}
          </span>
          . La comisión promedio por pedido es de{" "}
          <span className="font-semibold text-foreground">
            {formatCompactCLP(comisionPromedio)}
          </span>
          .
        </>
      ),
      recommendation: (
        <>
          Conviene identificar las categorías que generan mayor comisión y
          priorizar acciones comerciales sobre esos servicios. También se
          recomienda comparar el monto promedio por pedido, actualmente de{" "}
          <span className="font-semibold text-foreground">
            {formatCompactCLP(montoPromedioPorPedido)}
          </span>
          .
        </>
      ),
    },
  ];

  const selected = insights.find((item) => item.key === selectedInsight);

  return (
    <>
      <Card className="border-border bg-gradient-to-r from-orange-50/40 via-background to-background p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Insight Financiero de Payments
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Lectura automática sobre pagos, riesgo y rentabilidad.
            </p>
          </div>

          <p className="text-sm text-muted-foreground">
            Click en un panel para analizar
          </p>
        </div>

        {isLoading ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        ) : error ? (
          <p className="mt-5 text-sm text-muted-foreground">
            No se pudo cargar el análisis financiero de Payments.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {insights.map((insight) => (
              <button
                key={insight.key}
                type="button"
                onClick={() => setSelectedInsight(insight.key)}
                className="group flex h-full flex-col justify-between gap-3 rounded-lg border border-border/50 bg-card p-4 text-left shadow-sm transition-all hover:border-brand-accent/50 hover:shadow-md cursor-pointer"
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-accent/15">
                      {insight.icon}
                    </div>

                    <span className="text-sm font-semibold text-foreground">
                      {insight.title}
                    </span>
                  </div>

                  <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <p className="text-sm leading-relaxed text-muted-foreground">
                  {insight.body}
                </p>
              </button>
            ))}
          </div>
        )}
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-border bg-background p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Info className="size-6 text-brand-accent" />

                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    {selected.detailTitle}
                  </h2>

                  <p className="mt-1 text-sm text-muted-foreground">
                    Justificación de datos y recomendación financiera de FixNow.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInsight(null)}
                className="rounded-lg border border-border p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-6 rounded-xl border border-border bg-background p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-brand-accent" />

                <h3 className="font-semibold text-foreground">
                  Origen del dato
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {selected.origin}
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50/60 p-4">
              <div className="flex items-center gap-2">
                <Target className="size-5 text-brand-accent" />

                <h3 className="font-semibold text-brand-accent">
                  Recomendación de negocio
                </h3>
              </div>

              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {selected.recommendation}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
