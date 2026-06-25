/* Devuelve la lista de ciudades únicas de profesionales activos.
   La usa Nacho para poblar el filtro de ciudad en Top Profesionales. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const rows = await prisma.profesionalResumen.findMany({
    where: { activo: true },
    select: { ciudad: true },
    distinct: ["ciudad"],
    orderBy: { ciudad: "asc" },
  });

  return NextResponse.json(rows.map((r) => r.ciudad));
}