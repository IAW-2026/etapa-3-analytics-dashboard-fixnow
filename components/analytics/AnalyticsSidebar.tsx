"use client";

import Image from "next/image";
import { LayoutDashboard, PieChart, Trophy, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AnalyticsView = "resumen" | "analisis" | "monitoreo";

interface AnalyticsSidebarProps {
  currentView: AnalyticsView;
  onViewChange: (view: AnalyticsView) => void;
  onLogout: () => void;
}

const navItems = [
  { id: "resumen" as const, label: "Resumen", icon: LayoutDashboard },
  { id: "analisis" as const, label: "Análisis", icon: PieChart },
  { id: "monitoreo" as const, label: "Monitoreo", icon: Trophy },
];

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
          src="/fix_now_logo.png"
          alt="FixNow"
          width={36}
          height={36}
          className="size-9"
        />
        <div className="flex flex-col leading-tight">
          <span className="font-(family-name:--font-display) text-base font-semibold tracking-tight text-white">
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
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-plumbing text-white"
                  : "text-white/70 hover:bg-sidebar-accent hover:text-white cursor-pointer",
              )}
            >
              <Icon className="size-5" />
              {item.label}
            </button>
          );
        })}

        {/* Data sources legend (Modificado a texto descriptivo) */}
        <div className="mt-8 px-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Ecosistema Integrado
          </p>
          <p className="text-xs text-white/50 leading-relaxed text-balance">
            Analítica consolidada en tiempo real obtenida desde{" "}
            <strong>Rider</strong>, <strong>Driver</strong>,{" "}
            <strong>Payments</strong> y <strong>Feedback</strong> App.
          </p>
        </div>
      </nav>

      {/* User Profile */}
      <div className="border-t border-sidebar-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent cursor-pointer">
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
          <DropdownMenuContent
            align="start"
            className="w-56 border-border bg-card"
          >
            <DropdownMenuItem
              className="text-destructive cursor-pointer"
              onClick={onLogout}
            >
              <LogOut className="mr-2 size-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
