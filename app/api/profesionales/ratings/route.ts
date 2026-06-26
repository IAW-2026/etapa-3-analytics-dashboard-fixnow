/* Devuelve la distribución de calificaciones (1-5 estrellas) calculada
   desde TrabajoResumen.calificacion. La usa Nacho para el histograma
   de ratings en la vista Monitoreo. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const trabajos = await prisma.trabajoResumen.findMany({
    where: { calificacion: { not: null } },
    select: { calificacion: true },
  });

  const conteo: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const t of trabajos) {
    const estrella = Math.round(t.calificacion!) as 1 | 2 | 3 | 4 | 5;
    if (estrella >= 1 && estrella <= 5) conteo[estrella]++;
  }

  const data = [1, 2, 3, 4, 5].map((estrella) => ({
    estrellas: estrella,
    cantidad: conteo[estrella],
  }));

  return NextResponse.json(data);
}
