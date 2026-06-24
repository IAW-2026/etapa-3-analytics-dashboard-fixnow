// FixNow Analytics - Consolidated data layer
// Consume las API routes internas que leen de Supabase via Prisma

import type { Period } from "@/components/analytics/AnalyticsDashboard";

export interface KpiData {
  totalUsers: number;
  totalClients: number;
  totalProfessionals: number;
  transactionVolume: number;
  netRevenue: number;
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

export interface MetricaMensualDatum {
  mes: number;
  anio: number;
  categoria?: string | null;
  trabajosCompletados: number;
  trabajosCancelados: number;
  ingresosTotal: number;
  clientesNuevos: number;
  ticketPromedio: number;
}

export interface CancelacionDatum {
  motivo: string;
  categoria: string;
  _count: number;
}

// Helper para convertir Period a fechas
function periodToParams(period: Period): string {
  const hasta = new Date();
  const desde = new Date();
  if (period === "30d") desde.setDate(desde.getDate() - 30);
  else if (period === "90d") desde.setDate(desde.getDate() - 90);
  else if (period === "6m") desde.setMonth(desde.getMonth() - 6);
  else if (period === "1y") desde.setFullYear(desde.getFullYear() - 1);
  return `desde=${desde.toISOString().split("T")[0]}&hasta=${hasta.toISOString().split("T")[0]}`;
}

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

// --- KPIs --------------------------------------------------------------------
export async function fetchKpis(period?: Period): Promise<KpiData> {
  if (!period) {
    // Sin período: usamos el snapshot global (comportamiento actual)
    const res = await fetch("/api/kpis");
    if (!res.ok) throw new Error("Error al cargar KPIs");
    const data = await res.json();
    return {
      totalUsers: data.totalUsuarios,
      totalClients: data.totalClientes,
      totalProfessionals: data.totalProfesionales,
      transactionVolume: Number(data.volumenTransacciones),
      netRevenue: Number(data.ingresosNetos),
      globalRating: data.calificacionPromedio,
      totalReviews: data.totalReseñas,
      completedOrders: data.pedidosCompletados,
      activeUsers: data.totalClientes,
    };
  }

  // Con período: calculamos desde los trabajos filtrados por fecha
  const params = periodToParams(period);
  const res = await fetch(`/api/trabajos?${params}`);
  if (!res.ok) throw new Error("Error al cargar trabajos para KPIs");
  const trabajos: Array<{
    estado: string;
    monto: string | null;
    comisionFixNow: string | null;
    calificacion: number | null;
  }> = await res.json();

  const completados = trabajos.filter((t) => t.estado === "COMPLETADO");
  const volumen = completados.reduce((acc, t) => acc + Number(t.monto ?? 0), 0);
  const comision = completados.reduce(
    (acc, t) => acc + Number(t.comisionFixNow ?? 0),
    0,
  );
  const calificaciones = completados.filter((t) => t.calificacion !== null);
  const rating = calificaciones.length
    ? calificaciones.reduce((acc, t) => acc + (t.calificacion ?? 0), 0) /
      calificaciones.length
    : 0;

  // Usuarios los traemos siempre del snapshot (no cambian por período)
  const snapRes = await fetch("/api/kpis");
  const snap = snapRes.ok ? await snapRes.json() : null;

  return {
    totalUsers: snap?.totalUsuarios ?? 0,
    totalClients: snap?.totalClientes ?? 0,
    totalProfessionals: snap?.totalProfesionales ?? 0,
    transactionVolume: volumen,
    netRevenue: comision,
    globalRating: rating,
    totalReviews: calificaciones.length,
    completedOrders: completados.length,
    activeUsers: snap?.totalClientes ?? 0,
  };
}

// --- Trabajos por categoría --------------------------------------------------
export async function fetchJobsByCategory(
  period: Period = "6m",
): Promise<CategoryDatum[]> {
  const params = periodToParams(period);
  const res = await fetch(`/api/trabajos?estado=COMPLETADO&${params}`);
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
  const res = await fetch(`/api/trabajos?${params}`);
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

// --- Top profesionales -------------------------------------------------------
export async function fetchTopProfessionals(): Promise<TopProfessional[]> {
  const res = await fetch("/api/profesionales?limit=5");
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
