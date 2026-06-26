import { prisma } from '@/lib/prisma';
import { getRiderData } from '../clients/riderClient';
import { getDriverData } from '../clients/driverClient';
import { getPaymentsData } from '../clients/paymentsClient';

export async function syncProfesionales(fecha?: string){
    console.log('Obteniendo información de profesionales')

    const referenceDate = fecha ? new Date(fecha) : new Date();

    const [driverData, riderData, paymentsData] = await Promise.all([
        getDriverData(),
        getRiderData(),
        getPaymentsData(),
    ]);

    const profesionales = Array.isArray(driverData.professionals) ? driverData.professionals : []
    const trabajos = Array.isArray(riderData.jobs) ? riderData.jobs : [];

    const resumenTrabajos = trabajos.reduce((acumulador: any, trabajo: any) => {
        const idProf = trabajo.professionalId;
        if (!idProf) return acumulador;

        acumulador[idProf] = acumulador[idProf] || { completados: 0, cancelados: 0 }

        const status = (trabajo.status).toString().toUpperCase();

        if( status === 'COMPLETED'){
            acumulador[idProf].completados++;
        } else if (status === 'CANCELLED') {
            acumulador[idProf].cancelados++;
        }

        return acumulador;
    }, {});

    const pagos = Array.isArray(paymentsData?.payments) ? paymentsData.payments : [];

    const ingresosPorProf = pagos.reduce((acc: any, pago: any) => {
        const idProf = pago.professionalId;
        if(!idProf) return acc;

        acc[idProf] = acc[idProf] || {ingresos: 0, ultimaActividad: undefined}
        acc[idProf].ingresos = (acc[idProf] || 0) + Number(pago.amount);
        const fechaTrabajo = new Date(pago.paidAt);
        if(!acc[idProf].ultimaActividad || fechaTrabajo > acc[idProf].ultimaActividad){
            acc[idProf].ultimaActividad = fechaTrabajo
        }

        return acc;
    }, {});

    const operaciones: any[] = [];

    for( const profesional of profesionales ){
        const id = profesional.id;
        if(!id) continue;

        const actividad = resumenTrabajos[id] || { completados:0, cancelados: 0 };
        const pagoResumen = ingresosPorProf[id].ingresos || { ingresos: 0, ultimaActividad: undefined }
        const ingresos = pagoResumen.ingresos;
        const ultimaActividad = pagoResumen.ultimaActividad;
        const activo = !!ultimaActividad && (referenceDate.getTime() - ultimaActividad.getTime()) <= 30*24*60*60*1000;

        const operacionDb = prisma.profesionalResumen.upsert({
            where: {profesionalExternoId: profesional.id},
            update: {
                calificacionPromedio: profesional.ratingPromedio,
                totalTrabajos: actividad.completados,
                totalCancelaciones: actividad.cancelados,
                ingresoGenerado: ingresos,
                ...(ultimaActividad && {ultimaActividad}),
                activo,
            },
            create: {
                profesionalExternoId: profesional.id,
                calificacionPromedio: profesional.ratingPromedio,
                totalTrabajos: actividad.completados,
                totalCancelaciones: actividad.cancelados,
                ingresoGenerado: ingresos,
                activo,
                ultimaActividad: ultimaActividad || referenceDate,
            }
        });

        operaciones.push(operacionDb)
    }

    if(operaciones.length) await prisma.$transaction(operaciones)

    console.log(`${profesionales.length} profesionales sincronizados correctamente.`)
    return true;
}