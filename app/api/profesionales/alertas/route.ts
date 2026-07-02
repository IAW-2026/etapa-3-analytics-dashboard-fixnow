/* Devuelve solo los profesionales con rating menor a 3.5 o más de 10 cancelaciones. 
Es la tabla de alertas de calidad que le toca a Nacho. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const alertas = await prisma.profesionalResumen.findMany({
    where: {
      OR: [
        { calificacionPromedio: { lt: 3.5 } },
        { totalCancelaciones: { gt: 10 } },
      ],
      activo: true,
    },
    orderBy: { calificacionPromedio: "asc" },
  });

  return NextResponse.json(alertas);
}
