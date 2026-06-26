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

    // Global (null) y por categoría
    for (const cat of [null, t.categoria]) {
      const key = `{${anio}-${mes}-${cat ?? 'null'}`
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

  const operaciones = Object.values(agrupado).map((m) => {
    const ticketPromedio = m.montos.length
      ? m.montos.reduce((a, b) => a + b, 0) / m.montos.length
      : 0

    return prisma.metricaMensual.upsert({
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
  })

  await prisma.$transaction(operaciones)
  console.log(`${operaciones.length} métricas mensuales calculadas.`)
}