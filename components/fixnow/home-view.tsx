"use client"

import { useState } from "react"
import { ServiceCard, type ServiceType } from "./service-card"
import { ServiceRequestModal } from "./service-request-modal"

interface HomeViewProps {
  onServiceRequested: () => void
}

export function HomeView({ onServiceRequested }: HomeViewProps) {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleServiceClick = (service: ServiceType) => {
    setSelectedService(service)
    setModalOpen(true)
  }

  const handleSubmit = () => {
    onServiceRequested()
  }

  return (
    <div className="space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight">
          Hola, Catalina.
        </h1>
        <p className="mt-1 text-lg text-muted-foreground">
          ¿Qué necesitas resolver hoy?
        </p>
      </div>

      {/* Services Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard service="plomeria" onClick={() => handleServiceClick("plomeria")} />
        <ServiceCard service="electricidad" onClick={() => handleServiceClick("electricidad")} />
        <ServiceCard service="gas" onClick={() => handleServiceClick("gas")} />
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          Actividad Reciente
        </h2>
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes servicios recientes. ¡Solicita tu primer servicio!
            </p>
          </div>
        </div>
      </div>

      <ServiceRequestModal
        service={selectedService}
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
