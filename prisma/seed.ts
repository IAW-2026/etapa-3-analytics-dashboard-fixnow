import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});
const prisma = new PrismaClient({ adapter });

const meses = [
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

async function main() {
  console.log("🌱 Iniciando seed...");

  // Limpiar datos anteriores
  await prisma.motivoCancelacion.deleteMany();
  await prisma.trabajoResumen.deleteMany();
  await prisma.metricaMensual.deleteMany();
  await prisma.snapshotKPI.deleteMany();
  await prisma.profesionalResumen.deleteMany();

  // ─── 1. Snapshot KPI ───────────────────────────────────────
  await prisma.snapshotKPI.create({
    data: {
      fecha: new Date(),
      totalUsuarios: 5432,
      totalClientes: 4820,
      totalProfesionales: 612,
      volumenTransacciones: 184300000,
      ingresosNetos: 27700000,
      pedidosCompletados: 13984,
      calificacionPromedio: 4.7,
      totalReseñas: 11240,
    },
  });

  // ─── 2. Métricas mensuales (últimos 12 meses) ──────────────
  const metricas = [
    {
      mes: 1,
      completados: 890,
      cancelados: 67,
      ingresos: 18200000,
      nuevos: 142,
      ticket: 20450,
    },
    {
      mes: 2,
      completados: 920,
      cancelados: 71,
      ingresos: 19100000,
      nuevos: 158,
      ticket: 20760,
    },
    {
      mes: 3,
      completados: 1050,
      cancelados: 82,
      ingresos: 21800000,
      nuevos: 201,
      ticket: 20762,
    },
    {
      mes: 4,
      completados: 980,
      cancelados: 65,
      ingresos: 20300000,
      nuevos: 175,
      ticket: 20714,
    },
    {
      mes: 5,
      completados: 1120,
      cancelados: 88,
      ingresos: 23100000,
      nuevos: 223,
      ticket: 20625,
    },
    {
      mes: 6,
      completados: 1080,
      cancelados: 79,
      ingresos: 22400000,
      nuevos: 198,
      ticket: 20741,
    },
    {
      mes: 7,
      completados: 1150,
      cancelados: 91,
      ingresos: 18500000,
      nuevos: 210,
      ticket: 16087,
    },
    {
      mes: 8,
      completados: 1200,
      cancelados: 95,
      ingresos: 21300000,
      nuevos: 234,
      ticket: 17750,
    },
    {
      mes: 9,
      completados: 1180,
      cancelados: 87,
      ingresos: 19800000,
      nuevos: 219,
      ticket: 16780,
    },
    {
      mes: 10,
      completados: 1320,
      cancelados: 102,
      ingresos: 24500000,
      nuevos: 267,
      ticket: 18560,
    },
    {
      mes: 11,
      completados: 1380,
      cancelados: 98,
      ingresos: 26800000,
      nuevos: 289,
      ticket: 19420,
    },
    {
      mes: 12,
      completados: 1450,
      cancelados: 108,
      ingresos: 28200000,
      nuevos: 312,
      ticket: 19448,
    },
  ];

  for (const m of metricas) {
    // Global (sin categoría)
    await prisma.metricaMensual.create({
      data: {
        anio: 2024,
        mes: m.mes,
        categoria: null,
        trabajosCompletados: m.completados,
        trabajosCancelados: m.cancelados,
        ingresosTotal: m.ingresos,
        clientesNuevos: m.nuevos,
        ticketPromedio: m.ticket,
      },
    });

    // Por categoría
    await prisma.metricaMensual.createMany({
      data: [
        {
          anio: 2024,
          mes: m.mes,
          categoria: "PLOMERIA",
          trabajosCompletados: Math.round(m.completados * 0.446),
          trabajosCancelados: Math.round(m.cancelados * 0.4),
          ingresosTotal: Math.round(m.ingresos * 0.38),
          clientesNuevos: Math.round(m.nuevos * 0.44),
          ticketPromedio: Math.round(m.ticket * 0.85),
        },
        {
          anio: 2024,
          mes: m.mes,
          categoria: "ELECTRICIDAD",
          trabajosCompletados: Math.round(m.completados * 0.326),
          trabajosCancelados: Math.round(m.cancelados * 0.35),
          ingresosTotal: Math.round(m.ingresos * 0.37),
          clientesNuevos: Math.round(m.nuevos * 0.33),
          ticketPromedio: Math.round(m.ticket * 1.13),
        },
        {
          anio: 2024,
          mes: m.mes,
          categoria: "GAS",
          trabajosCompletados: Math.round(m.completados * 0.227),
          trabajosCancelados: Math.round(m.cancelados * 0.25),
          ingresosTotal: Math.round(m.ingresos * 0.25),
          clientesNuevos: Math.round(m.nuevos * 0.23),
          ticketPromedio: Math.round(m.ticket * 1.1),
        },
      ],
    });
  }

  // ─── 3. Trabajos con motivos de cancelación ────────────────
  const motivosPorCategoria = {
    PLOMERIA: [
      "Cliente canceló",
      "Sin profesionales disponibles",
      "Precio muy alto",
      "Resolvió solo",
    ],
    ELECTRICIDAD: [
      "Cliente canceló",
      "Tiempo de espera excesivo",
      "Precio muy alto",
      "Error en solicitud",
    ],
    GAS: [
      "Cliente canceló",
      "Sin profesionales disponibles",
      "Requiere revisión técnica previa",
      "Precio muy alto",
    ],
  };

  const categorias = ["PLOMERIA", "ELECTRICIDAD", "GAS"] as const;
  const ciudades = [
    "Santiago",
    "Providencia",
    "Las Condes",
    "Maipú",
    "Ñuñoa",
    "La Florida",
  ];

  for (let i = 0; i < 200; i++) {
    const categoria = categorias[Math.floor(Math.random() * 3)];
    const esCancelado = Math.random() < 0.08; // ~8% cancelación
    const fechaCreacion = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1,
    );

    const trabajo = await prisma.trabajoResumen.create({
      data: {
        trabajoExternoId: `ext-${Date.now()}-${i}`,
        categoria,
        estado: esCancelado ? "CANCELADO" : "COMPLETADO",
        monto: esCancelado ? null : Math.round(Math.random() * 80000 + 15000),
        comisionFixNow: esCancelado
          ? null
          : Math.round(Math.random() * 12000 + 2000),
        calificacion: esCancelado
          ? null
          : Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
        duracionMinutos: esCancelado
          ? null
          : Math.floor(Math.random() * 120 + 30),
        fechaCreacion,
        fechaFinalizacion: esCancelado
          ? null
          : new Date(fechaCreacion.getTime() + Math.random() * 3600000 * 3),
        ciudad: ciudades[Math.floor(Math.random() * ciudades.length)],
      },
    });

    if (esCancelado) {
      const motivos = motivosPorCategoria[categoria];
      await prisma.motivoCancelacion.create({
        data: {
          trabajoResumenId: trabajo.id,
          motivo: motivos[Math.floor(Math.random() * motivos.length)],
          categoria,
          fecha: fechaCreacion,
        },
      });
    }
  }

  // ─── 4. Profesionales ──────────────────────────────────────
  const profesionales = [
    {
      nombre: "Rodrigo Salas",
      categoria: "PLOMERIA",
      ciudad: "Santiago",
      rating: 4.98,
      trabajos: 342,
      cancelaciones: 2,
      ingreso: 15400000,
    },
    {
      nombre: "Valentina Rojas",
      categoria: "ELECTRICIDAD",
      ciudad: "Providencia",
      rating: 4.96,
      trabajos: 318,
      cancelaciones: 3,
      ingreso: 16200000,
    },
    {
      nombre: "Matías Fuentes",
      categoria: "GAS",
      ciudad: "Las Condes",
      rating: 4.94,
      trabajos: 287,
      cancelaciones: 1,
      ingreso: 13800000,
    },
    {
      nombre: "Camila Herrera",
      categoria: "PLOMERIA",
      ciudad: "Ñuñoa",
      rating: 4.92,
      trabajos: 301,
      cancelaciones: 4,
      ingreso: 14100000,
    },
    {
      nombre: "Diego Morales",
      categoria: "ELECTRICIDAD",
      ciudad: "Maipú",
      rating: 4.9,
      trabajos: 264,
      cancelaciones: 2,
      ingreso: 13200000,
    },
    {
      nombre: "Ana Jiménez",
      categoria: "GAS",
      ciudad: "La Florida",
      rating: 4.85,
      trabajos: 198,
      cancelaciones: 5,
      ingreso: 9800000,
    },
    {
      nombre: "Carlos Pinto",
      categoria: "PLOMERIA",
      ciudad: "Santiago",
      rating: 4.8,
      trabajos: 231,
      cancelaciones: 8,
      ingreso: 11200000,
    },
    {
      nombre: "Sofía Vega",
      categoria: "ELECTRICIDAD",
      ciudad: "Las Condes",
      rating: 3.4,
      trabajos: 89,
      cancelaciones: 18,
      ingreso: 4100000,
    },
    {
      nombre: "Luis Campos",
      categoria: "GAS",
      ciudad: "Maipú",
      rating: 3.2,
      trabajos: 67,
      cancelaciones: 22,
      ingreso: 3200000,
    },
  ];

  for (const p of profesionales) {
    await prisma.profesionalResumen.create({
      data: {
        profesionalExternoId: `prof-${p.nombre.toLowerCase().replace(" ", "-")}`,
        nombre: p.nombre,
        categoria: p.categoria as any,
        ciudad: p.ciudad,
        calificacionPromedio: p.rating,
        totalTrabajos: p.trabajos,
        totalCancelaciones: p.cancelaciones,
        ingresoGenerado: p.ingreso,
        ultimaActividad: new Date(),
        activo: true,
      },
    });
  }

  console.log("✅ Seed completado");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
