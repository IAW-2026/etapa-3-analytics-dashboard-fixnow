/* Devuelve el ranking de profesionales con filtros:
?categoria=ELECTRICIDAD — solo electricistas
?ciudad=Santiago — por ciudad
?limit=5 — top 5
?activos=false — incluye inactivos
La usa Nacho para el Top Profesionales con filtros en Monitoreo. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoria = searchParams.get("categoria");
  const ciudad = searchParams.get("ciudad");
  const soloActivos = searchParams.get("activos") !== "false";
  const limit = parseInt(searchParams.get("limit") ?? "10");

  const profesionales = await prisma.profesionalResumen.findMany({
    where: {
      ...(categoria && { categoria: categoria as any }),
      ...(ciudad && { ciudad }),
      ...(soloActivos && { activo: true }),
    },
    orderBy: { calificacionPromedio: "desc" },
    take: limit,
  });

  return NextResponse.json(profesionales);
}
