/* Devuelve el snapshot más reciente de métricas globales. 
Es lo que alimenta las 4 cards grandes del dashboard (usuarios totales, volumen de transacciones, ingresos, satisfacción). 
Lautaro la llama una vez por día para guardar el estado del sistema. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const snapshot = await prisma.snapshotKPI.findFirst({
    orderBy: { fecha: "desc" },
  });

  if (!snapshot) {
    return NextResponse.json({ error: "Sin datos" }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
