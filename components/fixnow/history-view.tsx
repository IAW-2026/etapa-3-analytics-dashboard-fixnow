"use client"

import { Droplets, Zap, Flame } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { ServiceType } from "./service-card"

interface HistoryItem {
  id: string
  date: string
  service: ServiceType
  description: string
  status: "completed" | "cancelled" | "in-progress"
  amount: string
}

const historyData: HistoryItem[] = [
  {
    id: "1",
    date: "2024-01-15",
    service: "electricidad",
    description: "Instalación de tomacorrientes adicionales en sala y habitación principal",
    status: "completed",
    amount: "$45,000",
  },
  {
    id: "2",
    date: "2024-01-10",
    service: "plomeria",
    description: "Reparación de fuga en tubería del baño",
    status: "completed",
    amount: "$28,000",
  },
  {
    id: "3",
    date: "2024-01-05",
    service: "gas",
    description: "Revisión anual de instalación de gas natural",
    status: "completed",
    amount: "$35,000",
  },
  {
    id: "4",
    date: "2023-12-20",
    service: "electricidad",
    description: "Cambio de cableado en cocina",
    status: "cancelled",
    amount: "$0",
  },
  {
    id: "5",
    date: "2023-12-15",
    service: "plomeria",
    description: "Destape de cañería principal",
    status: "completed",
    amount: "$22,000",
  },
  {
    id: "6",
    date: "2023-11-28",
    service: "gas",
    description: "Instalación de calentador de agua a gas",
    status: "completed",
    amount: "$120,000",
  },
]

const serviceIcons: Record<ServiceType, { icon: typeof Droplets; color: string }> = {
  plomeria: { icon: Droplets, color: "text-plumbing" },
  electricidad: { icon: Zap, color: "text-electrical" },
  gas: { icon: Flame, color: "text-gas" },
}

const statusConfig: Record<HistoryItem["status"], { label: string; className: string }> = {
  completed: {
    label: "Completado",
    className: "bg-success/15 text-success-foreground hover:bg-success/20",
  },
  cancelled: {
    label: "Cancelado",
    className: "bg-error/15 text-error hover:bg-error/20",
  },
  "in-progress": {
    label: "En progreso",
    className: "bg-electrical/15 text-electrical hover:bg-electrical/20",
  },
}

const serviceLabels: Record<ServiceType, string> = {
  plomeria: "Plomería",
  electricidad: "Electricidad",
  gas: "Gas",
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function HistoryView() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Mi Historial
        </h1>
        <p className="mt-1 text-muted-foreground">
          Revisa todos tus servicios anteriores
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de servicios</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
            {historyData.length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Completados</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-success-foreground">
            {historyData.filter((h) => h.status === "completed").length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total invertido</p>
          <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold">
            $250,000
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[120px]">Fecha</TableHead>
              <TableHead className="w-[140px]">Servicio</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[120px]">Estado</TableHead>
              <TableHead className="w-[100px] text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {historyData.map((item) => {
              const serviceConfig = serviceIcons[item.service]
              const Icon = serviceConfig.icon
              const status = statusConfig[item.status]

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-muted-foreground">
                    {formatDate(item.date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className={`size-4 ${serviceConfig.color}`} />
                      <span className="font-medium">
                        {serviceLabels[item.service]}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-muted-foreground">
                    {item.description}
                  </TableCell>
                  <TableCell>
                    <Badge className={status.className}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {item.amount}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
