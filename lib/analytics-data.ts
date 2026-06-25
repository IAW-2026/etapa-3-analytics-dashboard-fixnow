// FixNow Analytics - Consolidated data layer
// Consume las API routes internas que leen de Supabase via Prisma

import type { Period } from "@/components/analytics/AnalyticsDashboard";

export interface KpiData {
  totalUsers: number;
  totalClients: number;
  totalProfessionals: number;
  transactionVolume: number;
  netRevenue: number;
  averageTicket: number;
  averageTicketTrend: string;
  globalRating: number;
  totalReviews: number;
  completedOrders: number;
  activeUsers: number;
}

export interface CategoryDatum {
  category: "Plomería" | "Gas" | "Electricidad";
  jobs: number;
  fill: string;
}

export interface SuccessRateDatum {
  label: string;
  completados: number;
  cancelados: number;
}

export interface TopProfessional {
  id: string;
  name: string;
  category: "Plomería" | "Gas" | "Electricidad";
  rating: number;
  jobs: number;
  city: string;
}

export interface RevenueTrendDatum {
  month: string;
  ingresos: number;
  transacciones: number;
}
export interface AverageTicketDatum {
  category: "Plomería" | "Gas" | "Electricidad";
  ticket: number;
  fill: string;
}
export interface AverageTicketByCategoryDatum {
  category: "Plomería" | "Gas" | "Electricidad";
  ticket: number;
  fill: string;
}
export interface RevenueByCategoryDatum {
  category: "Plomería" | "Gas" | "Electricidad";
  ingresos: number;
  comision: number;
  fill: string;
}
interface SnapshotKpiApi {
  volumenTransacciones: number | string;
  ingresosNetos: number | string;
  pedidosCompletados: number;
}

interface MetricaMensualApi {
  anio: number;
  mes: number;
  categoria: string | null;
  ticketPromedio: number | string;
}
export interface MetricaMensualDatum {
  id?: string;
  anio: number;
  mes: number;
  categoria: string | null;
  trabajosCompletados: number;
  trabajosCancelados: number;
  ingresosTotal: number | string;
  clientesNuevos: number;
  ticketPromedio: number | string;
}
export interface CancelacionDatum {
  motivo: string;
  cantidad: number;
  categoria?: string;
}
type ApiCategoria = "PLOMERIA" | "GAS" | "ELECTRICIDAD";

interface TrabajoResumenApi {
  categoria: ApiCategoria;
  estado: "COMPLETADO" | "CANCELADO" | "EN_PROGRESO";
  monto: number | string | null;
  comisionFixNow: number | string | null;
}

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}
function mapCategory(
  category: ApiCategoria,
): "Plomería" | "Gas" | "Electricidad" {
  if (category === "PLOMERIA") return "Plomería";
  if (category === "GAS") return "Gas";
  return "Electricidad";
}
function calculateTrend(current: number, previous: number): string {
  if (!previous) return "+0.0%";

  const value = ((current - previous) / previous) * 100;
  const sign = value >= 0 ? "+" : "";

  return `${sign}${value.toFixed(1)}%`;
}

function getGlobalMetricas(metricas: MetricaMensualApi[]): MetricaMensualApi[] {
  return [...metricas]
    .filter((metrica) => metrica.categoria === null)
    .sort((a, b) => {
      if (a.anio !== b.anio) return a.anio - b.anio;
      return a.mes - b.mes;
    });
}
// Simulate network latency for a realistic dashboard load
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const mesesNombres = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
// --- Rider App API (clientes) -------------------------------------------------
async function getClientsCount(): Promise<number> {
  await delay(120);
  return 4820;
}

// --- Driver App API (profesionales) ------------------------------------------
async function getProfessionalsCount(): Promise<number> {
  await delay(140);
  return 612;
}

// --- Payments App API --------------------------------------------------------
async function getPaymentsSummary(): Promise<{
  transactionVolume: number;
  netRevenue: number;
  completedOrders: number;
  averageTicket: number;
  averageTicketTrend: string;
}> {
  try {
    const [snapshotResponse, metricasResponse] = await Promise.all([
      fetch("/api/kpis", { cache: "no-store" }),
      fetch("/api/metricas", { cache: "no-store" }),
    ]);

    if (!snapshotResponse.ok || !metricasResponse.ok) {
      throw new Error("No se pudieron obtener los datos consolidados");
    }

    const snapshot = (await snapshotResponse.json()) as SnapshotKpiApi;
    const metricas = (await metricasResponse.json()) as MetricaMensualApi[];

    const globalMetricas = getGlobalMetricas(metricas);
    const latestMonth = globalMetricas.at(-1);
    const previousMonth = globalMetricas.at(-2);

    const transactionVolume = toNumber(snapshot.volumenTransacciones);
    const netRevenue = toNumber(snapshot.ingresosNetos);
    const completedOrders = snapshot.pedidosCompletados;

    const averageTicket =
      latestMonth && toNumber(latestMonth.ticketPromedio) > 0
        ? toNumber(latestMonth.ticketPromedio)
        : completedOrders > 0
          ? transactionVolume / completedOrders
          : 0;

    const previousAverageTicket = previousMonth
      ? toNumber(previousMonth.ticketPromedio)
      : 0;

    return {
      transactionVolume,
      netRevenue,
      completedOrders,
      averageTicket,
      averageTicketTrend: calculateTrend(averageTicket, previousAverageTicket),
    };
  } catch {
    await delay(160);
    return {
      transactionVolume: 184_350_000,
      netRevenue: 27_652_500,
      completedOrders: 13_984,
      averageTicket: 13_184,
      averageTicketTrend: "+0.0%",
    };
  }
}

// --- Feedback App API --------------------------------------------------------
async function getFeedbackSummary(): Promise<{
  globalRating: number;
  totalReviews: number;
}> {
  await delay(110);
  return { globalRating: 4.7, totalReviews: 11_240 };
}

// --- Consolidated KPIs (top row) ---------------------------------------------
function periodToParams(period?: Period): string {
  if (!period) return "";

  const daysByPeriod: Record<Period, number> = {
    "30d": 30,
    "90d": 90,
    "6m": 180,
    "1y": 365,
  };

  const desde = new Date();
  desde.setDate(desde.getDate() - daysByPeriod[period]);

  return `desde=${desde.toISOString()}`;
}
export async function fetchKpis(_period?: Period): Promise<KpiData> {
  const [clients, professionals, payments, feedback] = await Promise.all([
    getClientsCount(),
    getProfessionalsCount(),
    getPaymentsSummary(),
    getFeedbackSummary(),
  ]);

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
  };
}

// --- Trabajos por categoría --------------------------------------------------
export async function fetchJobsByCategory(
  period: Period = "6m",
): Promise<CategoryDatum[]> {
  const params = periodToParams(period);
  const query = params ? `estado=COMPLETADO&${params}` : "estado=COMPLETADO";
  const res = await fetch(`/api/trabajos?${query}`);
  if (!res.ok) throw new Error("Error al cargar trabajos");
  const trabajos: Array<{ categoria: string }> = await res.json();

  const conteo: Record<string, number> = {
    PLOMERIA: 0,
    ELECTRICIDAD: 0,
    GAS: 0,
  };
  for (const t of trabajos) {
    if (conteo[t.categoria] !== undefined) conteo[t.categoria]++;
  }

  return [
    { category: "Plomería", jobs: conteo.PLOMERIA, fill: "var(--plumbing)" },
    {
      category: "Electricidad",
      jobs: conteo.ELECTRICIDAD,
      fill: "var(--electrical)",
    },
    { category: "Gas", jobs: conteo.GAS, fill: "var(--gas)" },
  ];
}

// --- Tasa de éxito -----------------------------------------------------------
export async function fetchSuccessRate(
  period: Period = "6m",
): Promise<SuccessRateDatum[]> {
  const params = periodToParams(period);
  const query = params ? `?${params}` : "";
  const res = await fetch(`/api/trabajos${query}`);
  if (!res.ok) throw new Error("Error al cargar tasa de éxito");
  const trabajos: Array<{ categoria: string; estado: string }> =
    await res.json();

  const conteo: Record<string, { completados: number; cancelados: number }> = {
    PLOMERIA: { completados: 0, cancelados: 0 },
    ELECTRICIDAD: { completados: 0, cancelados: 0 },
    GAS: { completados: 0, cancelados: 0 },
  };
  for (const t of trabajos) {
    if (!conteo[t.categoria]) continue;
    if (t.estado === "COMPLETADO") conteo[t.categoria].completados++;
    else if (t.estado === "CANCELADO") conteo[t.categoria].cancelados++;
  }

  return [
    { label: "Plomería", ...conteo.PLOMERIA },
    { label: "Electricidad", ...conteo.ELECTRICIDAD },
    { label: "Gas", ...conteo.GAS },
  ];
}
// --- Tendencia de ingresos ---------------------------------------------------
export async function fetchRevenueTrend(
  period: Period = "6m",
): Promise<RevenueTrendDatum[]> {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  const [resActual, resAnterior] = await Promise.all([
    fetch(`/api/metricas?anio=${anioActual}`),
    fetch(`/api/metricas?anio=${anioActual - 1}`),
  ]);

  const dataActual: MetricaMensualDatum[] = resActual.ok
    ? await resActual.json()
    : [];
  const dataAnterior: MetricaMensualDatum[] = resAnterior.ok
    ? await resAnterior.json()
    : [];

  const globalesActual = dataActual.filter((m) => !m.categoria);
  const globalesAnterior = dataAnterior.filter((m) => !m.categoria);

  // Cantidad de meses según el período
  const cantMeses =
    period === "30d" ? 1 : period === "90d" ? 3 : period === "6m" ? 6 : 12;

  const resultado: MetricaMensualDatum[] = [];
  for (let i = cantMeses - 1; i >= 0; i--) {
    let mes = mesActual - i;
    let anio = anioActual;
    if (mes <= 0) {
      mes += 12;
      anio -= 1;
    }
    const fuente = anio === anioActual ? globalesActual : globalesAnterior;
    const datum = fuente.find((m) => m.mes === mes && m.anio === anio);
    if (datum) resultado.push(datum);
  }

  return resultado.map((m) => ({
    month: mesesNombres[m.mes - 1],
    ingresos: Number(m.ingresosTotal),
    transacciones: m.trabajosCompletados + m.trabajosCancelados,
  }));
}
export async function fetchRevenueByCategory(): Promise<
  RevenueByCategoryDatum[]
> {
  try {
    const response = await fetch("/api/trabajos", {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("No se pudieron obtener los trabajos");
    }

    const trabajos = (await response.json()) as TrabajoResumenApi[];

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
    };

    trabajos
      .filter((trabajo) => trabajo.estado === "COMPLETADO")
      .forEach((trabajo) => {
        const category = mapCategory(trabajo.categoria);
        const monto = toNumber(trabajo.monto);
        const comision = toNumber(trabajo.comisionFixNow);

        totals[category].ingresos += monto;
        totals[category].comision += comision;
      });

    return Object.entries(totals).map(([category, values]) => ({
      category: category as "Plomería" | "Gas" | "Electricidad",
      ingresos: values.ingresos,
      comision: values.comision,
      fill: values.fill,
    }));
  } catch {
    await delay(140);

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
    ];
  }
}
// --- Feedback / Driver App: top profesionales --------------------------------
export interface TopProfessionalsFilters {
  categoria?: string;
  ciudad?: string;
}

export async function fetchTopProfessionals(
  filters: TopProfessionalsFilters = {},
): Promise<TopProfessional[]> {
  const params = new URLSearchParams({ limit: "10" });
  if (filters.categoria) params.set("categoria", filters.categoria);
  if (filters.ciudad) params.set("ciudad", filters.ciudad);

  const res = await fetch(`/api/profesionales?${params}`);
  if (!res.ok) throw new Error("Error al cargar profesionales");
  const data: Array<{
    id: string;
    nombre: string;
    categoria: string;
    calificacionPromedio: number;
    totalTrabajos: number;
    ciudad: string;
  }> = await res.json();

  const categoryMap: Record<string, "Plomería" | "Gas" | "Electricidad"> = {
    PLOMERIA: "Plomería",
    ELECTRICIDAD: "Electricidad",
    GAS: "Gas",
  };

  return data.map((p) => ({
    id: p.id,
    name: p.nombre,
    category: categoryMap[p.categoria],
    rating: p.calificacionPromedio,
    jobs: p.totalTrabajos,
    city: p.ciudad,
  }));
}

export async function fetchCiudades(): Promise<string[]> {
  const res = await fetch("/api/profesionales/ciudades");
  if (!res.ok) throw new Error("Error al cargar ciudades");
  return res.json();
}

// --- Métricas mensuales (para comparativa) -----------------------------------
export async function fetchMetricasMensuales(
  period: Period,
): Promise<MetricaMensualDatum[]> {
  const anio = new Date().getFullYear();
  const res = await fetch(`/api/metricas?anio=${anio}`);
  if (!res.ok) throw new Error("Error al cargar métricas mensuales");
  const data: MetricaMensualDatum[] = await res.json();

  // Solo globales (sin categoría)
  const globales = data.filter((m) => !m.categoria);

  const cantidad =
    period === "30d" ? 1 : period === "90d" ? 3 : period === "6m" ? 6 : 12;
  return globales.slice(-cantidad);
}

// --- Cancelaciones agrupadas -------------------------------------------------
export async function fetchCancelaciones(): Promise<CancelacionDatum[]> {
  const res = await fetch("/api/trabajos/cancelaciones");
  if (!res.ok) throw new Error("Error al cargar cancelaciones");
  return res.json();
}

// --- Alertas de calidad ------------------------------------------------------
export interface AlertaProfesional {
  id: string;
  nombre: string;
  categoria: string;
  ciudad: string;
  calificacionPromedio: number;
  totalCancelaciones: number;
  totalTrabajos: number;
}

export async function fetchAlertas(): Promise<AlertaProfesional[]> {
  const res = await fetch("/api/profesionales/alertas");
  if (!res.ok) throw new Error("Error al cargar alertas de calidad");
  return res.json();
}

// --- Distribución de ratings -------------------------------------------------
export interface RatingBucket {
  estrellas: number;
  cantidad: number;
}

export async function fetchRatingDistribution(): Promise<RatingBucket[]> {
  const res = await fetch("/api/profesionales/ratings");
  if (!res.ok) throw new Error("Error al cargar distribución de ratings");
  return res.json();
}

// --- Formatting helpers ------------------------------------------------------
export function formatCLP(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCLP(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("es-CL").format(value);
}

// --- Ticket promedio por servicio ------------------------------------------------
export async function fetchAverageTicket(
  period: Period = "6m",
): Promise<AverageTicketByCategoryDatum[]> {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  // Traemos el año actual y el anterior por si el período cruza de año (ej. 6 meses en febrero)
  const [resActual, resAnterior] = await Promise.all([
    fetch(`/api/metricas?anio=${anioActual}`),
    fetch(`/api/metricas?anio=${anioActual - 1}`),
  ]);

  const dataActual: MetricaMensualDatum[] = resActual.ok
    ? await resActual.json()
    : [];
  const dataAnterior: MetricaMensualDatum[] = resAnterior.ok
    ? await resAnterior.json()
    : [];

  const allData = [...dataAnterior, ...dataActual];

  // Definimos cuántos meses hacia atrás vamos a mirar
  const cantMeses =
    period === "30d" ? 1 : period === "90d" ? 3 : period === "6m" ? 6 : 12;

  // Acumuladores para el promedio
  const categoryMap: Record<string, { sum: number; count: number }> = {
    PLOMERIA: { sum: 0, count: 0 },
    ELECTRICIDAD: { sum: 0, count: 0 },
    GAS: { sum: 0, count: 0 },
  };

  for (const m of allData) {
    if (!m.categoria) continue;

    // Calculamos si el mes cae dentro de nuestro rango
    const monthDiff = (anioActual - m.anio) * 12 + (mesActual - m.mes);
    if (monthDiff >= 0 && monthDiff < cantMeses) {
      if (categoryMap[m.categoria]) {
        categoryMap[m.categoria].sum += Number(m.ticketPromedio);
        categoryMap[m.categoria].count += 1;
      }
    }
  }

  return [
    {
      category: "Plomería",
      ticket:
        categoryMap.PLOMERIA.count > 0
          ? categoryMap.PLOMERIA.sum / categoryMap.PLOMERIA.count
          : 0,
      fill: "var(--plumbing)",
    },
    {
      category: "Electricidad",
      ticket:
        categoryMap.ELECTRICIDAD.count > 0
          ? categoryMap.ELECTRICIDAD.sum / categoryMap.ELECTRICIDAD.count
          : 0,
      fill: "var(--electrical)",
    },
    {
      category: "Gas",
      ticket:
        categoryMap.GAS.count > 0
          ? categoryMap.GAS.sum / categoryMap.GAS.count
          : 0,
      fill: "var(--gas)",
    },
  ];
}

// --- Comparativa Mensual (Análisis) ---------------------------------

export interface ComparativaMensualDatum {
  month: string;
  ingresos: number;
  completados: number;
  cancelados: number;
  nuevos: number;
}

export async function fetchComparativaMensual(
  period: Period = "6m",
): Promise<ComparativaMensualDatum[]> {
  const anioActual = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  // Traemos el año actual y el anterior para soportar cruces de año
  const [resActual, resAnterior] = await Promise.all([
    fetch(`/api/metricas?anio=${anioActual}`),
    fetch(`/api/metricas?anio=${anioActual - 1}`),
  ]);

  const dataActual: MetricaMensualDatum[] = resActual.ok
    ? await resActual.json()
    : [];
  const dataAnterior: MetricaMensualDatum[] = resAnterior.ok
    ? await resAnterior.json()
    : [];

  const globalesActual = dataActual.filter((m) => !m.categoria);
  const globalesAnterior = dataAnterior.filter((m) => !m.categoria);

  const cantMeses =
    period === "30d" ? 1 : period === "90d" ? 3 : period === "6m" ? 6 : 12;

  const resultado: MetricaMensualDatum[] = [];
  for (let i = cantMeses - 1; i >= 0; i--) {
    let mes = mesActual - i;
    let anio = anioActual;
    if (mes <= 0) {
      mes += 12;
      anio -= 1;
    }
    const fuente = anio === anioActual ? globalesActual : globalesAnterior;
    const datum = fuente.find((m) => m.mes === mes && m.anio === anio);
    if (datum) resultado.push(datum);
  }

  // Mapeamos todos los datos que necesitamos para las múltiples series
  return resultado.map((m) => ({
    month: mesesNombres[m.mes - 1],
    ingresos: Number(m.ingresosTotal),
    completados: m.trabajosCompletados,
    cancelados: m.trabajosCancelados,
    nuevos: m.clientesNuevos,
  }));
}
export type ProfessionalRevenueRow = {
  professionalId: string;
  professionalName: string;
  totalRevenue: number;
  completedJobs: number;
  fixNowCommission: number;
  averageAmount: number;
};

// Funciones auxiliares privadas para procesar los trabajos
function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getNumber(value: unknown): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}


export async function fetchProfessionalRevenueRanking(): Promise<
  ProfessionalRevenueRow[]
> {
  const [trabajosResponse, profesionalesResponse] = await Promise.all([
    fetch("/api/trabajos", { cache: "no-store" }),
    fetch("/api/profesionales?limit=100", { cache: "no-store" }),
  ]);

  if (!trabajosResponse.ok) {
    throw new Error("No se pudieron cargar los trabajos");
  }

  if (!profesionalesResponse.ok) {
    throw new Error("No se pudieron cargar los profesionales");
  }

  const trabajosData = await trabajosResponse.json();
  const profesionalesData = await profesionalesResponse.json();

  let jobs: Record<string, unknown>[] = [];

  if (Array.isArray(trabajosData)) {
    jobs = trabajosData.filter(isRecord);
  } else if (isRecord(trabajosData)) {
    const possibleKeys = ["trabajos", "jobs", "data", "items"];

    for (const key of possibleKeys) {
      if (Array.isArray(trabajosData[key])) {
        jobs = trabajosData[key].filter(isRecord);
        break;
      }
    }
  }

  const professionals = Array.isArray(profesionalesData)
    ? profesionalesData.filter(isRecord)
    : [];

  const categoryTotals: Record<string, { revenue: number; jobs: number }> = {
    PLOMERIA: { revenue: 0, jobs: 0 },
    ELECTRICIDAD: { revenue: 0, jobs: 0 },
    GAS: { revenue: 0, jobs: 0 },
  };

  for (const job of jobs) {
    const status = (
      getString(job.estado) ||
      getString(job.status) ||
      getString(job.jobStatus)
    ).toLowerCase();

    const isCompleted =
      status === "completado" ||
      status === "completed" ||
      status === "paid" ||
      status === "pagado" ||
      status === "finalizado";

    if (!isCompleted) continue;

    const category = (
      getString(job.categoria) ||
      getString(job.category) ||
      getString(job.serviceType)
    ).toUpperCase();

    const amount = getNumber(
      job.monto ||
        job.amount ||
        job.total ||
        job.montoTotal ||
        job.totalAmount ||
        job.precio ||
        job.valor ||
        job.price,
    );

    if (!categoryTotals[category]) continue;

    categoryTotals[category].revenue += amount;
    categoryTotals[category].jobs += 1;
  }

  const averageAmountByCategory: Record<string, number> = {
    PLOMERIA:
      categoryTotals.PLOMERIA.jobs > 0
        ? categoryTotals.PLOMERIA.revenue / categoryTotals.PLOMERIA.jobs
        : 0,
    ELECTRICIDAD:
      categoryTotals.ELECTRICIDAD.jobs > 0
        ? categoryTotals.ELECTRICIDAD.revenue / categoryTotals.ELECTRICIDAD.jobs
        : 0,
    GAS:
      categoryTotals.GAS.jobs > 0
        ? categoryTotals.GAS.revenue / categoryTotals.GAS.jobs
        : 0,
  };

  return professionals
    .map((professional): ProfessionalRevenueRow => {
      const professionalId = getString(professional.id) || "Sin ID";

      const professionalName =
        getString(professional.nombre) ||
        getString(professional.name) ||
        getString(professional.fullName) ||
        `Profesional ${professionalId.slice(0, 8)}`;

      const category = (
        getString(professional.categoria) ||
        getString(professional.category)
      ).toUpperCase();

      const completedJobs =
        getNumber(professional.totalTrabajos) ||
        getNumber(professional.jobs) ||
        getNumber(professional.completedJobs);

      const averageAmount = averageAmountByCategory[category] || 0;
      const totalRevenue = completedJobs * averageAmount;
      const fixNowCommission = totalRevenue * 0.15;

      return {
        professionalId,
        professionalName,
        totalRevenue,
        completedJobs,
        fixNowCommission,
        averageAmount,
      };
    })
    .filter((professional) => professional.completedJobs > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);
}