import { prisma } from "@/lib/prisma";
import { getRiderData } from "../clients/riderClient";
import { getPaymentsData } from "../clients/paymentsClient";
import { getDriverData } from "../clients/driverClient";
import { getFeedbackData } from "../clients/feedbackClient";

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPaymentStatus(payment: any): string {
  return String(
    payment?.paymentStatus ??
      payment?.estadoPago ??
      payment?.statusPago ??
      payment?.payment_status ??
      payment?.status ??
      "",
  ).toUpperCase();
}

function isClosedPayment(payment: any): boolean {
  const status = getPaymentStatus(payment);
  return status === "PAID" || status === "PAGADO" || status === "COMPLETADO";
}

function getPaymentAmount(payment: any): number {
  return toNumber(payment?.amount ?? payment?.monto ?? payment?.total);
}

function getPaymentCommission(payment: any): number {
  const commission = toNumber(
    payment?.commissionAmount ??
      payment?.comisionFixNow ??
      payment?.commission ??
      payment?.comision,
  );

  if (commission > 0) return commission;

  const amount = getPaymentAmount(payment);
  return amount > 0 ? amount * 0.15 : 0;
}

export async function syncSnapshot(fecha: string) {
  console.log(`Generando Snapshot para la fecha: ${fecha}`);

  // 1. Llamar a las apps en paralelo para no perder tiempo
  const [riderData, paymentsData, driverData, feedbackData] = await Promise.all(
    [getRiderData(), getPaymentsData(), getDriverData(), getFeedbackData()],
  );

  const pagosPorJob = new Set(
    Array.isArray(paymentsData?.payments)
      ? paymentsData.payments
          .map((pago: any) => String(pago?.jobId ?? ""))
          .filter(Boolean)
      : [],
  );

  const pagos = Array.isArray(paymentsData?.payments)
    ? paymentsData.payments
    : [];
  const pagosCerrados = pagos.filter(isClosedPayment);
  const volumenTransaccionesCalculado = pagosCerrados.reduce(
    (total: number, pago: any) => total + getPaymentAmount(pago),
    0,
  );
  const ingresosNetosCalculado = pagosCerrados.reduce(
    (total: number, pago: any) => total + getPaymentCommission(pago),
    0,
  );

  // 2. Guardar en la base de datos (upsert para evitar duplicados del mismo día)
  const totalUsuarios = riderData.totalUsuarios + driverData.totalUsuarios;
  const totalClientes = riderData.totalUsuarios;
  const totalProfesionales = driverData.totalUsuarios;
  const volumenTransacciones =
    volumenTransaccionesCalculado ||
    toNumber(paymentsData.volumenTransacciones);
  const ingresosNetos =
    ingresosNetosCalculado || toNumber(paymentsData.ingresosNetos);
  const pedidosCompletados = Array.isArray(riderData.jobs)
    ? riderData.jobs.filter((j: any) => {
        const status = String(j?.status ?? "").toUpperCase();
        const jobId = String(j?.id ?? "");

        return status === "PAID" || pagosPorJob.has(jobId);
      }).length
    : 0;
  const calificacionPromedio = feedbackData.calificacionPromedio;
  const totalReseñas = feedbackData.totalReseñas;
  const reseñasAceptadas = feedbackData.reseñasAceptadas ?? 0;
  const reseñasRechazadas = feedbackData.reseñasRechazadas ?? 0;

  const snapshot = await prisma.snapshotKPI.upsert({
    where: { fecha: new Date(fecha) },
    update: {
      totalUsuarios,
      totalClientes,
      totalProfesionales,
      volumenTransacciones,
      ingresosNetos,
      pedidosCompletados,
      calificacionPromedio,
      totalReseñas,
      reseñasAceptadas,
      reseñasRechazadas,
    },
    create: {
      fecha: new Date(fecha),
      totalUsuarios,
      totalClientes,
      totalProfesionales,
      volumenTransacciones,
      ingresosNetos,
      pedidosCompletados,
      calificacionPromedio,
      totalReseñas,
      reseñasAceptadas,
      reseñasRechazadas,
    },
  });

  return snapshot;
}
