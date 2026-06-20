"use client"

import { Home, Wrench, History, User, Settings, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type View = "inicio" | "trabajo-activo" | "historial"

interface AppSidebarProps {
  currentView: View
  onViewChange: (view: View) => void
}

const navItems = [
  { id: "inicio" as const, label: "Inicio", icon: Home },
  { id: "trabajo-activo" as const, label: "Trabajo Activo", icon: Wrench },
  { id: "historial" as const, label: "Mi Historial", icon: History },
]

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-plumbing">
          <span className="font-[family-name:var(--font-display)] text-sm font-bold text-white">
            FN
          </span>
        </div>
        <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-white">
          FixNow
        </span>
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
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent">
              <Avatar className="size-9">
                <AvatarImage src="/avatar-catalina.jpg" alt="Catalina" />
                <AvatarFallback className="bg-plumbing text-white">
                  CM
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-white">Catalina Méndez</p>
                <p className="truncate text-xs text-white/60">
                  catalina@email.com
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
            <DropdownMenuItem className="text-destructive">
              <LogOut className="mr-2 size-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  )
}
