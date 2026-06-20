"use client"

// FixNow Analytics Dashboard - Consolidated metrics across the ecosystem
import { useState } from "react"
import { WelcomePage } from "@/components/fixnow/welcome-page"
import {
  AnalyticsSidebar,
  type AnalyticsView,
} from "@/components/analytics/analytics-sidebar"
import { AnalyticsDashboard } from "@/components/analytics/analytics-dashboard"

export default function FixNowAnalyticsApp() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentView, setCurrentView] = useState<AnalyticsView>("resumen")

  const handleLogin = () => {
    setIsAuthenticated(true)
  }

  if (!isAuthenticated) {
    return <WelcomePage onLogin={handleLogin} />
  }

  return (
    <div className="flex h-screen bg-background">
      <AnalyticsSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onLogout={() => setIsAuthenticated(false)}
      />
      <main className="flex-1 overflow-auto">
        <AnalyticsDashboard currentView={currentView} />
      </main>
    </div>
  )
}
