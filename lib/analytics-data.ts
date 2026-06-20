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
}> {
  await delay(160)
  return {
    transactionVolume: 184_350_000, // CLP movido en la plataforma
    netRevenue: 27_652_500, // comisión neta FixNow (~15%)
    completedOrders: 13_984,
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
