/* Devuelve el listado de trabajos con filtros opcionales:
?categoria=PLOMERIA — solo trabajos de plomería
?estado=CANCELADO — solo cancelados
?desde=2024-01-01&hasta=2024-06-30 — rango de fechas
La usa Cata para los gráficos de Análisis — tasa de éxito, distribución por categoría, comparativa mensual. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const estado = searchParams.get("estado");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  const trabajos = await prisma.trabajoResumen.findMany({
    where: {
      ...(categoria && { categoria: categoria as any }),
      ...(estado && { estado: estado as any }),
      ...(desde || hasta
        ? {
            fechaCreacion: {
              ...(desde && { gte: new Date(desde) }),
              ...(hasta && { lte: new Date(hasta) }),
            },
          }
        : {}),
    },
    include: {
      motivoCancelacion: true,
    },
    orderBy: { fechaCreacion: "desc" },
  });

  return NextResponse.json(trabajos);
}
