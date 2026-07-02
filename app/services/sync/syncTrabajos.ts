import { prisma } from '@/lib/prisma'
import { getRiderData } from '../clients/riderClient'
import { getFeedbackData } from '../clients/feedbackClient'
import { getPaymentsData } from '../clients/paymentsClient'
import { EstadoTrabajo } from '@prisma/client'

type Pago = {
    jobId: string
    amount?: number | string
    commissionAmount?: number | string
    paidAt?: string
}

type Review = {
    jobId: string
    rating?: number | string
}

function normalizeEstadoTrabajo(status: unknown){
    const value = String(status || '').toUpperCase()

    if(value === 'COMPLETED') return 'COMPLETADO'
    if(value === 'CANCELLED') return 'CANCELADO'
    
    return 'EN_PROGRESO'
}

type CategoriaEnum = 'PLOMERIA' | 'ELECTRICIDAD' | 'GAS'

function normalizeCategoria(value: unknown): CategoriaEnum{
    const s = String(value || '').toUpperCase()

    if(s.includes('PLOM') || s.includes('PLUMB') || s.includes('PLOMER')) return 'PLOMERIA'
    if(s.includes('ELECT') || s.includes('ELECTRIC')) return 'ELECTRICIDAD'
    if(s.includes('GAS')) return 'GAS'

    return 'PLOMERIA'
}

export async function syncTrabajos(){
    console.log(`Cargando la información de los trabajos`)

    const [ riderData, feedbackData, paymentsData ] = await Promise.all([
        getRiderData(),
        getFeedbackData(),
        getPaymentsData(),
    ]);

    const jobs = Array.isArray(riderData.jobs) ? riderData.jobs : [];
    const paymentsByJob = new Map<string, Pago>(
        (Array.isArray(paymentsData?.payments) ? paymentsData.payments : []).map((p: Pago) => [
            String(p.jobId),
            p,
        ]),
    )
    const reviewsByJob = new Map<string, Review>(
        (Array.isArray(feedbackData?.reviews) ? feedbackData.reviews : []).map((r: Review) => [
            String(r.jobId),
            r,
        ]),
    )

    const operaciones: any[] = []

    for (const job of jobs){
        const jobId = String(job.id)
        const pago = paymentsByJob.get(jobId);
        const review = reviewsByJob.get(jobId);

        const estado = normalizeEstadoTrabajo(job.status);
        const isCancelado = estado === 'CANCELADO';
        const cancelacionFecha = job.cancelledAt ? new Date(job.cancelledAt) : new Date()
        const motivo = job.cancellationReason ? job.cancellationReason : '';

        const jobData = {
            trabajoExternoId: job.id,
            categoria: normalizeCategoria(job.serviceType),
            estado,
            monto: pago?.amount != null ? Number(pago.amount) : null,
            comisionFixNow: pago?.commissionAmount != null ? Number(pago.commissionAmount) : null,
            calificacion: review?.rating != null ? Number(review.rating) : null,
            fechaCreacion: job.requestedDate
                 ? new Date(job.requestedDate)
                 : pago?.paidAt
                 ? new Date(pago.paidAt)
                 : new Date()
        }

        operaciones.push(
            prisma.trabajoResumen.upsert({
                where: {trabajoExternoId: jobId},
                create:{
                    ...jobData,
                    estado: jobData.estado as EstadoTrabajo,
                    motivoCancelacion:
                        isCancelado
                        ?{
                            create: {
                                motivo,
                                categoria: normalizeCategoria(job.serviceType),
                                fecha: cancelacionFecha,
                            },

                        }
                        : undefined,
                },
                update: {
                    ...jobData,
                    estado: jobData.estado as EstadoTrabajo,
                    motivoCancelacion:
                        isCancelado
                        ?{
                            upsert: {
                                create: {
                                    motivo,
                                    categoria: normalizeCategoria(job.serviceType),
                                    fecha: cancelacionFecha,
                                },
                                update:{
                                    motivo,
                                    categoria: normalizeCategoria(job.serviceType),
                                    fecha: cancelacionFecha,
                                },
                            },
                        } : undefined
                },
            }),
        )
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

    console.log(`${jobs.length} trabajos sincronizados.`);
    return true;
}