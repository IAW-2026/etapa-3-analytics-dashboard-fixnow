// FixNow Analytics - Consolidated data layer
// Simulates consuming the APIs of the 4 individual webapps:
//   - Rider App   (clientes, trabajos por categoría, tasa de éxito)
//   - Driver App  (profesionales)
//   - Payments App (volumen de transacciones, ingresos/comisiones)
//   - Feedback App (calificaciones, ranking de profesionales)
//
// In a real system each function would be an async fetch() to the
// corresponding service. Here we resolve mocked payloads to mirror that shape.

export interface KpiData {
  totalUsers: number
  totalClients: number
  totalProfessionals: number
  transactionVolume: number
  netRevenue: number
  averageTicket: number
  averageTicketTrend: string
  globalRating: number
  totalReviews: number
  completedOrders: number
  activeUsers: number
}

export interface CategoryDatum {
  category: "Plomería" | "Gas" | "Electricidad"
  jobs: number
  fill: string
}

export interface SuccessRateDatum {
  label: string
  completados: number
  cancelados: number
}

export interface TopProfessional {
  id: string
  name: string
  category: "Plomería" | "Gas" | "Electricidad"
  rating: number
  jobs: number
  city: string
}

export interface RevenueTrendDatum {
  month: string
  ingresos: number
  transacciones: number
}
export interface RevenueByCategoryDatum {
  category: "Plomería" | "Gas" | "Electricidad"
  ingresos: number
  comision: number
  fill: string
}
interface SnapshotKpiApi {
  volumenTransacciones: number | string
  ingresosNetos: number | string
  pedidosCompletados: number
}

interface MetricaMensualApi {
  anio: number
  mes: number
  categoria: string | null
  ticketPromedio: number | string
}
type ApiCategoria = "PLOMERIA" | "GAS" | "ELECTRICIDAD"

interface TrabajoResumenApi {
  categoria: ApiCategoria
  estado: "COMPLETADO" | "CANCELADO" | "EN_PROGRESO"
  monto: number | string | null
  comisionFixNow: number | string | null
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  return Number(value)
}
function mapCategory(category: ApiCategoria): "Plomería" | "Gas" | "Electricidad" {
  if (category === "PLOMERIA") return "Plomería"
  if (category === "GAS") return "Gas"
  return "Electricidad"
}
function calculateTrend(current: number, previous: number): string {
  if (!previous) return "+0.0%"

  const value = ((current - previous) / previous) * 100
  const sign = value >= 0 ? "+" : ""

  return `${sign}${value.toFixed(1)}%`
}

function getGlobalMetricas(metricas: MetricaMensualApi[]): MetricaMensualApi[] {
  return [...metricas]
    .filter((metrica) => metrica.categoria === null)
    .sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio
      return a.mes - b.mes
    })
}
// Simulate network latency for a realistic dashboard load
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// --- Rider App API (clientes) -------------------------------------------------
async function getClientsCount(): Promise<number> {
  await delay(120)
  return 4820
}

// --- Driver App API (profesionales) ------------------------------------------
async function getProfessionalsCount(): Promise<number> {
  await delay(140)
  return 612
}

// --- Payments App API --------------------------------------------------------
async function getPaymentsSummary(): Promise<{
  transactionVolume: number
  netRevenue: number
  completedOrders: number
  averageTicket: number
  averageTicketTrend: string
}> {
  try {
    const [snapshotResponse, metricasResponse] = await Promise.all([
      fetch("/api/kpis", { cache: "no-store" }),
      fetch("/api/metricas", { cache: "no-store" }),
    ])

    if (!snapshotResponse.ok || !metricasResponse.ok) {
      throw new Error("No se pudieron obtener los datos consolidados")
    }

    const snapshot = (await snapshotResponse.json()) as SnapshotKpiApi
    const metricas = (await metricasResponse.json()) as MetricaMensualApi[]

    const globalMetricas = getGlobalMetricas(metricas)
    const latestMonth = globalMetricas.at(-1)
    const previousMonth = globalMetricas.at(-2)

    const transactionVolume = toNumber(snapshot.volumenTransacciones)
    const netRevenue = toNumber(snapshot.ingresosNetos)
    const completedOrders = snapshot.pedidosCompletados

    const averageTicket =
      latestMonth && toNumber(latestMonth.ticketPromedio) > 0
        ? toNumber(latestMonth.ticketPromedio)
        : completedOrders > 0
          ? transactionVolume / completedOrders
          : 0

    const previousAverageTicket = previousMonth
      ? toNumber(previousMonth.ticketPromedio)
      : 0

    return {
      transactionVolume,
      netRevenue,
      completedOrders,
      averageTicket,
      averageTicketTrend: calculateTrend(
        averageTicket,
        previousAverageTicket,
      ),
    }
  } catch {
    await delay(160)
    return {
      transactionVolume: 184_350_000,
      netRevenue: 27_652_500,
      completedOrders: 13_984,
      averageTicket: 13_184,
      averageTicketTrend: "+0.0%",
    }
  }
}

// --- Feedback App API --------------------------------------------------------
async function getFeedbackSummary(): Promise<{
  globalRating: number
  totalReviews: number
}> {
  await delay(110)
  return { globalRating: 4.7, totalReviews: 11_240 }
}

// --- Consolidated KPIs (top row) ---------------------------------------------
export async function fetchKpis(): Promise<KpiData> {
  const [clients, professionals, payments, feedback] = await Promise.all([
    getClientsCount(),
    getProfessionalsCount(),
    getPaymentsSummary(),
    getFeedbackSummary(),
  ])

  return {
    totalUsers: clients + professionals,
    totalClients: clients,
    totalProfessionals: professionals,
    transactionVolume: payments.transactionVolume,
    netRevenue: payments.netRevenue,
    globalRating: feedback.globalRating,
    totalReviews: feedback.totalReviews,
    completedOrders: payments.completedOrders,
    averageTicket: payments.averageTicket,
    averageTicketTrend: payments.averageTicketTrend,
    activeUsers: 3210,
  }
}

// --- Rider App Admin endpoint: trabajos por categoría ------------------------
export async function fetchJobsByCategory(): Promise<CategoryDatum[]> {
  await delay(130)
  return [
    { category: "Plomería", jobs: 6240, fill: "var(--color-plumbing)" },
    { category: "Gas", jobs: 3180, fill: "var(--color-gas)" },
    { category: "Electricidad", jobs: 4564, fill: "var(--color-electrical)" },
  ]
}

// --- Rider App: tasa de éxito (completados vs cancelados) --------------------
export async function fetchSuccessRate(): Promise<SuccessRateDatum[]> {
  await delay(150)
  return [
    { label: "Plomería", completados: 5890, cancelados: 350 },
    { label: "Gas", completados: 2940, cancelados: 240 },
    { label: "Electricidad", completados: 4154, cancelados: 410 },
  ]
}

// --- Payments App: tendencia de ingresos -------------------------------------
export async function fetchRevenueTrend(): Promise<RevenueTrendDatum[]> {
  await delay(140)
  return [
    { month: "Jul", ingresos: 18_900_000, transacciones: 1820 },
    { month: "Ago", ingresos: 21_300_000, transacciones: 2040 },
    { month: "Sep", ingresos: 19_800_000, transacciones: 1960 },
    { month: "Oct", ingresos: 24_500_000, transacciones: 2310 },
    { month: "Nov", ingresos: 26_100_000, transacciones: 2480 },
    { month: "Dic", ingresos: 27_652_500, transacciones: 2620 },
  ]
}
export async function fetchRevenueByCategory(): Promise<RevenueByCategoryDatum[]> {
  try {
    const response = await fetch("/api/trabajos", {
      method: "GET",
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("No se pudieron obtener los trabajos")
    }

    const trabajos = (await response.json()) as TrabajoResumenApi[]

    const totals: Record<
      "Plomería" | "Gas" | "Electricidad",
      { ingresos: number; comision: number; fill: string }
    > = {
      Plomería: {
        ingresos: 0,
        comision: 0,
        fill: "var(--plumbing)",
      },
      Gas: {
        ingresos: 0,
        comision: 0,
        fill: "var(--gas)",
      },
      Electricidad: {
        ingresos: 0,
        comision: 0,
        fill: "var(--electrical)",
      },
    }

    trabajos
      .filter((trabajo) => trabajo.estado === "COMPLETADO")
      .forEach((trabajo) => {
        const category = mapCategory(trabajo.categoria)
        const monto = toNumber(trabajo.monto)
        const comision = toNumber(trabajo.comisionFixNow)

        totals[category].ingresos += monto
        totals[category].comision += comision
      })

    return Object.entries(totals).map(([category, values]) => ({
      category: category as "Plomería" | "Gas" | "Electricidad",
      ingresos: values.ingresos,
      comision: values.comision,
      fill: values.fill,
    }))
  } catch {
    await delay(140)

    return [
      {
        category: "Plomería",
        ingresos: 92_400_000,
        comision: 13_860_000,
        fill: "var(--plumbing)",
      },
      {
        category: "Gas",
        ingresos: 41_800_000,
        comision: 6_270_000,
        fill: "var(--gas)",
      },
      {
        category: "Electricidad",
        ingresos: 50_150_000,
        comision: 7_522_500,
        fill: "var(--electrical)",
      },
    ]
  }
}
// --- Feedback / Driver App: top profesionales --------------------------------
export async function fetchTopProfessionals(): Promise<TopProfessional[]> {
  await delay(120)
  return [
    { id: "p1", name: "Rodrigo Salas", category: "Plomería", rating: 4.98, jobs: 342, city: "Santiago" },
    { id: "p2", name: "Valentina Rojas", category: "Electricidad", rating: 4.96, jobs: 318, city: "Providencia" },
    { id: "p3", name: "Matías Fuentes", category: "Gas", rating: 4.94, jobs: 287, city: "Las Condes" },
    { id: "p4", name: "Camila Herrera", category: "Plomería", rating: 4.92, jobs: 301, city: "Ñuñoa" },
    { id: "p5", name: "Diego Morales", category: "Electricidad", rating: 4.9, jobs: 264, city: "Maipú" },
  ]
}

// --- Formatting helpers ------------------------------------------------------
export function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompactCLP(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value}`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value)
}
