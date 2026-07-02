import { prisma } from '@/lib/prisma';
import { getRiderData } from '../clients/riderClient';
import { getDriverData } from '../clients/driverClient';
import { getPaymentsData } from '../clients/paymentsClient';

type CategoriaEnum = 'PLOMERIA' | 'ELECTRICIDAD' | 'GAS';

function normalizeCategoria(value: unknown): CategoriaEnum {
    const normalized = String(value || '').toUpperCase();

    if (normalized.includes('PLOM') || normalized.includes('PLUMB') || normalized.includes('PLOMER')) {
        return 'PLOMERIA';
    }
    if (normalized.includes('ELECT') || normalized.includes('ELECTRIC')) {
        return 'ELECTRICIDAD';
    }
    if (normalized.includes('GAS')) {
        return 'GAS';
    }

    return 'PLOMERIA';
}

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

        acc[idProf] = acc[idProf] || {ingresos: 0, ultimaActividad: undefined};
        acc[idProf].ingresos = acc[idProf].ingresos + Number(pago.amount);
        const fechaTrabajo = new Date(pago.paidAt);
        if(!acc[idProf].ultimaActividad || fechaTrabajo > acc[idProf].ultimaActividad){
            acc[idProf].ultimaActividad = fechaTrabajo;
        }

        return acc;
    }, {});

    const operaciones: any[] = [];

    for( const profesional of profesionales ){
        const id = profesional.id;
        if(!id) continue;

        const actividad = resumenTrabajos[id] || { completados:0, cancelados: 0 };
        const pagoResumen = ingresosPorProf[id] || { ingresos: 0, ultimaActividad: undefined }
        const ingresos = pagoResumen.ingresos;
        const ultimaActividad = pagoResumen.ultimaActividad;
        const activo = !!ultimaActividad && (referenceDate.getTime() - ultimaActividad.getTime()) <= 30*24*60*60*1000;

        const categoria = normalizeCategoria(profesional.serviceType);
        const calificacion = Number(profesional.ratingPromedio) || 0;

        const operacionDb = prisma.profesionalResumen.upsert({
            where: {profesionalExternoId: profesional.id},
            update: {
                calificacionPromedio: calificacion,
                totalTrabajos: actividad.completados,
                totalCancelaciones: actividad.cancelados,
                ingresoGenerado: Number(ingresos) || 0,
                ...(ultimaActividad && {ultimaActividad}),
                activo,
            },
            create: {
                nombre: profesional.fullName || 'Profesional desconocido',
                categoria,
                ciudad: "Bahia Blanca",
                profesionalExternoId: profesional.id,
                calificacionPromedio: calificacion,
                totalTrabajos: actividad.completados,
                totalCancelaciones: actividad.cancelados,
                ingresoGenerado: Number(ingresos) || 0,
                activo,
                ultimaActividad: ultimaActividad || referenceDate,
            }
        });

        operaciones.push(operacionDb)
    }

    if(operaciones.length > 0){
        const BATCH_SIZE = 10;
        for(let i = 0; i < operaciones.length; i += BATCH_SIZE){
            const batch = operaciones.slice(i, i + BATCH_SIZE);
            await prisma.$transaction(batch,{
                timeout:10000
            });
        }
    }

    console.log(`${profesionales.length} profesionales sincronizados correctamente.`)
    return true;
}