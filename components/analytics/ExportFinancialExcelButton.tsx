"use client"

import * as XLSX from "xlsx-js-style"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type Trabajo = Record<string, any>
type Metrica = Record<string, any>

const COLORS = {
  dark: "1F2937",
  orange: "D98A6A",
  green: "7BA58D",
  blue: "7DB3E8",
  gold: "D8B47A",
  red: "DC2626",
  lightGray: "F3F4F6",
  white: "FFFFFF",
}

function toNumber(value: unknown): number {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getArray(data: any, key: string) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.[key])) return data[key]
  return []
}

function getCategoria(trabajo: Trabajo): string {
  return (
    trabajo.categoria ||
    trabajo.category ||
    trabajo.serviceType ||
    trabajo.service_type ||
    "Sin categoría"
  )
}

function getEstado(trabajo: Trabajo): string {
  return String(trabajo.estado || trabajo.status || "").toUpperCase()
}

function getMonto(trabajo: Trabajo): number {
  return toNumber(trabajo.monto || trabajo.amount || trabajo.total)
}

function getComision(trabajo: Trabajo): number {
  const comision = toNumber(
    trabajo.comisionFixNow ||
      trabajo.commissionFixNow ||
      trabajo.comision ||
      trabajo.commission
  )

  if (comision > 0) return comision

  return getMonto(trabajo) * 0.15
}

function getFecha(trabajo: Trabajo): string {
  return (
    trabajo.completedAt ||
    trabajo.completed_at ||
    trabajo.createdAt ||
    trabajo.created_at ||
    trabajo.fecha ||
    "-"
  )
}

function getPaymentStatus(trabajo: Trabajo) {
  const directStatus = String(
    trabajo.paymentStatus ||
      trabajo.estadoPago ||
      trabajo.statusPago ||
      trabajo.payment_status ||
      trabajo.payment?.status ||
      ""
  ).toLowerCase()

  if (
    directStatus === "paid" ||
    directStatus === "pagado" ||
    directStatus === "acreditado"
  ) {
    return "Pagados"
  }

  if (
    directStatus === "processing" ||
    directStatus === "procesando" ||
    directStatus === "en_proceso" ||
    directStatus === "en proceso"
  ) {
    return "En proceso"
  }

  if (
    directStatus === "failed" ||
    directStatus === "fallido" ||
    directStatus === "rechazado"
  ) {
    return "Fallidos"
  }

  if (directStatus === "pending" || directStatus === "pendiente") {
    return "Pendientes"
  }

  const estadoTrabajo = getEstado(trabajo)

  if (
    estadoTrabajo === "COMPLETADO" ||
    estadoTrabajo === "COMPLETED" ||
    estadoTrabajo === "PAID" ||
    estadoTrabajo === "PAGADO"
  ) {
    return "Pagados"
  }

  if (
    estadoTrabajo === "EN_PROCESO" ||
    estadoTrabajo === "PROCESSING" ||
    estadoTrabajo === "PROCESANDO"
  ) {
    return "En proceso"
  }

  if (
    estadoTrabajo === "CANCELADO" ||
    estadoTrabajo === "CANCELLED" ||
    estadoTrabajo === "FAILED" ||
    estadoTrabajo === "FALLIDO"
  ) {
    return "Fallidos"
  }

  return "Pendientes"
}

function currencyStyle() {
  return {
    numFmt: '"$"#,##0',
  }
}

function percentStyle() {
  return {
    numFmt: "0.00%",
  }
}

function titleStyle() {
  return {
    font: {
      bold: true,
      sz: 18,
      color: { rgb: COLORS.white },
    },
    fill: {
      fgColor: { rgb: COLORS.dark },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
  }
}

function subtitleStyle() {
  return {
    font: {
      bold: true,
      sz: 12,
      color: { rgb: COLORS.dark },
    },
    fill: {
      fgColor: { rgb: COLORS.lightGray },
    },
  }
}

function headerStyle(color = COLORS.orange) {
  return {
    font: {
      bold: true,
      color: { rgb: COLORS.white },
    },
    fill: {
      fgColor: { rgb: color },
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
    },
    border: {
      top: { style: "thin", color: { rgb: "D1D5DB" } },
      bottom: { style: "thin", color: { rgb: "D1D5DB" } },
      left: { style: "thin", color: { rgb: "D1D5DB" } },
      right: { style: "thin", color: { rgb: "D1D5DB" } },
    },
  }
}

function normalBorderStyle() {
  return {
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } },
    },
  }
}

function applyHeaderStyle(sheet: XLSX.WorkSheet, rowNumber: number, color?: string) {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1")

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: rowNumber - 1, c: col })

    if (sheet[cellAddress]) {
      sheet[cellAddress].s = headerStyle(color)
    }
  }
}

function applyTableBorders(sheet: XLSX.WorkSheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1")

  for (let row = range.s.r; row <= range.e.r; row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })

      if (sheet[cellAddress]) {
        sheet[cellAddress].s = {
          ...sheet[cellAddress].s,
          ...normalBorderStyle(),
        }
      }
    }
  }
}

function setColumnWidths(sheet: XLSX.WorkSheet, widths: number[]) {
  sheet["!cols"] = widths.map((wch) => ({ wch }))
}

function createSheetFromJson(
  rows: Record<string, string | number>[],
  headerColor = COLORS.orange
) {
  const sheet = XLSX.utils.json_to_sheet(rows)

  applyHeaderStyle(sheet, 1, headerColor)
  applyTableBorders(sheet)

  return sheet
}

function addTitleToSheet(
  sheet: XLSX.WorkSheet,
  title: string,
  subtitle: string,
  totalColumns: number
) {
  XLSX.utils.sheet_add_aoa(
    sheet,
    [
      [title],
      [subtitle],
      [],
    ],
    { origin: "A1" }
  )

  sheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: totalColumns - 1 },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: totalColumns - 1 },
    },
  ]

  sheet["A1"].s = titleStyle()
  sheet["A2"].s = subtitleStyle()

  sheet["!rows"] = [{ hpt: 28 }, { hpt: 22 }]
}

function createExecutiveSummarySheet(data: {
  ingresosBrutos: number
  comisionFixNow: number
  pagoProfesionales: number
  pedidosCompletados: number
  montoPromedioPorPedido: number
  porcentajeComision: number
  fechaGeneracion: string
}) {
  const rows = [
    ["FixNow — Reporte Financiero"],
    ["Payments App · Resumen ejecutivo generado desde Analytics"],
    [],
    ["Indicador", "Valor", "Descripción"],
    [
      "Volumen total de transacciones",
      data.ingresosBrutos,
      "Monto total abonado por clientes",
    ],
    [
      "Ingresos FixNow",
      data.comisionFixNow,
      "Comisión neta estimada de la plataforma",
    ],
    [
      "Pago a profesionales",
      data.pagoProfesionales,
      "Ingresos brutos menos comisión FixNow",
    ],
    [
      "Pedidos completados",
      data.pedidosCompletados,
      "Cantidad de trabajos considerados",
    ],
    [
      "Monto promedio por pedido",
      data.montoPromedioPorPedido,
      "Promedio abonado por cada trabajo completado",
    ],
    [
      "Porcentaje de comisión",
      data.porcentajeComision,
      "Relación entre comisión FixNow e ingresos brutos",
    ],
    ["Fecha de generación", data.fechaGeneracion, "Fecha del reporte"],
  ]

  const sheet = XLSX.utils.aoa_to_sheet(rows)

  sheet["!merges"] = [
    {
      s: { r: 0, c: 0 },
      e: { r: 0, c: 2 },
    },
    {
      s: { r: 1, c: 0 },
      e: { r: 1, c: 2 },
    },
  ]

  sheet["A1"].s = titleStyle()
  sheet["A2"].s = subtitleStyle()

  applyHeaderStyle(sheet, 4, COLORS.orange)
  applyTableBorders(sheet)

  const moneyRows = [5, 6, 7, 9]
  for (const row of moneyRows) {
    const cell = `B${row}`
    if (sheet[cell]) sheet[cell].s = { ...sheet[cell].s, ...currencyStyle() }
  }

  if (sheet["B10"]) {
    sheet["B10"].s = { ...sheet["B10"].s, ...percentStyle() }
  }

  setColumnWidths(sheet, [34, 22, 52])

  sheet["!rows"] = [{ hpt: 30 }, { hpt: 24 }]

  return sheet
}

export function ExportFinancialExcelButton() {
  async function handleExport() {
    const generatedAt = new Date()

    const [kpisRes, trabajosRes, metricasRes] = await Promise.all([
      fetch("/api/kpis"),
      fetch("/api/trabajos"),
      fetch("/api/metricas"),
    ])

    const kpis = await kpisRes.json()
    const trabajosData = await trabajosRes.json()
    const metricasData = await metricasRes.json()

    const trabajos: Trabajo[] = getArray(trabajosData, "trabajos")
    const metricas: Metrica[] = getArray(metricasData, "metricas")

    const trabajosCompletados = trabajos.filter((trabajo) => {
      const estado = getEstado(trabajo)

      return (
        estado === "COMPLETADO" ||
        estado === "COMPLETED" ||
        estado === "PAID" ||
        estado === "PAGADO"
      )
    })

    const ingresosBrutos =
      toNumber(kpis.volumenTransacciones) ||
      trabajosCompletados.reduce(
        (total, trabajo) => total + getMonto(trabajo),
        0
      )

    const comisionFixNow =
      toNumber(kpis.ingresosNetos) ||
      trabajosCompletados.reduce(
        (total, trabajo) => total + getComision(trabajo),
        0
      )

    const pagoProfesionales = ingresosBrutos - comisionFixNow

    const pedidosCompletados =
      toNumber(kpis.pedidosCompletados) || trabajosCompletados.length

    const montoPromedioPorPedido =
      pedidosCompletados > 0 ? ingresosBrutos / pedidosCompletados : 0

    const porcentajeComision =
      ingresosBrutos > 0 ? comisionFixNow / ingresosBrutos : 0

    const fechaGeneracion = generatedAt.toLocaleString("es-AR")

    const categorias = ["Plomería", "Gas", "Electricidad"]

    const ingresosPorCategoria = categorias.map((categoria) => {
      const trabajosCategoria = trabajosCompletados.filter(
        (trabajo) => getCategoria(trabajo) === categoria
      )

      const brutoCategoria = trabajosCategoria.reduce(
        (total, trabajo) => total + getMonto(trabajo),
        0
      )

      const comisionCategoria = trabajosCategoria.reduce(
        (total, trabajo) => total + getComision(trabajo),
        0
      )

      return {
        Categoría: categoria,
        "Trabajos completados": trabajosCategoria.length,
        "Ingresos brutos": brutoCategoria,
        "Comisión FixNow": comisionCategoria,
        "Pago a profesionales": brutoCategoria - comisionCategoria,
        "Monto promedio por pedido":
          trabajosCategoria.length > 0
            ? brutoCategoria / trabajosCategoria.length
            : 0,
        "Porcentaje del total":
          ingresosBrutos > 0 ? brutoCategoria / ingresosBrutos : 0,
      }
    })

    const estadosBase = ["Pagados", "Pendientes", "En proceso", "Fallidos"]

    const estadosPago = estadosBase.map((estado) => {
      const cantidad = trabajos.filter(
        (trabajo) => getPaymentStatus(trabajo) === estado
      ).length

      const porcentaje = trabajos.length > 0 ? cantidad / trabajos.length : 0

      const observacion =
        estado === "Pagados"
          ? "Operaciones acreditadas"
          : estado === "Pendientes"
            ? "Operaciones esperando confirmación"
            : estado === "En proceso"
              ? "Operaciones en procesamiento"
              : "Operaciones que requieren revisión"

      return {
        Estado: estado,
        Cantidad: cantidad,
        Porcentaje: porcentaje,
        Observación: observacion,
      }
    })

    const evolucionMensual = metricas.map((metrica) => ({
      Mes: `${metrica.mes}/${metrica.anio}`,
      Categoría: metrica.categoria || "General",
      "Trabajos completados": toNumber(metrica.trabajosCompletados),
      "Trabajos cancelados": toNumber(metrica.trabajosCancelados),
      "Clientes nuevos": toNumber(metrica.clientesNuevos),
      "Ingresos brutos": toNumber(metrica.ingresosTotal),
      "Monto promedio por pedido": toNumber(metrica.ticketPromedio),
    }))

    const detalleTransacciones = trabajosCompletados.map((trabajo) => {
      const monto = getMonto(trabajo)
      const comision = getComision(trabajo)

      return {
        "ID trabajo": trabajo.id || trabajo.jobId || trabajo.job_id || "-",
        Fecha: getFecha(trabajo),
        Categoría: getCategoria(trabajo),
        Estado: getEstado(trabajo) || "-",
        "Monto total": monto,
        "Comisión FixNow": comision,
        "Monto profesional": monto - comision,
        "Cliente ID": trabajo.clienteId || trabajo.clientId || trabajo.client_id || "-",
        "Profesional ID":
          trabajo.profesionalId ||
          trabajo.professionalId ||
          trabajo.professional_id ||
          "-",
      }
    })

    const datosParaGraficos = [
      {
        Gráfico: "Ingresos por categoría",
        Categoría: "Plomería",
        Valor:
          ingresosPorCategoria.find((item) => item.Categoría === "Plomería")?.[
            "Ingresos brutos"
          ] || 0,
      },
      {
        Gráfico: "Ingresos por categoría",
        Categoría: "Gas",
        Valor:
          ingresosPorCategoria.find((item) => item.Categoría === "Gas")?.[
            "Ingresos brutos"
          ] || 0,
      },
      {
        Gráfico: "Ingresos por categoría",
        Categoría: "Electricidad",
        Valor:
          ingresosPorCategoria.find(
            (item) => item.Categoría === "Electricidad"
          )?.["Ingresos brutos"] || 0,
      },
      ...estadosPago.map((estado) => ({
        Gráfico: "Estados de pago",
        Categoría: estado.Estado,
        Valor: estado.Cantidad,
      })),
    ]

    const indicadoresFinancieros = [
      {
        Métrica: "Volumen total de transacciones",
        Valor: ingresosBrutos,
        Observación: "Monto total abonado por clientes",
      },
      {
        Métrica: "Ingresos brutos",
        Valor: ingresosBrutos,
        Observación: "Monto total de operaciones completadas",
      },
      {
        Métrica: "Comisión neta FixNow",
        Valor: comisionFixNow,
        Observación: "Ingreso estimado de la plataforma",
      },
      {
        Métrica: "Monto destinado a profesionales",
        Valor: pagoProfesionales,
        Observación: "Ingresos brutos menos comisión",
      },
      {
        Métrica: "Trabajos completados",
        Valor: pedidosCompletados,
        Observación: "Cantidad de trabajos finalizados",
      },
      {
        Métrica: "Monto promedio por pedido",
        Valor: montoPromedioPorPedido,
        Observación: "Promedio abonado por trabajo",
      },
      {
        Métrica: "Porcentaje de comisión",
        Valor: porcentajeComision,
        Observación: "Relación entre comisión e ingresos brutos",
      },
      {
        Métrica: "Fecha de generación",
        Valor: fechaGeneracion,
        Observación: "Reporte generado desde Analytics App",
      },
    ]

    const workbook = XLSX.utils.book_new()

    const resumenEjecutivoSheet = createExecutiveSummarySheet({
      ingresosBrutos,
      comisionFixNow,
      pagoProfesionales,
      pedidosCompletados,
      montoPromedioPorPedido,
      porcentajeComision,
      fechaGeneracion,
    })

    const indicadoresSheet = createSheetFromJson(
      indicadoresFinancieros,
      COLORS.orange
    )

    const categoriaSheet = createSheetFromJson(
      ingresosPorCategoria,
      COLORS.green
    )

    const estadosSheet = createSheetFromJson(estadosPago, COLORS.blue)

    const mensualSheet = createSheetFromJson(evolucionMensual, COLORS.gold)

    const detalleSheet = createSheetFromJson(
      detalleTransacciones,
      COLORS.dark
    )

    const graficosSheet = createSheetFromJson(datosParaGraficos, COLORS.orange)

    setColumnWidths(indicadoresSheet, [34, 22, 52])
    setColumnWidths(categoriaSheet, [22, 24, 20, 20, 24, 28, 22])
    setColumnWidths(estadosSheet, [18, 14, 16, 36])
    setColumnWidths(mensualSheet, [16, 18, 24, 24, 20, 20, 28])
    setColumnWidths(detalleSheet, [30, 24, 18, 16, 18, 18, 22, 32, 32])
    setColumnWidths(graficosSheet, [28, 22, 18])

    for (const sheet of [
      categoriaSheet,
      mensualSheet,
      detalleSheet,
      indicadoresSheet,
    ]) {
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1")

      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col })
          const cell = sheet[cellAddress]

          if (!cell) continue

          const headerAddress = XLSX.utils.encode_cell({ r: 0, c: col })
          const header = String(sheet[headerAddress]?.v || "").toLowerCase()

          if (
            header.includes("monto") ||
            header.includes("ingresos") ||
            header.includes("comisión") ||
            header.includes("pago") ||
            header.includes("valor")
          ) {
            cell.s = {
              ...cell.s,
              ...currencyStyle(),
            }
          }

          if (header.includes("porcentaje")) {
            cell.s = {
              ...cell.s,
              ...percentStyle(),
            }
          }
        }
      }
    }

    for (const sheet of [estadosSheet]) {
      const range = XLSX.utils.decode_range(sheet["!ref"] || "A1:A1")

      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: 2 })
        const cell = sheet[cellAddress]

        if (cell) {
          cell.s = {
            ...cell.s,
            ...percentStyle(),
          }
        }
      }
    }

    addTitleToSheet(
      indicadoresSheet,
      "Indicadores Financieros",
      "Métricas principales de ingresos, comisiones y pagos",
      3
    )

    addTitleToSheet(
      categoriaSheet,
      "Ingresos por Categoría",
      "Distribución de ingresos por tipo de servicio",
      7
    )

    addTitleToSheet(
      estadosSheet,
      "Estados de Pago",
      "Seguimiento de operaciones pagadas, pendientes, en proceso y fallidas",
      4
    )

    addTitleToSheet(
      mensualSheet,
      "Evolución Mensual",
      "Comportamiento mensual de trabajos, clientes e ingresos",
      7
    )

    addTitleToSheet(
      detalleSheet,
      "Detalle de Transacciones",
      "Listado administrativo de trabajos completados y pagos asociados",
      9
    )

    addTitleToSheet(
      graficosSheet,
      "Datos para Gráficos",
      "Tablas preparadas para generar gráficos en Excel",
      3
    )

    XLSX.utils.book_append_sheet(
      workbook,
      resumenEjecutivoSheet,
      "Resumen Ejecutivo"
    )

    XLSX.utils.book_append_sheet(
      workbook,
      indicadoresSheet,
      "Indicadores"
    )

    XLSX.utils.book_append_sheet(
      workbook,
      categoriaSheet,
      "Ingresos Categoria"
    )

    XLSX.utils.book_append_sheet(workbook, estadosSheet, "Estados Pago")

    XLSX.utils.book_append_sheet(
      workbook,
      mensualSheet,
      "Evolucion Mensual"
    )

    XLSX.utils.book_append_sheet(workbook, detalleSheet, "Transacciones")

    XLSX.utils.book_append_sheet(
      workbook,
      graficosSheet,
      "Datos Graficos"
    )

    XLSX.writeFile(
      workbook,
      `reporte-financiero-fixnow-${generatedAt
        .toISOString()
        .slice(0, 10)}.xlsx`
    )
  }

  return (
    <Button onClick={handleExport} variant="outline" className="gap-2">
      <Download className="h-4 w-4" />
      Descargar Reporte Financiero
    </Button>
  )
}