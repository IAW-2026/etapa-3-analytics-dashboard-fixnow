import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Categoria = "PLOMERIA" | "ELECTRICIDAD" | "GAS";

const CATEGORIA = {
  PLOMERIA: "PLOMERIA",
  ELECTRICIDAD: "ELECTRICIDAD",
  GAS: "GAS",
} as const;

const ESTADO_TRABAJO = {
  COMPLETADO: "COMPLETADO",
  CANCELADO: "CANCELADO",
  EN_PROGRESO: "EN_PROGRESO",
} as const;


type GeminiHistoryMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

type MotivoAgrupado = {
  motivo: string;
  cantidad: number;
  categorias: Record<string, number>;
};

function safeNumber(value: unknown, defaultValue: number, min = 1, max = 50) {
  const n = Number(value);

  if (!Number.isFinite(n)) return defaultValue;

  return Math.min(max, Math.max(min, Math.trunc(n)));
}

function percentChange(actual: number, anterior: number) {
  if (!Number.isFinite(actual) || !Number.isFinite(anterior) || anterior === 0) {
    return 0;
  }

  return Number((((actual - anterior) / anterior) * 100).toFixed(2));
}

function normalizeCategoria(categoria?: string): Categoria | undefined {
  if (!categoria) return undefined;

  const value = categoria
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  if (value.includes("PLOM")) return CATEGORIA.PLOMERIA;
  if (value.includes("GAS")) return CATEGORIA.GAS;
  if (value.includes("ELECT")) return CATEGORIA.ELECTRICIDAD;

  return undefined;
}
function sanitizeHistory(history: unknown): GeminiHistoryMessage[] {
  if (!Array.isArray(history)) return [];

  const validMessages: GeminiHistoryMessage[] = [];

  for (const item of history) {
    if (!item || typeof item !== "object") continue;

    const message = item as {
      role?: unknown;
      parts?: unknown;
    };

    if (message.role !== "user" && message.role !== "model") continue;
    if (!Array.isArray(message.parts)) continue;

    const firstPart = message.parts[0] as { text?: unknown } | undefined;
    const text = firstPart?.text;

    if (typeof text !== "string" || !text.trim()) continue;

    validMessages.push({
      role: message.role,
      parts: [{ text }],
    });
  }

  const pairedHistory: GeminiHistoryMessage[] = [];

  for (let i = 0; i < validMessages.length - 1; i++) {
    const current = validMessages[i];
    const next = validMessages[i + 1];

    if (current.role === "user" && next.role === "model") {
      pairedHistory.push(current, next);
      i++;
    }
  }

  return pairedHistory.slice(-8);
}

// ---------------------------------------------------------------------------
// 1. Tools contra Prisma
// ---------------------------------------------------------------------------

async function getKpisGenerales() {
  const ultimo = await prisma.snapshotKPI.findFirst({
    orderBy: {
      fecha: "desc",
    },
  });

  if (!ultimo) {
    return {
      mensaje: "No hay snapshots KPI cargados.",
    };
  }

  return {
    totalUsuarios: ultimo.totalUsuarios,
    totalClientes: ultimo.totalClientes,
    totalProfesionales: ultimo.totalProfesionales,
    volumenTransacciones: Number(ultimo.volumenTransacciones),
    ingresosNetos: Number(ultimo.ingresosNetos),
    pedidosCompletados: ultimo.pedidosCompletados,
    calificacionPromedio: ultimo.calificacionPromedio,
    totalReseñas: ultimo.totalReseñas,
  };
}

async function getIngresosPorCategoria() {
  const trabajos = await prisma.trabajoResumen.groupBy({
    by: ["categoria"],
    where: {
   estado: ESTADO_TRABAJO.COMPLETADO,
    },
    _sum: {
      monto: true,
      comisionFixNow: true,
    },
    _count: {
      categoria: true,
    },
    orderBy: {
      categoria: "asc",
    },
  });

  return trabajos.map((t: any) => ({
    categoria: t.categoria,
    ingresos: Number(t._sum.monto ?? 0),
    comision: Number(t._sum.comisionFixNow ?? 0),
    trabajos: t._count.categoria,
  }));
}

async function getRankingProfesionales(limit = 5) {
  const safeLimit = safeNumber(limit, 5, 1, 20);

  const profesionales = await prisma.profesionalResumen.findMany({
    orderBy: {
      ingresoGenerado: "desc",
    },
    take: safeLimit,
  });

  return profesionales.map((p: any) => ({
    nombre: p.nombre,
    categoria: p.categoria,
    ciudad: p.ciudad,
    totalTrabajos: p.totalTrabajos,
    totalCancelaciones: p.totalCancelaciones,
    ingresoGenerado: Number(p.ingresoGenerado),
    calificacionPromedio: p.calificacionPromedio,
    activo: p.activo,
  }));
}



async function getTasaCancelacion(categoria?: string) {
  const categoriaNormalizada = normalizeCategoria(categoria);

  const whereBase: any = categoriaNormalizada
    ? { categoria: categoriaNormalizada }
    : {};

  const [completados, cancelados] = await Promise.all([
    prisma.trabajoResumen.count({
      where: {
        ...whereBase,
        estado: ESTADO_TRABAJO.COMPLETADO,
      },
    }),
    prisma.trabajoResumen.count({
      where: {
        ...whereBase,
        estado: ESTADO_TRABAJO.CANCELADO,
      },
    }),
  ]);

  const total = completados + cancelados;

  return {
    categoria: categoriaNormalizada ?? "TODAS",
    completados,
    cancelados,
    total,
    tasaCancelacion: total > 0 ? cancelados / total : 0,
    tasaCancelacionPorcentaje:
      total > 0 ? Number(((cancelados / total) * 100).toFixed(2)) : 0,
  };
}

async function getMotivosCancelacion(limit = 5) {
  const safeLimit = safeNumber(limit, 5, 1, 20);

  const cancelaciones = await prisma.motivoCancelacion.findMany({
    select: {
      motivo: true,
      categoria: true,
      fecha: true,
    },
    orderBy: {
      fecha: "desc",
    },
  });

  if (cancelaciones.length === 0) {
    return {
      totalCancelaciones: 0,
      motivoMasFrecuente: null,
      motivos: [],
      mensaje: "No hay motivos de cancelación registrados.",
    };
  }

  const contador = new Map<string, MotivoAgrupado>();

  for (const c of cancelaciones) {
    const motivo = c.motivo?.trim() || "Sin motivo especificado";
    const categoriaKey = String(c.categoria);

    const actual: MotivoAgrupado = contador.get(motivo) ?? {
      motivo,
      cantidad: 0,
      categorias: {
        PLOMERIA: 0,
        ELECTRICIDAD: 0,
        GAS: 0,
      },
    };

    actual.cantidad += 1;
    actual.categorias[categoriaKey] =
      (actual.categorias[categoriaKey] ?? 0) + 1;

    contador.set(motivo, actual);
  }

  const motivos = Array.from(contador.values())
    .sort((a: MotivoAgrupado, b: MotivoAgrupado) => b.cantidad - a.cantidad)
    .slice(0, safeLimit);

  return {
    totalCancelaciones: cancelaciones.length,
    motivoMasFrecuente: motivos[0] ?? null,
    motivos,
  };
}

async function getCancelacionesPorCategoria() {
  const cancelaciones = await prisma.motivoCancelacion.findMany({
    select: {
      categoria: true,
    },
  });

  const conteo: Record<string, number> = {
    PLOMERIA: 0,
    ELECTRICIDAD: 0,
    GAS: 0,
  };

  for (const c of cancelaciones) {
    const categoriaKey = String(c.categoria);
    conteo[categoriaKey] = (conteo[categoriaKey] ?? 0) + 1;
  }

  const categorias = Object.entries(conteo)
    .map(([categoria, cantidad]) => ({
      categoria,
      cantidad,
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return {
    totalCancelaciones: cancelaciones.length,
    categoriaConMasCancelaciones: categorias[0] ?? null,
    categorias,
  };
}

async function getEvolucionMensual(meses = 6) {
  const safeMeses = safeNumber(meses, 6, 1, 24);

  const datos = await prisma.metricaMensual.findMany({
    where: {
      categoria: null,
    },
    orderBy: [{ anio: "desc" }, { mes: "desc" }],
    take: safeMeses,
  });

  return datos.reverse().map((m: any) => ({
    periodo: `${m.mes}/${m.anio}`,
    trabajosCompletados: m.trabajosCompletados,
    trabajosCancelados: m.trabajosCancelados,
    ingresosTotal: Number(m.ingresosTotal),
    clientesNuevos: m.clientesNuevos,
    ticketPromedio: Number(m.ticketPromedio),
  }));
}

// ---------------------------------------------------------------------------
// 2. Tool avanzada
// ---------------------------------------------------------------------------

async function getDiagnosticoAnalytics() {
  const [
    metricasGlobales,
    metricasCategorias,
    profesionales,
    motivosCancelacion,
  ] = await Promise.all([
    prisma.metricaMensual.findMany({
      where: {
        categoria: null,
      },
      orderBy: [{ anio: "asc" }, { mes: "asc" }],
    }),

    prisma.metricaMensual.findMany({
      where: {
        NOT: {
          categoria: null,
        },
      },
      orderBy: [{ anio: "asc" }, { mes: "asc" }],
    }),

    prisma.profesionalResumen.findMany({
      orderBy: [
        {
          totalCancelaciones: "desc",
        },
        {
          calificacionPromedio: "asc",
        },
      ],
      take: 50,
    }),

    prisma.motivoCancelacion.findMany({
      select: {
        motivo: true,
        categoria: true,
        fecha: true,
      },
      orderBy: {
        fecha: "desc",
      },
    }),
  ]);

  const actual = metricasGlobales.at(-1);
  const anterior = metricasGlobales.at(-2);

  if (!actual || !anterior) {
    return {
      mensaje:
        "No hay suficientes métricas mensuales globales para comparar períodos. Se necesitan al menos dos meses cargados.",
    };
  }

  const periodoActual = `${actual.mes}/${actual.anio}`;
  const periodoAnterior = `${anterior.mes}/${anterior.anio}`;

  const ingresosActual = Number(actual.ingresosTotal);
  const ingresosAnterior = Number(anterior.ingresosTotal);

  const variacionIngresos = percentChange(ingresosActual, ingresosAnterior);
  const variacionCompletados = percentChange(
    actual.trabajosCompletados,
    anterior.trabajosCompletados,
  );
  const variacionCancelados = percentChange(
    actual.trabajosCancelados,
    anterior.trabajosCancelados,
  );
  const variacionClientes = percentChange(
    actual.clientesNuevos,
    anterior.clientesNuevos,
  );
  const variacionTicketPromedio = percentChange(
    Number(actual.ticketPromedio),
    Number(anterior.ticketPromedio),
  );

  const anomalias: string[] = [];

  if (variacionCancelados >= 25) {
    anomalias.push(
      `Las cancelaciones subieron ${variacionCancelados}% respecto al período anterior.`,
    );
  }

  if (variacionIngresos <= -15) {
    anomalias.push(
      `Los ingresos bajaron ${Math.abs(variacionIngresos)}% respecto al período anterior.`,
    );
  }

  if (variacionCompletados <= -20) {
    anomalias.push(
      `Los trabajos completados bajaron ${Math.abs(variacionCompletados)}%.`,
    );
  }

  if (variacionClientes <= -20) {
    anomalias.push(
      `Los clientes nuevos bajaron ${Math.abs(variacionClientes)}%.`,
    );
  }

  if (variacionTicketPromedio <= -15) {
    anomalias.push(
      `El ticket promedio bajó ${Math.abs(variacionTicketPromedio)}%.`,
    );
  }

  const metricasCategoriasActual = metricasCategorias.filter(
    (m: any) => m.anio === actual.anio && m.mes === actual.mes,
  );

  const metricasCategoriasAnterior = metricasCategorias.filter(
    (m: any) => m.anio === anterior.anio && m.mes === anterior.mes,
  );

  const categoriasAnalizadas = metricasCategoriasActual.map((m: any) => {
    const previa = metricasCategoriasAnterior.find(
      (x: any) => x.categoria === m.categoria,
    );

    const totalTrabajos = m.trabajosCompletados + m.trabajosCancelados;
    const tasaCancelacion =
      totalTrabajos > 0
        ? Number(((m.trabajosCancelados / totalTrabajos) * 100).toFixed(2))
        : 0;

    const ingresosCategoria = Number(m.ingresosTotal);
    const ingresosPrevios = previa ? Number(previa.ingresosTotal) : 0;

    return {
      categoria: m.categoria,
      ingresosTotal: ingresosCategoria,
      trabajosCompletados: m.trabajosCompletados,
      trabajosCancelados: m.trabajosCancelados,
      totalTrabajos,
      tasaCancelacion,
      ticketPromedio: Number(m.ticketPromedio),
      variacionIngresosPorcentaje: previa
        ? percentChange(ingresosCategoria, ingresosPrevios)
        : 0,
      variacionCanceladosPorcentaje: previa
        ? percentChange(m.trabajosCancelados, previa.trabajosCancelados)
        : 0,
      variacionCompletadosPorcentaje: previa
        ? percentChange(m.trabajosCompletados, previa.trabajosCompletados)
        : 0,
    };
  });

  const categoriaProblematica =
    [...categoriasAnalizadas].sort((a: any, b: any) => {
      if (b.tasaCancelacion !== a.tasaCancelacion) {
        return b.tasaCancelacion - a.tasaCancelacion;
      }

      return b.trabajosCancelados - a.trabajosCancelados;
    })[0] ?? null;

  const contadorMotivos = new Map<string, MotivoAgrupado>();

  for (const item of motivosCancelacion) {
    const motivo = item.motivo?.trim() || "Sin motivo especificado";
    const categoriaKey = String(item.categoria);

    const actualMotivo: MotivoAgrupado = contadorMotivos.get(motivo) ?? {
      motivo,
      cantidad: 0,
      categorias: {
        PLOMERIA: 0,
        ELECTRICIDAD: 0,
        GAS: 0,
      },
    };

    actualMotivo.cantidad += 1;
    actualMotivo.categorias[categoriaKey] =
      (actualMotivo.categorias[categoriaKey] ?? 0) + 1;

    contadorMotivos.set(motivo, actualMotivo);
  }

  const rankingMotivosCancelacion = Array.from(contadorMotivos.values())
    .sort((a: MotivoAgrupado, b: MotivoAgrupado) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const profesionalesConRiesgo = profesionales
    .map((p: any) => {
      const totalEventos = p.totalTrabajos + p.totalCancelaciones;
      const tasaCancelacion =
        totalEventos > 0
          ? Number(((p.totalCancelaciones / totalEventos) * 100).toFixed(2))
          : 0;

      const riesgo =
        tasaCancelacion >= 30 || p.calificacionPromedio < 3.8
          ? "ALTO"
          : tasaCancelacion >= 15 || p.calificacionPromedio < 4.2
            ? "MEDIO"
            : "BAJO";

      return {
        nombre: p.nombre,
        categoria: p.categoria,
        ciudad: p.ciudad,
        totalTrabajos: p.totalTrabajos,
        totalCancelaciones: p.totalCancelaciones,
        tasaCancelacion,
        calificacionPromedio: p.calificacionPromedio,
        ingresoGenerado: Number(p.ingresoGenerado),
        activo: p.activo,
        riesgo,
      };
    })
    .filter((p: any) => p.totalCancelaciones > 0)
    .sort((a: any, b: any) => {
      if (b.tasaCancelacion !== a.tasaCancelacion) {
        return b.tasaCancelacion - a.tasaCancelacion;
      }

      return a.calificacionPromedio - b.calificacionPromedio;
    })
    .slice(0, 5);

  const profesionalesPorCategoriaProblematica = categoriaProblematica
    ? profesionalesConRiesgo.filter(
        (p: any) => p.categoria === categoriaProblematica.categoria,
      )
    : [];

  const causasProbables: string[] = [];
  const recomendaciones: string[] = [];

  if (categoriaProblematica && categoriaProblematica.tasaCancelacion >= 20) {
    causasProbables.push(
      `La categoría ${categoriaProblematica.categoria} tiene la tasa de cancelación más alta: ${categoriaProblematica.tasaCancelacion}%.`,
    );

    recomendaciones.push(
      `Revisar disponibilidad, tiempos de respuesta y asignación de profesionales en ${categoriaProblematica.categoria}.`,
    );
  }

  if (rankingMotivosCancelacion[0]) {
    causasProbables.push(
      `El motivo de cancelación más repetido es "${rankingMotivosCancelacion[0].motivo}", con ${rankingMotivosCancelacion[0].cantidad} casos.`,
    );

    recomendaciones.push(
      `Crear una acción específica para reducir cancelaciones por "${rankingMotivosCancelacion[0].motivo}".`,
    );
  }

  if (profesionalesConRiesgo.length > 0) {
    causasProbables.push(
      "Hay profesionales con tasas de cancelación elevadas o calificaciones bajas que podrían estar afectando la experiencia.",
    );

    recomendaciones.push(
      "Auditar los profesionales con más cancelaciones, revisar sus tiempos de respuesta y considerar reasignación de trabajos.",
    );
  }

  if (variacionIngresos < 0 && variacionCancelados > 0) {
    causasProbables.push(
      "La baja de ingresos coincide con una suba de cancelaciones.",
    );

    recomendaciones.push(
      "Priorizar la reducción de cancelaciones antes de invertir en más adquisición de clientes.",
    );
  }

  if (variacionClientes < 0 && variacionCompletados < 0) {
    causasProbables.push(
      "La caída de clientes nuevos coincide con una baja en trabajos completados.",
    );

    recomendaciones.push(
      "Revisar embudo de adquisición, conversión de solicitudes y disponibilidad de profesionales.",
    );
  }

  if (anomalias.length === 0) {
    recomendaciones.push(
      "No se detectan anomalías fuertes con los umbrales actuales. Conviene monitorear cancelaciones, ingresos y ticket promedio en los próximos períodos.",
    );
  }

  return {
    periodoActual,
    periodoAnterior,

    comparacionMensual: {
      ingresos: {
        actual: ingresosActual,
        anterior: ingresosAnterior,
        variacionPorcentaje: variacionIngresos,
      },
      trabajosCompletados: {
        actual: actual.trabajosCompletados,
        anterior: anterior.trabajosCompletados,
        variacionPorcentaje: variacionCompletados,
      },
      trabajosCancelados: {
        actual: actual.trabajosCancelados,
        anterior: anterior.trabajosCancelados,
        variacionPorcentaje: variacionCancelados,
      },
      clientesNuevos: {
        actual: actual.clientesNuevos,
        anterior: anterior.clientesNuevos,
        variacionPorcentaje: variacionClientes,
      },
      ticketPromedio: {
        actual: Number(actual.ticketPromedio),
        anterior: Number(anterior.ticketPromedio),
        variacionPorcentaje: variacionTicketPromedio,
      },
    },

    anomalias,
    categoriasAnalizadas,
    categoriaProblematica,
    rankingMotivosCancelacion,
    profesionalesConRiesgo,
    profesionalesPorCategoriaProblematica,

    notaSobreCruceProfesionales:
      "El cruce con profesionales se realiza usando ProfesionalResumen.totalCancelaciones, categoría y calificación. El schema actual no permite vincular cada motivo de cancelación con un profesional específico.",

    causasProbables,
    recomendaciones,
  };
}

// ---------------------------------------------------------------------------
// 3. Tools para Gemini
// ---------------------------------------------------------------------------

const tools: any[] = [
  {
    functionDeclarations: [
      {
        name: "getKpisGenerales",
        description:
          "Obtiene KPIs generales de la plataforma: usuarios, volumen transaccional, ingresos netos, pedidos completados, reseñas y calificación promedio.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "getIngresosPorCategoria",
        description:
          "Obtiene ingresos, comisión y cantidad de trabajos completados agrupados por categoría.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "getRankingProfesionales",
        description:
          "Obtiene el ranking de profesionales ordenados por ingreso generado.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: {
              type: Type.NUMBER,
              description: "Cantidad de profesionales a devolver. Default 5.",
            },
          },
        },
      },
      {
        name: "getTasaCancelacion",
        description:
          "Obtiene cantidad de trabajos completados, cancelados y tasa de cancelación. Puede filtrarse por categoría.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            categoria: {
              type: Type.STRING,
              description:
                "Categoría opcional. Valores posibles: PLOMERIA, GAS o ELECTRICIDAD.",
            },
          },
        },
      },
      {
        name: "getMotivosCancelacion",
        description:
          "Obtiene los motivos de cancelación más frecuentes, ordenados por cantidad.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            limit: {
              type: Type.NUMBER,
              description: "Cantidad de motivos a devolver. Default 5.",
            },
          },
        },
      },
      {
        name: "getCancelacionesPorCategoria",
        description:
          "Obtiene la cantidad de cancelaciones agrupadas por categoría.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
      {
        name: "getEvolucionMensual",
        description:
          "Obtiene evolución mensual de ingresos, trabajos completados, trabajos cancelados, clientes nuevos y ticket promedio.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            meses: {
              type: Type.NUMBER,
              description: "Cantidad de meses hacia atrás. Default 6.",
            },
          },
        },
      },
      {
        name: "getDiagnosticoAnalytics",
        description:
          "Genera un diagnóstico avanzado de Analytics: compara períodos automáticamente, detecta anomalías, identifica categoría problemática, analiza motivos de cancelación, cruza cancelaciones con profesionales, propone causas probables y recomendaciones accionables.",
        parameters: {
          type: Type.OBJECT,
          properties: {},
        },
      },
    ],
  },
];

const toolImplementations: Record<string, (args?: any) => Promise<any>> = {
  getKpisGenerales: () => getKpisGenerales(),
  getIngresosPorCategoria: () => getIngresosPorCategoria(),
  getRankingProfesionales: (args) => getRankingProfesionales(args?.limit),
  getTasaCancelacion: (args) => getTasaCancelacion(args?.categoria),
  getMotivosCancelacion: (args) => getMotivosCancelacion(args?.limit),
  getCancelacionesPorCategoria: () => getCancelacionesPorCategoria(),
  getEvolucionMensual: (args) => getEvolucionMensual(args?.meses),
  getDiagnosticoAnalytics: () => getDiagnosticoAnalytics(),
};

// ---------------------------------------------------------------------------
// 4. Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Falta GEMINI_API_KEY en el .env",
        },
        { status: 500 },
      );
    }

    let body: {
      message?: unknown;
      history?: unknown;
    };

    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "Body inválido. Se esperaba JSON.",
        },
        { status: 400 },
      );
    }

    const { message, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        {
          error: "Mensaje inválido.",
        },
        { status: 400 },
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const systemInstruction =
      "Sos el asistente inteligente de Analytics de FixNow. " +
      "Respondés preguntas de un administrador sobre métricas operativas y financieras de la plataforma. " +
      "No solo respondés números: también detectás anomalías, comparás períodos, encontrás categorías problemáticas, cruzás cancelaciones con profesionales y das recomendaciones accionables. " +
      "Usá siempre las funciones disponibles para obtener datos reales antes de responder. Nunca inventes cifras. " +
      "Para preguntas de diagnóstico, problemas, causas, anomalías, recomendaciones, categoría problemática o profesionales con riesgo, usá getDiagnosticoAnalytics. " +
      "Si una pregunta requiere datos que no podés obtener con las funciones disponibles, decilo explícitamente en vez de estimar. " +
      "Respondé siempre en español, de forma clara, ejecutiva y concisa. " +
      "Cuando detectes un problema, explicá la posible causa y proponé una acción concreta.";

    const contents: any[] = [
      ...sanitizeHistory(history),
      {
        role: "user",
        parts: [{ text: message }],
      },
    ];

    let loops = 0;

    while (loops < 5) {
      loops++;

      const result: any = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite",
        contents: contents as any,
        config: {
          systemInstruction,
          tools: tools as any,
        },
      } as any);

      const calls: any[] = Array.isArray(result.functionCalls)
        ? result.functionCalls
        : [];

      if (calls.length === 0) {
        return NextResponse.json({
          text: result.text || "No pude generar una respuesta con esos datos.",
        });
      }

      const modelContent = result.candidates?.[0]?.content;

      if (modelContent) {
        contents.push(modelContent);
      } else {
        contents.push({
          role: "model",
          parts: calls.map((call: any) => ({
            functionCall: call,
          })),
        });
      }

      const functionResponses = await Promise.all(
        calls.map(async (call: any) => {
          console.log("Gemini pidió ejecutar tool:", call.name, call.args);

          const toolName = String(call.name ?? "");
          const impl = toolImplementations[toolName];

          let output: any;

          try {
            output = impl
              ? await impl(call.args ?? {})
              : { error: `Función no encontrada: ${toolName}` };

            console.log("Output de tool:", toolName, output);
          } catch (toolError) {
            console.error(`Error ejecutando tool ${toolName}:`, toolError);

            output = {
              error: `Error ejecutando ${toolName}`,
              details:
                toolError instanceof Error
                  ? toolError.message
                  : String(toolError),
            };
          }

          return {
            name: toolName,
            response: {
              result: output,
            },
          };
        }),
      );

      contents.push({
        role: "user",
        parts: functionResponses.map((functionResponse: any) => ({
          functionResponse,
        })),
      });
    }

    return NextResponse.json(
      {
        error: "Gemini entró en demasiadas llamadas a funciones.",
      },
      { status: 500 },
    );
   } catch (error: any) {
    console.error("Error en /api/chat:", error);

    const rawError =
      error?.message ||
      error?.status ||
      error?.name ||
      JSON.stringify(error, null, 2) ||
      String(error);

    const errorText = String(rawError).toLowerCase();

    if (
      errorText.includes("429") ||
      errorText.includes("quota") ||
      errorText.includes("resource_exhausted") ||
      errorText.includes("prepayment credits") ||
      errorText.includes("rate limit") ||
      errorText.includes("exceeded your current quota")
    ) {
      return NextResponse.json(
        {
          error: "Alcanzaste el límite de Gemini.",
          details:
            "Alcanzaste el límite de consultas de Gemini. Probá más tarde o usá otra API key/modelo con más cuota.",
        },
        { status: 429 },
      );
    }

    if (
      errorText.includes("api key not valid") ||
      errorText.includes("api_key_invalid") ||
      errorText.includes("invalid api key")
    ) {
      return NextResponse.json(
        {
          error: "API key inválida.",
          details:
            "La API key de Gemini no es válida. Revisá el .env o generá una nueva key en Google AI Studio.",
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      {
        error: "Error interno del asistente de Analytics",
        details:
          "No pude consultar el asistente en este momento. Revisá la terminal para ver el error real.",
      },
      { status: 500 },
    );
  }
}