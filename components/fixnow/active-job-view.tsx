"use client"

import { Zap, Star, Phone, MessageCircle, Clock, MapPin, CheckCircle2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export function ActiveJobView() {
  const steps = [
    { id: 1, label: "Solicitud enviada", completed: true },
    { id: 2, label: "Profesional asignado", completed: true },
    { id: 3, label: "En camino", completed: true },
    { id: 4, label: "En progreso", completed: false, active: true },
    { id: 5, label: "Finalizado", completed: false },
  ]

  const completedSteps = steps.filter((s) => s.completed).length
  const progress = (completedSteps / steps.length) * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight">
          Trabajo Activo
        </h1>
        <p className="mt-1 text-muted-foreground">
          Seguimiento en tiempo real de tu servicio
        </p>
      </div>

      {/* Split View */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Job Details */}
        <div className="space-y-6">
          {/* Service Card */}
          <div className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-electrical">
                  <Zap className="size-5 text-brand-dark" />
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] font-semibold">
                    Electricidad
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Revisión de cortocircuito
                  </p>
                </div>
              </div>
              <Badge className="bg-electrical/15 text-electrical hover:bg-electrical/20">
                En progreso
              </Badge>
            </div>

            {/* Progress Steps */}
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-medium">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="mt-4 space-y-3">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`flex size-6 items-center justify-center rounded-full ${
                        step.completed
                          ? "bg-success text-success-foreground"
                          : step.active
                          ? "border-2 border-electrical bg-electrical/10"
                          : "border border-border bg-muted"
                      }`}
                    >
                      {step.completed && <CheckCircle2 className="size-4" />}
                      {step.active && <div className="size-2 rounded-full bg-electrical" />}
                    </div>
                    <span
                      className={`text-sm ${
                        step.completed || step.active
                          ? "font-medium text-foreground"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Professional Info */}
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Tu Profesional
            </h4>
            <div className="flex items-center gap-4">
              <Avatar className="size-14 grayscale">
                <AvatarImage src="/avatar-professional.jpg" alt="Carlos Gómez" />
                <AvatarFallback className="bg-muted text-lg">CG</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-[family-name:var(--font-display)] font-semibold">
                  Carlos Gómez
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="size-4 fill-electrical text-electrical" />
                    <span className="text-sm font-medium">4.8</span>
                  </div>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    127 trabajos completados
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <Phone className="mr-2 size-4" />
                Llamar
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <MessageCircle className="mr-2 size-4" />
                Mensaje
              </Button>
            </div>
          </div>

          {/* Estimate */}
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="size-4" />
                Tiempo estimado restante
              </div>
              <span className="font-[family-name:var(--font-display)] font-semibold">
                ~25 min
              </span>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Precio estimado</span>
              <span className="font-[family-name:var(--font-display)] text-xl font-bold">
                $12,000
              </span>
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="relative min-h-[400px] overflow-hidden rounded-lg border border-border bg-muted lg:min-h-0">
          {/* Simulated Interactive Map */}
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50">
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-30">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, var(--border) 1px, transparent 1px),
                    linear-gradient(to bottom, var(--border) 1px, transparent 1px)
                  `,
                  backgroundSize: "60px 60px",
                }}
              />
            </div>

            {/* Simulated route */}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 400">
              <path
                d="M 100 300 Q 150 200 200 220 T 280 150"
                fill="none"
                stroke="var(--electrical)"
                strokeWidth="3"
                strokeDasharray="8 4"
                className="animate-pulse"
              />
            </svg>

            {/* Professional location marker */}
            <div className="absolute left-[70%] top-[38%]">
              <div className="relative">
                <div className="absolute -inset-3 animate-ping rounded-full bg-electrical/30" />
                <div className="relative flex size-10 items-center justify-center rounded-full border-2 border-background bg-electrical shadow-lg">
                  <Zap className="size-5 text-brand-dark" />
                </div>
              </div>
            </div>

            {/* User location marker */}
            <div className="absolute left-[25%] top-[75%]">
              <div className="flex size-8 items-center justify-center rounded-full bg-foreground shadow-lg">
                <MapPin className="size-4 text-background" />
              </div>
            </div>
          </div>

          {/* Map controls */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            <button className="flex size-8 items-center justify-center rounded-md bg-card shadow-sm transition-colors hover:bg-muted">
              <span className="text-lg font-medium">+</span>
            </button>
            <button className="flex size-8 items-center justify-center rounded-md bg-card shadow-sm transition-colors hover:bg-muted">
              <span className="text-lg font-medium">−</span>
            </button>
          </div>

          {/* ETA Banner */}
          <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-card p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="size-2 animate-pulse rounded-full bg-success" />
                <span className="text-sm font-medium">Carlos está trabajando</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Actualizado hace 2 min
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
