import { prisma } from '@/lib/prisma';
import { getRiderData } from '../clients/riderClient';
import { getPaymentsData } from '../clients/paymentsClient';
import { getDriverData } from '../clients/driverClient';
import { getFeedbackData } from '../clients/feedbackClient';

export async function syncSnapshot(fecha: string) {
  console.log(`Generando Snapshot para la fecha: ${fecha}`);

  // 1. Llamar a las apps en paralelo para no perder tiempo
  const [riderData, paymentsData, driverData, feedbackData] = await Promise.all([
    getRiderData(),
    getPaymentsData(),
    getDriverData(),
    getFeedbackData(),    
]);

  // 2. Guardar en la base de datos (upsert para evitar duplicados del mismo día)
  const totalUsuarios = riderData.totalUsuarios + driverData.totalUsuarios;
  const totalClientes = riderData.totalUsuarios;
  const totalProfesionales = driverData.totalUsuarios;
  const volumenTransacciones = paymentsData.volumenTransacciones;
  const ingresosNetos = paymentsData.ingresosNetos;
  const pedidosCompletados = Array.isArray(riderData.jobs) 
    ? riderData.jobs.filter((j: any) => {
      const status = (j.estado);
      return status === 'COMPLETED';
    }).length
    : 0;
  const calificacionPromedio = feedbackData.calificacionPromedio;
  const totalReseñas = feedbackData.totalReseñas;

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
    }
  });

  return snapshot;
}