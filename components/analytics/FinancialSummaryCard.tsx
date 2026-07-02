"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import * as XLSX from "xlsx";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Landmark,
  ReceiptText,
} from "lucide-react";

type UnknownRecord = Record<string, unknown>;

type CategoryFinancialRow = {
  categoria: string;
  trabajosCompletados: number;
  ingresosBrutos: number;
  comisionFixNow: number;
  pagoProfesionales: number;
  montoPromedioPorPedido: number;
  porcentajeTotal: number;
};

const fetcher = async (url: string) => {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${url}`);
  }

  return response.json();
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function pickNumber(source: unknown, keys: string[], fallback = 0): number {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];
    const parsed = toNumber(value);

    if (parsed > 0) return parsed;
  }

  return fallback;
}

function pickMaybeNumber(source: unknown, keys: string[]): number | null {
  if (!isRecord(source)) return null;

  for (const key of keys) {
    const value = source[key];

    if (value === undefined || value === null) continue;

    const parsed = toNumber(value);

    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function pickString(source: unknown, keys: string[], fallback = "-"): string {
  if (!isRecord(source)) return fallback;

  for (const key of keys) {
    const value = source[key];

    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return fallback;
}

function extractArray(data: unknown): UnknownRecord[] {
  if (Array.isArray(data)) {
    return data.filter(isRecord);
  }

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

function isCompletedJob(job: UnknownRecord): boolean {
  const estado = pickString(job, ["estado", "status"], "").toUpperCase();

  return estado === "COMPLETADO" || estado === "PAID" || estado === "PAGADO";
}

function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString("es-AR")}`;
}

function formatCompactMoney(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }

  if (abs >= 1_000) {
    return `$${Math.round(value / 1_000)}K`;
  }

  return formatMoney(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function buildCategoryRows(
  jobs: UnknownRecord[],
  totalGross: number,
): CategoryFinancialRow[] {
  const grouped = new Map<string, CategoryFinancialRow>();

  for (const job of jobs) {
    const categoria = pickString(
      job,
      ["categoria", "category", "serviceType", "service_type"],
      "Sin categoría",
    );

    const monto = pickNumber(job, ["monto", "amount", "total"], 0);

    const comision =
      pickMaybeNumber(job, [
        "comisionFixNow",
        "commissionFixNow",
        "commission",
        "comision",
      ]) ?? monto * 0.15;

    const current = grouped.get(categoria) || {
      categoria,
      trabajosCompletados: 0,
      ingresosBrutos: 0,
      comisionFixNow: 0,
      pagoProfesionales: 0,
      montoPromedioPorPedido: 0,
      porcentajeTotal: 0,
    };

    current.trabajosCompletados += 1;
    current.ingresosBrutos += monto;
    current.comisionFixNow += comision;
    current.pagoProfesionales = current.ingresosBrutos - current.comisionFixNow;
    current.montoPromedioPorPedido =
      current.trabajosCompletados > 0
        ? current.ingresosBrutos / current.trabajosCompletados
        : 0;
    current.porcentajeTotal =
      totalGross > 0 ? (current.ingresosBrutos / totalGross) * 100 : 0;

    grouped.set(categoria, current);
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.ingresosBrutos - a.ingresosBrutos,
  );
}

function addSheet(
  workbook: XLSX.WorkBook,
  rows: Record<string, string | number>[],
  sheetName: string,
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);

  worksheet["!cols"] = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 4, 18),
  }));

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
}

export function FinancialSummaryCard() {
  const [open, setOpen] = useState(false);

  const { data: kpis, isLoading: loadingKpis } = useSWR("/api/kpis", fetcher);

  const { data: jobsData, isLoading: loadingJobs } = useSWR(
    "/api/trabajos?estado=COMPLETADO",
    fetcher,
  );

  const completedJobs = useMemo(() => {
    const jobs = extractArray(jobsData);
    const filtered = jobs.filter(isCompletedJob);

    return filtered.length > 0 ? filtered : jobs;
  }, [jobsData]);

  const grossFromJobs = useMemo(() => {
    return completedJobs.reduce((total, job) => {
      return total + pickNumber(job, ["monto", "amount", "total"], 0);
    }, 0);
  }, [completedJobs]);

  const commissionFromJobs = useMemo(() => {
    return completedJobs.reduce((total, job) => {
      const monto = pickNumber(job, ["monto", "amount", "total"], 0);

      const comision =
        pickMaybeNumber(job, [
          "comisionFixNow",
          "commissionFixNow",
          "commission",
          "comision",
        ]) ?? monto * 0.15;

      return total + comision;
    }, 0);
  }, [completedJobs]);

  const grossRevenue = pickNumber(
    kpis,
    ["volumenTransacciones", "transactionVolume", "ingresosBrutos"],
    grossFromJobs,
  );

  const fixNowRevenue = pickNumber(
    kpis,
    ["ingresosNetos", "netRevenue", "ingresosFixNow"],
    commissionFromJobs || grossRevenue * 0.15,
  );

  const professionalRevenue = grossRevenue - fixNowRevenue;

  const completedOrders = pickNumber(
    kpis,
    ["pedidosCompletados", "completedOrders", "trabajosCompletados"],
    completedJobs.length,
  );

  const averageOrderAmount = pickNumber(
    kpis,
    ["montoPromedioPorPedido", "averageOrderValue", "valorPromedioPedido"],
    completedOrders > 0 ? grossRevenue / completedOrders : 0,
  );

  const commissionRate =
    grossRevenue > 0 ? (fixNowRevenue / grossRevenue) * 100 : 0;

  const categoryRows = useMemo(() => {
    return buildCategoryRows(completedJobs, grossRevenue);
  }, [completedJobs, grossRevenue]);

  const isLoading = loadingKpis || loadingJobs;

  function handleExportExcel() {
    const generatedAt = new Date();

    const workbook = XLSX.utils.book_new();

    addSheet(
      workbook,
      [
        {
          Métrica: "Volumen total de transacciones",
          Valor: grossRevenue,
          Observación: "Monto total abonado por clientes",
        },
        {
          Métrica: "Ingresos FixNow",
          Valor: fixNowRevenue,
          Observación: "Comisión neta estimada de la plataforma",
        },
        {
          Métrica: "Pago a profesionales",
          Valor: professionalRevenue,
          Observación: "Ingresos brutos menos comisión FixNow",
        },
        {
          Métrica: "Trabajos completados",
          Valor: completedOrders,
          Observación: "Cantidad de trabajos considerados",
        },
        {
          Métrica: "Monto promedio por pedido",
          Valor: averageOrderAmount,
          Observación: "Promedio abonado por cada trabajo completado",
        },
        {
          Métrica: "Porcentaje de comisión",
          Valor: `${commissionRate.toFixed(2)}%`,
          Observación: "Relación entre comisión e ingresos brutos",
        },
        {
          Métrica: "Fecha de generación",
          Valor: generatedAt.toLocaleString("es-AR"),
          Observación: "Reporte generado desde Analytics App",
        },
      ],
      "Resumen financiero",
    );

    addSheet(
      workbook,
      categoryRows.map((row) => ({
        Categoría: row.categoria,
        "Trabajos completados": row.trabajosCompletados,
        "Ingresos brutos": row.ingresosBrutos,
        "Comisión FixNow": row.comisionFixNow,
        "Pago a profesionales": row.pagoProfesionales,
        "Monto promedio por pedido": row.montoPromedioPorPedido,
        "Porcentaje del total": `${row.porcentajeTotal.toFixed(2)}%`,
      })),
      "Ingresos categoria",
    );

    addSheet(
      workbook,
      completedJobs.map((job) => {
        const monto = pickNumber(job, ["monto", "amount", "total"], 0);

        const comision =
          pickMaybeNumber(job, [
            "comisionFixNow",
            "commissionFixNow",
            "commission",
            "comision",
          ]) ?? monto * 0.15;

        return {
          "ID trabajo": pickString(job, ["id", "jobId", "job_id"]),
          Fecha: pickString(job, [
            "completedAt",
            "completed_at",
            "createdAt",
            "created_at",
            "fecha",
          ]),
          Categoría: pickString(job, [
            "categoria",
            "category",
            "serviceType",
            "service_type",
          ]),
          Estado: pickString(job, ["estado", "status"]),
          "Monto total": monto,
          "Comisión FixNow": comision,
          "Monto profesional": monto - comision,
          "Cliente ID": pickString(job, ["clienteId", "clientId", "client_id"]),
          "Profesional ID": pickString(job, [
            "profesionalId",
            "professionalId",
            "professional_id",
          ]),
        };
      }),
      "Transacciones",
    );

    XLSX.writeFile(
      workbook,
      `reporte-financiero-fixnow-${generatedAt
        .toISOString()
        .slice(0, 10)}.xlsx`,
    );
  }

  return (
    <section className="flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Landmark className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              Resumen Financiero
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Ingresos, comisiones y pagos desde Payments App.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          disabled={isLoading}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Descargar Excel
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Volumen total
          </p>

          <p className="mt-2 text-2xl font-black text-foreground">
            {isLoading ? "..." : formatCompactMoney(grossRevenue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Total abonado por clientes
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ingresos FixNow
          </p>

          <p className="mt-2 text-2xl font-black text-foreground">
            {isLoading ? "..." : formatCompactMoney(fixNowRevenue)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Comisión neta estimada
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Monto promedio
          </p>

          <p className="mt-2 text-2xl font-black text-foreground">
            {isLoading ? "..." : formatCompactMoney(averageOrderAmount)}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Promedio por pedido completado
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pedidos completados
          </p>

          <p className="mt-2 text-2xl font-black text-foreground">
            {isLoading ? "..." : completedOrders.toLocaleString("es-AR")}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Trabajos considerados
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ReceiptText className="h-4 w-4" />
          Reporte financiero disponible para administración.
        </div>

        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          {open ? "Ocultar desglose financiero" : "Ver desglose financiero"}
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
      </div>

      {open && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.4fr]">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="font-semibold text-foreground">Desglose general</h3>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Ingresos brutos</span>
                <span className="font-semibold">
                  {formatMoney(grossRevenue)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Comisión FixNow</span>
                <span className="font-semibold">
                  {formatMoney(fixNowRevenue)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">
                  Pago a profesionales
                </span>
                <span className="font-semibold">
                  {formatMoney(professionalRevenue)}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Comisión estimada</span>
                <span className="font-semibold">
                  {formatPercent(commissionRate)}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <h3 className="font-semibold text-foreground">
              Ingresos por categoría
            </h3>

            <div className="mt-4 space-y-3">
              {categoryRows.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No hay datos por categoría disponibles.
                </p>
              )}

              {categoryRows.map((row) => (
                <div
                  key={row.categoria}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-medium text-foreground">
                      {row.categoria}
                    </span>

                    <span className="text-sm font-bold text-foreground">
                      {formatCompactMoney(row.ingresosBrutos)}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>{row.trabajosCompletados} trabajos</span>
                    <span>
                      Promedio {formatCompactMoney(row.montoPromedioPorPedido)}
                    </span>
                    <span>{formatPercent(row.porcentajeTotal)} del total</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
