// Archivo encargado de generar las 
// actualizaciones periódicas de las base de datos
import { NextResponse } from 'next/server';
import { syncSnapshot } from '@/app/services/sync/syncSnapshot';
import { syncTrabajos } from '@/app/services/sync/syncTrabajos';
import { syncProfesionales } from '@/app/services/sync/syncProfesionales';
// import { calcularMetricasMensuales } from '@/app/services/sync/metricasMensuales';

export async function GET(request: Request) {
  // 1. Proteger el endpoint
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('No autorizado', { status: 401 });
  }

  const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

  try {
    // 2. ORQUESTACIÓN: El orden es estricto e importa
    
    // Paso 1: Snapshot independiente
    await syncSnapshot(fechaHoy);

    // Paso 2: Trabajos
    await syncTrabajos();

    // Paso 3: Profesionales
    await syncProfesionales();

    // Paso 4: Métricas locales
    // await calcularMetricasMensuales();

    return NextResponse.json({ 
      success: true, 
      message: 'Sincronización completada exitosamente' 
    });

  } catch (error: any) {
    console.error('❌ Error fatal en el Cron:', error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}