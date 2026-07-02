// Server action para sincronizar los datos de las distintas apps
"use server"

import { syncSnapshot } from '@/app/services/sync/syncSnapshot';
import { syncTrabajos } from '@/app/services/sync/syncTrabajos';
import { syncProfesionales } from '@/app/services/sync/syncProfesionales';
import { calcularMetricasMensuales } from '@/app/services/sync/calcularMetricasMensuales';

export async function sincronizarDatos() {
  const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

  try {
    
    // Paso 1: Snapshot independiente
    await syncSnapshot(fechaHoy);

    // Paso 2: Trabajos
    await syncTrabajos();

    // Paso 3: Profesionales
    await syncProfesionales();

    // Paso 4: Métricas locales
    await calcularMetricasMensuales();

    return ({ 
      success: true, 
      message: 'Sincronización completada exitosamente' 
    });

  } catch (error: any) {
    console.error('❌ Error fatal en el Cron:', error);
    return {
      success: false, 
      error: error.message || 'Error desconocido durante la sincronización'
    };
  }
}