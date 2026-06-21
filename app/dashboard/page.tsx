"use client";

import { useState } from "react";
import { useClerk } from "@clerk/nextjs";
import {
  AnalyticsSidebar,
  type AnalyticsView,
} from "@/components/analytics/AnalyticsSidebar";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export default function DashboardPage() {
  // Estado para controlar qué sección estamos viendo (arranca en "resumen")
  const [currentView, setCurrentView] = useState<AnalyticsView>("resumen");

  // Traemos la función de Clerk para cerrar sesión
  const { signOut } = useClerk();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Panel lateral izquierdo */}
      <AnalyticsSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={() => signOut({ redirectUrl: "/" })}
      />

      {/* Contenido principal (scrollable) */}
      <main className="flex-1 overflow-y-auto bg-muted/20">
        <AnalyticsDashboard currentView={currentView} />
      </main>
    </div>
  );
}
