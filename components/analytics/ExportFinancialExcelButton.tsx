"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import Chart from "chart.js/auto";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Trabajo = Record<string, any>;
type Metrica = Record<string, any>;

// ---------------------------------------------------------------------------
// Paleta (ARGB, formato que usa ExcelJS)
// ---------------------------------------------------------------------------
const PALETTE = {
  dark: "FF1F2937",
  orange: "FFD98A6A",
  green: "FF7BA58D",
  blue: "FF7DB3E8",
  gold: "FFD8B47A",
  red: "FFDC2626",
  lightGray: "FFF3F4F6",
  border: "FFE5E7EB",
  white: "FFFFFFFF",
  textDark: "FF111827",
};

// ---------------------------------------------------------------------------
// Helpers de extracción de datos (misma lógica que ya tenías)
// ---------------------------------------------------------------------------
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

function getPaymentStatus(trabajo: Trabajo): "Pagados" | "Pendientes" | "En proceso" | "Fallidos" {
  const directStatus = String(
    trabajo.paymentStatus ||
      trabajo.estadoPago ||
      trabajo.statusPago ||
      trabajo.payment_status ||
      trabajo.payment?.status ||
      "",
  ).toLowerCase();

  if (["paid", "pagado", "acreditado"].includes(directStatus)) return "Pagados";
  if (["processing", "procesando", "en_proceso", "en proceso"].includes(directStatus))
    return "En proceso";
  if (["failed", "fallido", "rechazado"].includes(directStatus)) return "Fallidos";
  if (["pending", "pendiente"].includes(directStatus)) return "Pendientes";

  const estado = getEstado(trabajo);
  if (["COMPLETADO", "COMPLETED", "PAID", "PAGADO"].includes(estado)) return "Pagados";
  if (["EN_PROCESO", "PROCESSING", "PROCESANDO"].includes(estado)) return "En proceso";
  if (["CANCELADO", "CANCELLED", "FAILED", "FALLIDO"].includes(estado)) return "Fallidos";
  return "Pendientes";
}

const ESTADO_FILL: Record<string, string> = {
  Pagados: PALETTE.green,
  "En proceso": PALETTE.blue,
  Pendientes: PALETTE.gold,
  Fallidos: PALETTE.red,
};

// ---------------------------------------------------------------------------
// Render de gráficos a imagen (Chart.js sobre un canvas offscreen)
// ---------------------------------------------------------------------------
async function renderChartPNG(
  config: any,
  width = 520,
  height = 300,
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  const chart = new Chart(ctx, {
    ...config,
    options: {
      ...config.options,
      responsive: false,
      animation: false,
      devicePixelRatio: 2,
    },
  });

  // Dar un tick para asegurar que terminó de pintar antes de leer el canvas
  await new Promise((resolve) => setTimeout(resolve, 60));
  const base64 = canvas.toDataURL("image/png").split(",")[1];
  chart.destroy();
  return base64;
}

// ---------------------------------------------------------------------------
// Helpers de estilo ExcelJS
// ---------------------------------------------------------------------------
function thinBorder(color = PALETTE.border) {
  const side = { style: "thin" as const, color: { argb: color } };
  return { top: side, bottom: side, left: side, right: side };
}

function styleHeaderRow(row: ExcelJS.Row, color = PALETTE.orange) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: PALETTE.white }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = thinBorder();
  });
  row.height = 20;
}

function addTitleBlock(
  sheet: ExcelJS.Worksheet,
  title: string,
  subtitle: string,
  totalCols: number,
) {
  sheet.mergeCells(1, 1, 1, totalCols);
  sheet.mergeCells(2, 1, 2, totalCols);

  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: PALETTE.white } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.dark } };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };

  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { bold: true, size: 11, color: { argb: PALETTE.textDark } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.lightGray } };
  subtitleCell.alignment = { horizontal: "center", vertical: "middle" };

  sheet.getRow(1).height = 30;
  sheet.getRow(2).height = 22;
}

/** Dibuja una tarjeta KPI ocupando un rango de 3 columnas x 3 filas */
function drawKpiCard(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  label: string,
  value: string | number,
  format: "currency" | "percent" | "number" | "text",
  accentColor: string,
) {
  const endRow = startRow + 2;
  const endCol = startCol + 2;

  sheet.mergeCells(startRow, startCol, startRow, endCol);
  sheet.mergeCells(startRow + 1, startCol, startRow + 1, endCol);

  const labelCell = sheet.getCell(startRow, startCol);
  labelCell.value = label.toUpperCase();
  labelCell.font = { bold: true, size: 9, color: { argb: PALETTE.white } };
  labelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: accentColor } };
  labelCell.alignment = { horizontal: "center", vertical: "middle" };

  const valueCell = sheet.getCell(startRow + 1, startCol);
  valueCell.value = value;
  valueCell.font = { bold: true, size: 16, color: { argb: PALETTE.textDark } };
  valueCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PALETTE.white } };
  valueCell.alignment = { horizontal: "center", vertical: "middle" };

  if (format === "currency") valueCell.numFmt = '"$"#,##0';
  if (format === "percent") valueCell.numFmt = "0.0%";
  if (format === "number") valueCell.numFmt = "#,##0";

  for (let r = startRow; r <= startRow + 1; r++) {
    for (let c = startCol; c <= endCol; c++) {
      sheet.getCell(r, c).border = thinBorder(accentColor);
    }
  }
}

// ---------------------------------------------------------------------------
// Componente
// ---------------------------------------------------------------------------
export function ExportFinancialExcelButton() {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const generatedAt = new Date();
      const fechaGeneracion = generatedAt.toLocaleString("es-AR");

      const [kpisRes, trabajosRes, metricasRes] = await Promise.all([
        fetch("/api/kpis"),
        fetch("/api/trabajos"),
        fetch("/api/metricas"),
      ]);

      const kpis = await kpisRes.json();
      const trabajosData = await trabajosRes.json();
      const metricasData = await metricasRes.json();

      const trabajos: Trabajo[] = getArray(trabajosData, "trabajos");
      const metricas: Metrica[] = getArray(metricasData, "metricas");

      const trabajosCompletados = trabajos.filter((t) =>
        ["COMPLETADO", "COMPLETED", "PAID", "PAGADO"].includes(getEstado(t)),
      );

      // ---- KPIs principales ----
      const ingresosBrutos =
        toNumber(kpis.volumenTransacciones) ||
        trabajosCompletados.reduce((acc, t) => acc + getMonto(t), 0);

      const comisionFixNow =
        toNumber(kpis.ingresosNetos) ||
        trabajosCompletados.reduce((acc, t) => acc + getComision(t), 0);

      const pagoProfesionales = ingresosBrutos - comisionFixNow;
      const pedidosCompletados = toNumber(kpis.pedidosCompletados) || trabajosCompletados.length;
      const montoPromedioPorPedido = pedidosCompletados > 0 ? ingresosBrutos / pedidosCompletados : 0;
      const porcentajeComision = ingresosBrutos > 0 ? comisionFixNow / ingresosBrutos : 0;

      // ---- Ingresos por categoría (dinámico, top 6) ----
      const categoriasUnicas = Array.from(
        new Set(trabajosCompletados.map((t) => getCategoria(t))),
      );

      const ingresosPorCategoria = categoriasUnicas
        .map((categoria) => {
          const trabajosCategoria = trabajosCompletados.filter(
            (t) => getCategoria(t) === categoria,
          );
          const bruto = trabajosCategoria.reduce((acc, t) => acc + getMonto(t), 0);
          const comision = trabajosCategoria.reduce((acc, t) => acc + getComision(t), 0);

          return {
            categoria,
            trabajos: trabajosCategoria.length,
            bruto,
            comision,
            profesionales: bruto - comision,
            promedio: trabajosCategoria.length > 0 ? bruto / trabajosCategoria.length : 0,
            participacion: ingresosBrutos > 0 ? bruto / ingresosBrutos : 0,
          };
        })
        .sort((a, b) => b.bruto - a.bruto)
        .slice(0, 6);

      // ---- Estados de pago ----
      const estadosBase = ["Pagados", "En proceso", "Pendientes", "Fallidos"] as const;
      const estadosPago = estadosBase.map((estado) => {
        const cantidad = trabajos.filter((t) => getPaymentStatus(t) === estado).length;
        const porcentaje = trabajos.length > 0 ? cantidad / trabajos.length : 0;
        const observacion =
          estado === "Pagados"
            ? "Operaciones acreditadas"
            : estado === "En proceso"
              ? "Operaciones en procesamiento"
              : estado === "Pendientes"
                ? "Operaciones esperando confirmación"
                : "Operaciones que requieren revisión";
        return { estado, cantidad, porcentaje, observacion };
      });

      // ---- Evolución mensual ----
      const evolucionMensual = metricas.map((m) => ({
        periodo: `${m.mes}/${m.anio}`,
        categoria: m.categoria || "General",
        completados: toNumber(m.trabajosCompletados),
        cancelados: toNumber(m.trabajosCancelados),
        clientesNuevos: toNumber(m.clientesNuevos),
        ingresos: toNumber(m.ingresosTotal),
        ticketPromedio: toNumber(m.ticketPromedio),
      }));

      // ---- Detalle de transacciones ----
      const detalleTransacciones = trabajos.map((t) => {
        const monto = getMonto(t);
        const comision = getComision(t);
        const estadoPago = getPaymentStatus(t);
        const esPagado = estadoPago === "Pagados";

        return {
          id: t.id || t.jobId || t.job_id || "-",
          fecha: t.requested_date || t.fechaCreacion || "-",
          categoria: getCategoria(t),
          urgencia: t.urgency || t.urgencia || "SCHEDULED",
          estadoOperativo: getEstado(t) || "-",
          estadoPago,
          monto,
          comisionReal: esPagado ? comision : 0,
          profesionalReal: esPagado ? monto - comision : 0,
          clienteId: t.clienteId || t.clientId || t.client_id || "-",
          profesionalId: t.profesionalId || t.professionalId || t.professional_id || "-",
          motivoCancelacion: t.cancellation_reason || t.motivoCancelacion || "N/A",
        };
      });

      // -----------------------------------------------------------------
      // Gráficos (Chart.js -> PNG)
      // -----------------------------------------------------------------
      const chartColors = [PALETTE.orange, PALETTE.green, PALETTE.blue, PALETTE.gold, "FF9CA3AF", "FF6B7280"];
      const hex = (argb: string) => `#${argb.slice(2)}`;

      const categoriaChartPNG = await renderChartPNG({
        type: "bar",
        data: {
          labels: ingresosPorCategoria.map((c) => c.categoria),
          datasets: [
            {
              label: "Ingresos brutos",
              data: ingresosPorCategoria.map((c) => c.bruto),
              backgroundColor: ingresosPorCategoria.map((_, i) => hex(chartColors[i % chartColors.length])),
              borderRadius: 4,
            },
          ],
        },
        options: {
          plugins: { legend: { display: false }, title: { display: true, text: "Ingresos por categoría" } },
          scales: { y: { ticks: { callback: (v: any) => `$${Number(v).toLocaleString("es-AR")}` } } },
        },
      });

      const estadosChartPNG = await renderChartPNG({
        type: "doughnut",
        data: {
          labels: estadosPago.map((e) => e.estado),
          datasets: [
            {
              data: estadosPago.map((e) => e.cantidad),
              backgroundColor: estadosPago.map((e) => hex(ESTADO_FILL[e.estado])),
            },
          ],
        },
        options: {
          plugins: { legend: { position: "bottom" }, title: { display: true, text: "Distribución de estados de pago" } },
        },
      });

      const evolucionChartPNG = await renderChartPNG(
        {
          type: "line",
          data: {
            labels: evolucionMensual.map((m) => m.periodo),
            datasets: [
              {
                label: "Ingresos",
                data: evolucionMensual.map((m) => m.ingresos),
                borderColor: hex(PALETTE.orange),
                backgroundColor: hex(PALETTE.orange) + "33",
                fill: true,
                tension: 0.3,
              },
            ],
          },
          options: {
            plugins: { legend: { display: false }, title: { display: true, text: "Evolución mensual de ingresos" } },
            scales: { y: { ticks: { callback: (v: any) => `$${Number(v).toLocaleString("es-AR")}` } } },
          },
        },
        1080,
        300,
      );

      // -----------------------------------------------------------------
      // Workbook
      // -----------------------------------------------------------------
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "FixNow Analytics";
      workbook.created = generatedAt;

      // ================= Hoja 1: Resumen Ejecutivo =================
      const resumen = workbook.addWorksheet("Resumen Ejecutivo", {
        views: [{ showGridLines: false }],
      });
      for (let i = 1; i <= 9; i++) resumen.getColumn(i).width = 14;

      addTitleBlock(
        resumen,
        "FixNow — Reporte Financiero",
        `Payments App · Resumen ejecutivo generado desde Analytics · ${fechaGeneracion}`,
        9,
      );

      drawKpiCard(resumen, 4, 1, "Volumen total", ingresosBrutos, "currency", PALETTE.dark);
      drawKpiCard(resumen, 4, 4, "Comisión FixNow", comisionFixNow, "currency", PALETTE.orange);
      drawKpiCard(resumen, 4, 7, "Pago a profesionales", pagoProfesionales, "currency", PALETTE.green);
      drawKpiCard(resumen, 7, 1, "Pedidos completados", pedidosCompletados, "number", PALETTE.blue);
      drawKpiCard(resumen, 7, 4, "Ticket promedio", montoPromedioPorPedido, "currency", PALETTE.gold);
      drawKpiCard(resumen, 7, 7, "% comisión / ingresos", porcentajeComision, "percent", PALETTE.dark);

      resumen.getRow(10).height = 10;

      const estadosImg = workbook.addImage({ base64: estadosChartPNG, extension: "png" });
      resumen.addImage(estadosImg, { tl: { col: 0, row: 10 }, ext: { width: 380, height: 220 } });

      const categoriaImg = workbook.addImage({ base64: categoriaChartPNG, extension: "png" });
      resumen.addImage(categoriaImg, { tl: { col: 4.3, row: 10 }, ext: { width: 380, height: 220 } });

      const evolucionImg = workbook.addImage({ base64: evolucionChartPNG, extension: "png" });
      resumen.addImage(evolucionImg, { tl: { col: 0, row: 26 }, ext: { width: 790, height: 220 } });

      resumen.getCell(43, 1).value =
        "Nota: los montos provienen de Payments App. El detalle completo de transacciones está en la hoja 'Transacciones'.";
      resumen.getCell(43, 1).font = { italic: true, size: 9, color: { argb: "FF6B7280" } };
      resumen.mergeCells(43, 1, 43, 9);

      // ================= Hoja 2: Ingresos por Categoría =================
      const catSheet = workbook.addWorksheet("Ingresos por Categoría");
      catSheet.columns = [
        { header: "Categoría", key: "categoria", width: 24 },
        { header: "Trabajos completados", key: "trabajos", width: 20 },
        { header: "Ingresos brutos", key: "bruto", width: 18 },
        { header: "Comisión FixNow", key: "comision", width: 18 },
        { header: "Pago a profesionales", key: "profesionales", width: 20 },
        { header: "Ticket promedio", key: "promedio", width: 18 },
        { header: "% del total", key: "participacion", width: 14 },
      ];
      styleHeaderRow(catSheet.getRow(1), PALETTE.green);
      ingresosPorCategoria.forEach((c) => catSheet.addRow(c));
      catSheet.getColumn("bruto").numFmt = '"$"#,##0';
      catSheet.getColumn("comision").numFmt = '"$"#,##0';
      catSheet.getColumn("profesionales").numFmt = '"$"#,##0';
      catSheet.getColumn("promedio").numFmt = '"$"#,##0';
      catSheet.getColumn("participacion").numFmt = "0.0%";
      catSheet.views = [{ state: "frozen", ySplit: 1 }];
      catSheet.autoFilter = { from: "A1", to: "G1" };

      // ================= Hoja 3: Estados de Pago =================
      const estadosSheet = workbook.addWorksheet("Estados de Pago");
      estadosSheet.columns = [
        { header: "Estado", key: "estado", width: 18 },
        { header: "Cantidad", key: "cantidad", width: 14 },
        { header: "% del total", key: "porcentaje", width: 14 },
        { header: "Observación", key: "observacion", width: 38 },
      ];
      styleHeaderRow(estadosSheet.getRow(1), PALETTE.blue);
      estadosPago.forEach((e) => {
        const row = estadosSheet.addRow(e);
        row.getCell(1).fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: ESTADO_FILL[e.estado] },
        };
        row.getCell(1).font = { bold: true, color: { argb: PALETTE.white } };
      });
      estadosSheet.getColumn("porcentaje").numFmt = "0.0%";

      // ================= Hoja 4: Evolución Mensual =================
      const mensualSheet = workbook.addWorksheet("Evolución Mensual");
      mensualSheet.columns = [
        { header: "Período", key: "periodo", width: 14 },
        { header: "Categoría", key: "categoria", width: 18 },
        { header: "Completados", key: "completados", width: 16 },
        { header: "Cancelados", key: "cancelados", width: 14 },
        { header: "Clientes nuevos", key: "clientesNuevos", width: 16 },
        { header: "Ingresos", key: "ingresos", width: 18 },
        { header: "Ticket promedio", key: "ticketPromedio", width: 18 },
      ];
      styleHeaderRow(mensualSheet.getRow(1), PALETTE.gold);
      evolucionMensual.forEach((m) => mensualSheet.addRow(m));
      mensualSheet.getColumn("ingresos").numFmt = '"$"#,##0';
      mensualSheet.getColumn("ticketPromedio").numFmt = '"$"#,##0';
      mensualSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ================= Hoja 5: Transacciones =================
      const detalleSheet = workbook.addWorksheet("Transacciones");
      detalleSheet.columns = [
        { header: "ID Trabajo", key: "id", width: 28 },
        { header: "Fecha", key: "fecha", width: 14 },
        { header: "Categoría", key: "categoria", width: 18 },
        { header: "Urgencia", key: "urgencia", width: 14 },
        { header: "Estado Operativo", key: "estadoOperativo", width: 18 },
        { header: "Estado Pago", key: "estadoPago", width: 14 },
        { header: "Monto cotizado", key: "monto", width: 16 },
        { header: "Comisión FixNow (real)", key: "comisionReal", width: 20 },
        { header: "Pago profesional (real)", key: "profesionalReal", width: 20 },
        { header: "Cliente ID", key: "clienteId", width: 22 },
        { header: "Profesional ID", key: "profesionalId", width: 22 },
        { header: "Motivo cancelación", key: "motivoCancelacion", width: 30 },
      ];
      styleHeaderRow(detalleSheet.getRow(1), PALETTE.dark);
      detalleTransacciones.forEach((t) => {
        const row = detalleSheet.addRow(t);
        const estadoCell = row.getCell(6);
        estadoCell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: ESTADO_FILL[t.estadoPago] },
        };
        estadoCell.font = { bold: true, color: { argb: PALETTE.white } };
        estadoCell.alignment = { horizontal: "center" };
      });
      detalleSheet.getColumn("monto").numFmt = '"$"#,##0';
      detalleSheet.getColumn("comisionReal").numFmt = '"$"#,##0';
      detalleSheet.getColumn("profesionalReal").numFmt = '"$"#,##0';
      detalleSheet.views = [{ state: "frozen", ySplit: 1 }];
      detalleSheet.autoFilter = { from: "A1", to: "L1" };

      // -----------------------------------------------------------------
      // Descarga
      // -----------------------------------------------------------------
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `reporte-financiero-fixnow-${generatedAt.toISOString().slice(0, 10)}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2" disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      {loading ? "Generando reporte..." : "Descargar Reporte Financiero"}
    </Button>
  );
}