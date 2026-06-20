"use client"

import Image from "next/image"
import {
  LayoutDashboard,
  PieChart,
  Trophy,
  Settings,
  LogOut,
  User,
  Circle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export type AnalyticsView = "resumen" | "analisis" | "monitoreo"

interface AnalyticsSidebarProps {
  currentView: AnalyticsView
  onViewChange: (view: AnalyticsView) => void
  onLogout: () => void
}

const navItems = [
  { id: "resumen" as const, label: "Resumen", icon: LayoutDashboard },
  { id: "analisis" as const, label: "Análisis", icon: PieChart },
  { id: "monitoreo" as const, label: "Monitoreo", icon: Trophy },
]

const sources = [
  { label: "Rider App", color: "var(--plumbing)" },
  { label: "Driver App", color: "var(--electrical)" },
  { label: "Payments App", color: "var(--brand-accent)" },
  { label: "Feedback App", color: "#7aa7d6" },
]

export function AnalyticsSidebar({
  currentView,
  onViewChange,
  onLogout,
}: AnalyticsSidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <Image
          src="/fix-now-logo.png"
          alt="FixNow"
          width={36}
          height={36}
          className="size-9"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tracking-tight text-white">
            FixNow
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-[#DAB785]">
            Analytics
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-plumbing text-white"
                  : "text-white/70 hover:bg-sidebar-accent hover:text-white"
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </button>
          )
        })}

        {/* Data sources legend */}
        <div className="mt-8 px-3">
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Fuentes de datos
          </p>
          <div className="space-y-2.5">
            {sources.map((source) => (
              <div key={source.label} className="flex items-center gap-2.5">
                <Circle
                  className="size-2.5 fill-current"
                  style={{ color: source.color }}
                />
                <span className="text-xs text-white/60">{source.label}</span>
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent">
              <Avatar className="size-9">
                <AvatarFallback className="bg-electrical text-brand-dark">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  Admin FixNow
                </p>
                <p className="truncate text-xs text-white/60">
                  admin@fixnow.cl
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 size-4" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 size-4" />
              Configuración
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={onLogout}>
              <LogOut className="mr-2 size-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
