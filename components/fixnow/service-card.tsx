"use client"

import { Droplets, Zap, Flame, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export type ServiceType = "plomeria" | "electricidad" | "gas"

interface ServiceCardProps {
  service: ServiceType
  onClick: () => void
}

const serviceConfig: Record<
  ServiceType,
  { label: string; icon: LucideIcon; color: string; hoverBorder: string; hoverBg: string }
> = {
  plomeria: {
    label: "Plomería",
    icon: Droplets,
    color: "text-plumbing",
    hoverBorder: "hover:border-plumbing",
    hoverBg: "group-hover:bg-plumbing/10",
  },
  electricidad: {
    label: "Electricidad",
    icon: Zap,
    color: "text-electrical",
    hoverBorder: "hover:border-electrical",
    hoverBg: "group-hover:bg-electrical/10",
  },
  gas: {
    label: "Gas",
    icon: Flame,
    color: "text-gas",
    hoverBorder: "hover:border-gas",
    hoverBg: "group-hover:bg-gas/10",
  },
}

export function ServiceCard({ service, onClick }: ServiceCardProps) {
  const config = serviceConfig[service]
  const Icon = config.icon

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative flex flex-col items-start gap-4 rounded-lg border border-border bg-card p-6 text-left transition-all duration-200",
        config.hoverBorder
      )}
    >
      <div
        className={cn(
          "service-icon-wrapper flex size-14 items-center justify-center rounded-lg border border-border transition-colors",
          config.hoverBg
        )}
      >
        <Icon
          className={cn(
            "size-7 transition-colors",
            service === "plomeria" && "text-muted-foreground group-hover:text-plumbing",
            service === "electricidad" && "text-muted-foreground group-hover:text-electrical",
            service === "gas" && "text-muted-foreground group-hover:text-gas"
          )}
        />
      </div>
      <div>
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {config.label}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {service === "plomeria" && "Fugas, cañerías, instalaciones y más"}
          {service === "electricidad" && "Instalaciones, cortos, mantenimiento"}
          {service === "gas" && "Revisiones, fugas, instalaciones seguras"}
        </p>
      </div>
    </button>
  )
}
