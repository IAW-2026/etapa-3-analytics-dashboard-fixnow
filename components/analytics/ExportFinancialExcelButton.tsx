"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Trabajo = Record<string, any>;
type Metrica = Record<string, any>;

type SummaryRow = {
  Metric: string;
  Value: string | number;
  Notes: string;
};

type CategoryRow = {
  Category: string;
  CompletedJobs: number;
  GrossRevenue: number;
  FixNowCommission: number;
  ProfessionalPayout: number;
  AverageTicket: number;
  ShareOfTotal: string;
};

type TransactionRow = {
  JobId: string;
  Date: string;
  Category: string;
  Status: string;
  Amount: number;
  FixNowCommission: number;
  ProfessionalPayout: number;
  ClientId: string;
  ProfessionalId: string;
};

function toNumber(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getArray(data: any, key: string) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.[key])) return data[key];
  return [];
}

function getCategoria(trabajo: Trabajo): string {
  return (
    trabajo.categoria ||
    trabajo.category ||
    trabajo.serviceType ||
    trabajo.service_type ||
    "Sin categoría"
  );
}

function getEstado(trabajo: Trabajo): string {
  return String(trabajo.estado || trabajo.status || "").toUpperCase();
}

function getMonto(trabajo: Trabajo): number {
  return toNumber(trabajo.monto || trabajo.amount || trabajo.total);
}

function getComision(trabajo: Trabajo): number {
  const comision = toNumber(
    trabajo.comisionFixNow ||
      trabajo.commissionFixNow ||
      trabajo.comision ||
      trabajo.commission,
  );

  if (comision > 0) return comision;
  return getMonto(trabajo) * 0.15;
}

function getPaymentStatus(trabajo: Trabajo): string {
  const directStatus = String(
    trabajo.paymentStatus ||
      trabajo.estadoPago ||
      trabajo.statusPago ||
      trabajo.payment_status ||
      trabajo.payment?.status ||
      "",
  ).toLowerCase();

  if (["paid", "pagado", "acreditado"].includes(directStatus)) return "Pagado";
  if (
    ["processing", "procesando", "en_proceso", "en proceso"].includes(
      directStatus,
    )
  )
    return "En proceso";
  if (["failed", "fallido", "rechazado"].includes(directStatus))
    return "Fallido";
  if (["pending", "pendiente"].includes(directStatus)) return "Pendiente";

  const estado = getEstado(trabajo);
  if (["PAID", "PAGADO", "COMPLETADO"].includes(estado)) return "Pagado";
  if (["EN_PROCESO", "PROCESSING", "PROCESANDO"].includes(estado))
    return "En proceso";
  if (["CANCELADO", "CANCELLED", "FAILED", "FALLIDO"].includes(estado))
    return "Fallido";
  return "Pendiente";
}

function buildCategoryRows(
  jobs: Trabajo[],
  grossRevenue: number,
): CategoryRow[] {
  const grouped = new Map<string, CategoryRow>();

  for (const job of jobs) {
    const category = getCategoria(job);
    const amount = getMonto(job);
    const commission = getComision(job);

    const current = grouped.get(category) || {
      Category: category,
      CompletedJobs: 0,
      GrossRevenue: 0,
      FixNowCommission: 0,
      ProfessionalPayout: 0,
      AverageTicket: 0,
      ShareOfTotal: "0.0%",
    };

    current.CompletedJobs += 1;
    current.GrossRevenue += amount;
    current.FixNowCommission += commission;
    current.ProfessionalPayout =
      current.GrossRevenue - current.FixNowCommission;
    current.AverageTicket =
      current.CompletedJobs > 0
        ? current.GrossRevenue / current.CompletedJobs
        : 0;
    current.ShareOfTotal =
      grossRevenue > 0
        ? `${((current.GrossRevenue / grossRevenue) * 100).toFixed(2)}%`
        : "0.0%";

    grouped.set(category, current);
  }

  return Array.from(grouped.values()).sort(
    (a, b) => b.GrossRevenue - a.GrossRevenue,
  );
}

function buildTransactionRows(jobs: Trabajo[]): TransactionRow[] {
  return jobs.map((job) => {
    const amount = getMonto(job);
    const commission = getComision(job);

    return {
      JobId: String(job.id || job.jobId || job.job_id || "-"),
      Date: String(job.requested_date || job.fechaCreacion || "-"),
      Category: getCategoria(job),
      Status: getPaymentStatus(job),
      Amount: amount,
      FixNowCommission: commission,
      ProfessionalPayout: amount - commission,
      ClientId: String(job.clienteId || job.clientId || job.client_id || "-"),
      ProfessionalId: String(
        job.profesionalId || job.professionalId || job.professional_id || "-",
      ),
    };
  });
}

function buildWorkbookSheet(
  rows: Record<string, string | number>[],
  sheetName: string,
) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length + 2, 16),
  }));
  return { worksheet, sheetName };
}

export function ExportFinancialExcelButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);

    try {
      const generatedAt = new Date();
      const [kpisRes, trabajosRes, metricasRes] = await Promise.all([
        fetch("/api/kpis", { cache: "no-store" }),
        fetch("/api/trabajos", { cache: "no-store" }),
        fetch("/api/metricas", { cache: "no-store" }),
      ]);

      if (!kpisRes.ok || !trabajosRes.ok || !metricasRes.ok) {
        throw new Error(
          "No se pudieron cargar los datos para el reporte financiero",
        );
      }

      const kpis = await kpisRes.json();
      const trabajosData = await trabajosRes.json();
      const metricasData = await metricasRes.json();

      const trabajos: Trabajo[] = getArray(trabajosData, "trabajos");
      const metricas: Metrica[] = getArray(metricasData, "metricas");
      const trabajosCerrados = trabajos.filter(
        (trabajo) =>
          ["PAID", "PAGADO", "COMPLETADO"].includes(getEstado(trabajo)) ||
          getPaymentStatus(trabajo) === "Pagado",
      );

      const ingresosBrutos =
        toNumber(kpis.volumenTransacciones) ||
        trabajosCerrados.reduce((acc, job) => acc + getMonto(job), 0);
      const comisionFixNow =
        toNumber(kpis.ingresosNetos) ||
        trabajosCerrados.reduce((acc, job) => acc + getComision(job), 0);
      const pedidosCompletados =
        toNumber(kpis.pedidosCompletados) || trabajosCerrados.length;
      const montoPromedioPorPedido =
        pedidosCompletados > 0 ? ingresosBrutos / pedidosCompletados : 0;
      const porcentajeComision =
        ingresosBrutos > 0 ? comisionFixNow / ingresosBrutos : 0;

      const categoryRows = buildCategoryRows(trabajosCerrados, ingresosBrutos);
      const transactionRows = buildTransactionRows(trabajos);

      const resumenRows: SummaryRow[] = [
        {
          Metric: "Volumen total de transacciones",
          Value: ingresosBrutos,
          Notes: "Monto total abonado por clientes",
        },
        {
          Metric: "Ingresos FixNow",
          Value: comisionFixNow,
          Notes: "Comisión neta estimada",
        },
        {
          Metric: "Trabajos cerrados",
          Value: pedidosCompletados,
          Notes: "Jobs con pago acreditado",
        },
        {
          Metric: "Monto promedio por pedido",
          Value: montoPromedioPorPedido,
          Notes: "Promedio abonado por trabajo cerrado",
        },
        {
          Metric: "Comisión sobre volumen",
          Value: `${(porcentajeComision * 100).toFixed(2)}%`,
          Notes: "Proporción de FixNow sobre el volumen total",
        },
        {
          Metric: "Fecha de generación",
          Value: generatedAt.toLocaleString("es-AR"),
          Notes: "Reporte generado desde Analytics",
        },
      ];

      const monthlyRows = metricas.map((item) => ({
        Period: `${item.mes}/${item.anio}`,
        Category: item.categoria || "General",
        CompletedJobs: toNumber(item.trabajosCompletados),
        CancelledJobs: toNumber(item.trabajosCancelados),
        NewClients: toNumber(item.clientesNuevos),
        Revenue: toNumber(item.ingresosTotal),
        AverageTicket: toNumber(item.ticketPromedio),
      }));

      const workbook = XLSX.utils.book_new();

      const sheets = [
        buildWorkbookSheet(resumenRows, "Resumen ejecutivo"),
        buildWorkbookSheet(categoryRows, "Ingresos por categoria"),
        buildWorkbookSheet(monthlyRows, "Evolucion mensual"),
        buildWorkbookSheet(transactionRows, "Transacciones"),
      ];

      for (const { worksheet, sheetName } of sheets) {
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      XLSX.writeFile(
        workbook,
        `reporte-financiero-fixnow-${generatedAt.toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (error) {
      console.error("Error exportando reporte financiero:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Download className="size-4" />
      )}
      {loading ? "Exportando..." : "Descargar Reporte Financiero"}
    </Button>
  );
}
