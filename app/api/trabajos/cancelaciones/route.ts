/* Devuelve los motivos de cancelación agrupados y contados. Por ejemplo:
json[
  { "motivo": "Cliente canceló", "categoria": "PLOMERIA", "_count": 45 },
  { "motivo": "Sin profesionales", "categoria": "GAS", "_count": 12 }
]
Es específica para el gráfico de análisis de cancelaciones que le tocó a Cata. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const motivos = await prisma.motivoCancelacion.groupBy({
    by: ["motivo", "categoria"],
    _count: { motivo: true },
    orderBy: { _count: { motivo: "desc" } },
  });

  return NextResponse.json(motivos);
}
