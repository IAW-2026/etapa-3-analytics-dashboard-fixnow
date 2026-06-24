/* Devuelve los datos de un año y el año anterior juntos, listos para comparar. 
Por ejemplo con ?anio=2024 devuelve los 12 meses de 2024 y los 12 meses de 2023, 
para que el gráfico pueda mostrar ambas líneas. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const anio = parseInt(
    searchParams.get("anio") ?? String(new Date().getFullYear()),
  );

  // Métricas globales (sin categoría) del año solicitado
  const metricas = await prisma.metricaMensual.findMany({
    where: {
      anio,
      categoria: null,
    },
    orderBy: { mes: "asc" },
  });

  // Métricas del año anterior para comparar
  const metricasAnterior = await prisma.metricaMensual.findMany({
    where: {
      anio: anio - 1,
      categoria: null,
    },
    orderBy: { mes: "asc" },
  });

  return NextResponse.json({
    anioActual: metricas,
    anioAnterior: metricasAnterior,
  });
}
