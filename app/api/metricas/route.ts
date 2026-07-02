/* Devuelve métricas mensuales agregadas con filtros:
?anio=2024 — todos los meses de 2024
?categoria=GAS — métricas solo de gas
La usás para el gráfico de comparativa mes a mes (trabajos, cancelaciones, clientes nuevos, ingresos por mes). */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const anio = searchParams.get("anio");

  const metricas = await prisma.metricaMensual.findMany({
    where: {
      ...(categoria && { categoria: categoria as any }),
      ...(anio && { anio: parseInt(anio) }),
    },
    orderBy: [{ anio: "asc" }, { mes: "asc" }],
  });

  return NextResponse.json(metricas);
}
