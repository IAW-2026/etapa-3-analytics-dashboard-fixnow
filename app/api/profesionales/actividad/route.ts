/* Agrupa profesionales por bucket de actividad según ultimaActividad.
   La usa el componente ActividadProfesionales en la vista Monitoreo. */

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const profesionales = await prisma.profesionalResumen.findMany({
    select: { ultimaActividad: true },
  });

  const now = Date.now();
  const buckets = { d30: 0, d60: 0, d90: 0, inactivo: 0 };

  for (const { ultimaActividad } of profesionales) {
    const days = (now - ultimaActividad.getTime()) / (1000 * 60 * 60 * 24);
    if (days <= 30) buckets.d30++;
    else if (days <= 60) buckets.d60++;
    else if (days <= 90) buckets.d90++;
    else buckets.inactivo++;
  }

  return NextResponse.json([
    { bucket: "Últimos 30 días", cantidad: buckets.d30,      fill: "#22c55e" },
    { bucket: "30–60 días",      cantidad: buckets.d60,      fill: "#eab308" },
    { bucket: "60–90 días",      cantidad: buckets.d90,      fill: "#f97316" },
    { bucket: "+90 días",        cantidad: buckets.inactivo, fill: "var(--destructive)" },
  ]);
}
