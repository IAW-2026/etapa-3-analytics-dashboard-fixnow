import { prisma } from '@/lib/prisma'
import { getRiderData } from '../clients/riderClient'
import { getFeedbackData } from '../clients/feedbackClient'
import { getPaymentsData } from '../clients/paymentsClient'

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
        const motivo = job.cancelationReason ? job.cancelationReason : '';

        const jobData = {
            trabajoExternoId: job.id,
            categoria: job.serviceType,
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
                    motivoCancelacion:
                        isCancelado
                        ?{
                            create: {
                                motivo,
                                categoria: job.serviceType,
                                fecha: cancelacionFecha,
                            },

                        }
                        : undefined,
                },
                update: {
                    ...jobData,
                    motivoCancelacion:
                        isCancelado
                        ?{
                            upsert: {
                                create: {
                                    motivo,
                                    categoria: job.serviceType,
                                    fecha: cancelacionFecha,
                                },
                                update:{
                                    motivo,
                                    categoria: job.serviceType,
                                    fecha: cancelacionFecha,
                                },
                            },
                        } : {delete: true}
                },
            }),
        )
    }

    if(operaciones.length){
        await prisma.$transaction(operaciones)
    }

    console.log(`${jobs.length} trabajos sincronizados.`);
    return true;
}