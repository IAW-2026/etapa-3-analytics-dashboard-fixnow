"use client";

import { useState } from "react";
import useSWR from "swr";
import { Star, Droplets, Zap, Flame, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  fetchTopProfessionals,
  fetchCiudades,
  formatNumber,
  type TopProfessional,
} from "@/lib/analytics-data";

const categoryConfig: Record<
  TopProfessional["category"],
  { icon: typeof Droplets; color: string; bg: string; api: string }
> = {
  Plomería: {
    icon: Droplets,
    color: "var(--plumbing)",
    bg: "color-mix(in srgb, var(--plumbing) 15%, transparent)",
    api: "PLOMERIA",
  },
  Electricidad: {
    icon: Zap,
    color: "var(--electrical)",
    bg: "color-mix(in srgb, var(--electrical) 18%, transparent)",
    api: "ELECTRICIDAD",
  },
  Gas: {
    icon: Flame,
    color: "var(--gas)",
    bg: "color-mix(in srgb, var(--gas) 12%, transparent)",
    api: "GAS",
  },
};

const CATEGORIAS = [
  { label: "Todas", value: "", color: null, textDark: false },
  { label: "Plomería", value: "PLOMERIA", color: "var(--plumbing)", textDark: false },
  { label: "Electricidad", value: "ELECTRICIDAD", color: "var(--electrical)", textDark: true },
  { label: "Gas", value: "GAS", color: "var(--gas)", textDark: false },
];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
}

export function TopProfessionals() {
  const [categoria, setCategoria] = useState("");
  const [ciudad, setCiudad] = useState("");

  const swrKey = `top-professionals-${categoria}-${ciudad}`;

  const { data, isLoading } = useSWR<TopProfessional[]>(swrKey, () =>
    fetchTopProfessionals({ categoria: categoria || undefined, ciudad: ciudad || undefined }),
  );

  const { data: ciudades } = useSWR<string[]>("ciudades", fetchCiudades);

  return (
    <Card className="border-border">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-(family-name:--font-display) text-lg">
              Top Profesionales
            </CardTitle>
            <CardDescription>
              Mejor calificados · Feedback &amp; Driver App
            </CardDescription>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro categoría */}
            <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-0.5">
              {CATEGORIAS.map((cat) => {
                const isActive = categoria === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setCategoria(cat.value)}
                    style={
                      isActive && cat.color
                        ? { backgroundColor: cat.color, color: cat.textDark ? "var(--brand-dark)" : "#fff" }
                        : undefined
                    }
                    className={cn(
                      "rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                      isActive
                        ? cat.color
                          ? "shadow-sm"
                          : "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Filtro ciudad */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
                  {ciudad || "Todas las ciudades"}
                  <ChevronDown className="size-3 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-40">
                <DropdownMenuItem onClick={() => setCiudad("")}>
                  Todas las ciudades
                </DropdownMenuItem>
                {ciudades?.map((c) => (
                  <DropdownMenuItem key={c} onClick={() => setCiudad(c)}>
                    {c}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading || !data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Sin profesionales para los filtros seleccionados
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((pro, index) => {
              const config = categoryConfig[pro.category];
              const Icon = config.icon;
              return (
                <li
                  key={pro.id}
                  className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      index === 0
                        ? "bg-electrical text-brand-dark"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {index + 1}
                  </span>
                  <Avatar className="size-10">
                    <AvatarFallback className="bg-muted text-sm font-medium text-foreground">
                      {initials(pro.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {pro.name}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span
                        className="flex size-4 items-center justify-center rounded"
                        style={{ backgroundColor: config.bg }}
                      >
                        <Icon
                          className="size-2.5"
                          style={{ color: config.color }}
                        />
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {pro.category} · {pro.city}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Star className="size-3.5 fill-electrical text-electrical" />
                      <span className="text-sm font-semibold">
                        {pro.rating.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(pro.jobs)} trabajos
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
