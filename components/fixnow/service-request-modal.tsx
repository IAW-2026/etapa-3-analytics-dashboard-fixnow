"use client"

import { useState } from "react"
import { Droplets, Zap, Flame, MapPin, Clock, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ServiceType } from "./service-card"

interface ServiceRequestModalProps {
  service: ServiceType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: () => void
}

const serviceLabels: Record<ServiceType, { label: string; icon: typeof Droplets; color: string }> = {
  plomeria: { label: "Plomería", icon: Droplets, color: "bg-plumbing" },
  electricidad: { label: "Electricidad", icon: Zap, color: "bg-electrical" },
  gas: { label: "Gas", icon: Flame, color: "bg-gas" },
}

export function ServiceRequestModal({
  service,
  open,
  onOpenChange,
  onSubmit,
}: ServiceRequestModalProps) {
  const [description, setDescription] = useState("")
  const [urgency, setUrgency] = useState<"immediate" | "scheduled">("immediate")

  if (!service) return null

  const config = serviceLabels[service]
  const Icon = config.icon

  const handleSubmit = () => {
    onSubmit()
    setDescription("")
    setUrgency("immediate")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        <DialogHeader className="border-b border-border p-6">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-lg ${config.color}`}>
              <Icon className="size-5 text-background" />
            </div>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Solicitar {config.label}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="grid gap-6 p-6 md:grid-cols-2">
          {/* Form Section */}
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción del problema
              </Label>
              <Textarea
                id="description"
                placeholder="Describe el problema que necesitas resolver..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">Urgencia</Label>
              <RadioGroup
                value={urgency}
                onValueChange={(v) => setUrgency(v as "immediate" | "scheduled")}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="immediate"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted [&:has(:checked)]:border-foreground [&:has(:checked)]:bg-muted"
                >
                  <RadioGroupItem value="immediate" id="immediate" />
                  <div className="flex items-center gap-2">
                    <AlertCircle className="size-4 text-gas" />
                    <span className="text-sm font-medium">Inmediato</span>
                  </div>
                </Label>
                <Label
                  htmlFor="scheduled"
                  className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted [&:has(:checked)]:border-foreground [&:has(:checked)]:bg-muted"
                >
                  <RadioGroupItem value="scheduled" id="scheduled" />
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-plumbing" />
                    <span className="text-sm font-medium">Programado</span>
                  </div>
                </Label>
              </RadioGroup>
            </div>
          </div>

          {/* Map Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Confirmar ubicación</Label>
            <div className="relative h-[200px] overflow-hidden rounded-lg border border-border bg-muted">
              {/* Simulated Map */}
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50">
                <div className="absolute inset-0 opacity-20">
                  {/* Grid pattern */}
                  <div
                    className="h-full w-full"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, var(--border) 1px, transparent 1px),
                        linear-gradient(to bottom, var(--border) 1px, transparent 1px)
                      `,
                      backgroundSize: "40px 40px",
                    }}
                  />
                </div>
                {/* Location marker */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="relative">
                    <div className="absolute -inset-4 animate-ping rounded-full bg-plumbing/20" />
                    <div className="relative flex size-8 items-center justify-center rounded-full bg-foreground shadow-lg">
                      <MapPin className="size-4 text-background" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-3 left-3 rounded-md bg-card px-2.5 py-1.5 text-xs font-medium shadow-sm">
                <span className="text-muted-foreground">Calle 123 #45-67, Bogotá</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Confirma que la ubicación es correcta o ajústala en el mapa
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!description.trim()}>
            Enviar Solicitud
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
