import { prisma } from '@/lib/prisma'

export async function calcularMetricasMensuales() {
  console.log('Calculando métricas mensuales...')

  const trabajos = await prisma.trabajoResumen.findMany({
    select: {
      categoria: true,
      estado: true,
      monto: true,
      fechaCreacion: true,
    }
  })

  // Agrupar por anio + mes + categoria
  const agrupado: Record<string, {
    anio: number, mes: number, categoria: string | null,
    completados: number, cancelados: number,
    ingresos: number, montos: number[]
  }> = {}

  for (const t of trabajos) {
    const fecha = new Date(t.fechaCreacion)
    const anio = fecha.getFullYear()
    const mes = fecha.getMonth() + 1

    const categories = t.categoria == null ? [null] : [null, t.categoria]

    for (const cat of categories) {
      const key = `${anio}-${mes}-${cat ?? 'null'}`
      if (!agrupado[key]) {
        agrupado[key] = { anio, mes, categoria: cat, completados: 0, cancelados: 0, ingresos: 0, montos: [] }
      }
      if (t.estado === 'COMPLETADO') {
        agrupado[key].completados++
        if (t.monto) {
          agrupado[key].ingresos += Number(t.monto)
          agrupado[key].montos.push(Number(t.monto))
        }
      } else if (t.estado === 'CANCELADO') {
        agrupado[key].cancelados++
      }
    }
  }

  const operaciones: any[] = []

  for (const m of Object.values(agrupado)) {
    const ticketPromedio = m.montos.length
      ? m.montos.reduce((a, b) => a + b, 0) / m.montos.length
      : 0

    if (m.categoria == null) {
      const existing = await prisma.metricaMensual.findFirst({
        where: {
          anio: m.anio,
          mes: m.mes,
          categoria: null,
        }
      })

      if (existing) {
        operaciones.push(
          prisma.metricaMensual.update({
            where: { id: existing.id },
            data: {
              trabajosCompletados: m.completados,
              trabajosCancelados: m.cancelados,
              ingresosTotal: m.ingresos,
              ticketPromedio,
            }
          })
        )
      } else {
        operaciones.push(
          prisma.metricaMensual.create({
            data: {
              anio: m.anio,
              mes: m.mes,
              categoria: null,
              trabajosCompletados: m.completados,
              trabajosCancelados: m.cancelados,
              ingresosTotal: m.ingresos,
              ticketPromedio,
              clientesNuevos: 0, // Lautaro puede calcularlo desde riderData si tiene fecha de registro
            }
          })
        )
      }
    } else {
      operaciones.push(
        prisma.metricaMensual.upsert({
          where: {
            anio_mes_categoria: {
              anio: m.anio,
              mes: m.mes,
              categoria: m.categoria as any,
            }
          },
          update: {
            trabajosCompletados: m.completados,
            trabajosCancelados: m.cancelados,
            ingresosTotal: m.ingresos,
            ticketPromedio,
          },
          create: {
            anio: m.anio,
            mes: m.mes,
            categoria: m.categoria as any,
            trabajosCompletados: m.completados,
            trabajosCancelados: m.cancelados,
            ingresosTotal: m.ingresos,
            ticketPromedio,
            clientesNuevos: 0, // Lautaro puede calcularlo desde riderData si tiene fecha de registro
          }
        })
      )
    }
  }

  if (operaciones.length > 0) {
    const BATCH_SIZE = 10;
    for (let i = 0; i < operaciones.length; i += BATCH_SIZE) {
      const batch = operaciones.slice(i, i + BATCH_SIZE);
      await prisma.$transaction(batch, {
        timeout: 10000,
      });
    }
  }
  console.log(`${operaciones.length} métricas mensuales calculadas.`)
}