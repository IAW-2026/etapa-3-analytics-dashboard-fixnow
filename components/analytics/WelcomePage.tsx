"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  ArrowRight,
  Check,
  Activity,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
// Importamos useUser y los botones al estilo de tu app anterior
import {
  SignInButton,
  SignOutButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";

export function WelcomePage() {
  // Extraemos el estado de la sesión igual que en tu otro código
  const { isSignedIn } = useUser();

  const features = [
    { icon: Activity, text: "Datos consolidados en tiempo real" },
    { icon: Shield, text: "4 aplicaciones, una sola vista" },
    { icon: Check, text: "Reportes y métricas clave del negocio" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      <main className="flex flex-1">
        <div className="flex flex-1 flex-col justify-between px-6 py-6">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-(family-name:--font-display) text-2xl font-semibold text-white">
                Analytics
              </span>
            </div>

            {/* Lógica condicional tradicional para el Header */}
            <div className="flex items-center gap-4">
              {!isSignedIn ? (
                <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-[#DAB785] hover:bg-[#04395E] hover:text-[#DAB785]  cursor-pointer"
                  >
                    Iniciar Sesión
                  </Button>
                </SignInButton>
              ) : (
                <>
                  <SignOutButton>
                    <Button
                      variant="ghost"
                      className="text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
                    >
                      Cerrar sesión
                    </Button>
                  </SignOutButton>
                  <UserButton />
                </>
              )}
            </div>
          </header>

          {/* Main Hero Content */}
          <div className="flex flex-1 flex-col items-start justify-center py-6">
            <div className="max-w-xl">
              <h1 className="font-(family-name:--font-display) text-4xl font-bold leading-tight tracking-tight text-[#DAB785] sm:text-5xl lg:text-6xl">
                <span className="text-balance">Todo el negocio</span>
                <br />
                <span className="text-white">en un vistazo</span>
              </h1>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/70">
                El centro de analítica de FixNow. Consolidamos los datos de
                Rider, Driver, Payments y Feedback para mostrarte las métricas
                clave del ecosistema en tiempo real.
              </p>

              <div className="mt-8 flex flex-col gap-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div key={feature.text} className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-plumbing/20">
                        <Icon className="size-4 text-plumbing" />
                      </div>
                      <span className="text-sm text-white/80">
                        {feature.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Lógica condicional tradicional para los botones CTA */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                {!isSignedIn ? (
                  <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
                    <Button
                      size="lg"
                      className="bg-plumbing text-white hover:bg-plumbing/90  cursor-pointer"
                    >
                      Ver el dashboard
                      <ArrowRight className="ml-2 size-4" />
                    </Button>
                  </SignInButton>
                ) : (
                  <Button
                    size="lg"
                    className="bg-plumbing text-white hover:bg-plumbing/90"
                    asChild
                  >
                    <Link href="/dashboard">
                      Ir al dashboard
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Panel lateral decorativo (Se mantiene el diseño de Analytics) */}
        <div className="hidden flex-col items-center justify-center bg-[#04395E] px-12 lg:flex lg:w-[45%]">
          <div className="relative mb-12">
            <Image
              src="/fix_now_logo.png"
              alt="FixNow"
              width={320}
              height={320}
              className="size-72 object-contain xl:size-80"
              priority
            />
          </div>
          <div className="grid w-full max-w-sm grid-cols-3 gap-4">
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-lg bg-plumbing/20">
                <BarChart3 className="size-6 text-plumbing" />
              </div>
              <span className="text-xs font-medium text-white/80">KPIs</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-lg bg-electrical/20">
                <PieChart className="size-6 text-electrical" />
              </div>
              <span className="text-xs font-medium text-white/80">
                Gráficos
              </span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="size-6 text-white/80" />
              </div>
              <span className="text-xs font-medium text-white/80">
                Reportes
              </span>
            </div>
          </div>
          <div className="mt-8 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
            <Activity className="size-4 text-plumbing" />
            <span className="text-xs text-white/70">
              Datos consolidados de 4 aplicaciones
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
