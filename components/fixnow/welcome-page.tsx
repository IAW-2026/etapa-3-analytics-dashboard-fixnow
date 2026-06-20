"use client"

import { useState } from "react"
import Image from "next/image"
import { BarChart3, PieChart, TrendingUp, ArrowRight, Eye, EyeOff, Check, Activity, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface WelcomePageProps {
  onLogin: (email: string) => void
}

export function WelcomePage({ onLogin }: WelcomePageProps) {
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Login form state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")

  // Signup form state
  const [signupName, setSignupName] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    onLogin(loginEmail)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (signupPassword !== signupConfirmPassword) {
      return
    }
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    onLogin(signupEmail)
  }

  const features = [
    { icon: Activity, text: "Datos consolidados en tiempo real" },
    { icon: Shield, text: "4 aplicaciones, una sola vista" },
    { icon: Check, text: "Reportes y métricas clave del negocio" },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-brand-dark">
      {/* Hero Section - Full Screen */}
      <main className="flex flex-1">
        {/* Left Side - Hero Content */}
        <div className="flex flex-1 flex-col justify-between px-8 py-8 lg:px-16 lg:py-12">
          {/* Header */}
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/fix-now-logo.png"
                alt="FixNow Logo"
                width={48}
                height={48}
                className="size-12"
              />
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold text-white">
                Analytics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="text-[#DAB785] hover:bg-[#04395E] hover:text-[#DAB785]"
                onClick={() => setShowLoginModal(true)}
              >
                Iniciar Sesión
              </Button>
              <Button
                className="bg-[#DAB785] text-brand-dark hover:bg-[#DAB785]/90"
                onClick={() => setShowSignupModal(true)}
              >
                Registrarse
              </Button>
            </div>
          </header>

          {/* Main Hero Content */}
          <div className="flex flex-1 flex-col items-start justify-center py-12">
            <div className="max-w-xl">
              <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight text-[#DAB785] sm:text-5xl lg:text-6xl">
                <span className="text-balance">Todo el negocio</span>
                <br />
                <span className="text-white">en un vistazo</span>
              </h1>
              <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-white/70">
                El centro de analítica de FixNow. Consolidamos los datos de Rider,
                Driver, Payments y Feedback para mostrarte las métricas clave del
                ecosistema en tiempo real.
              </p>

              {/* Features List */}
              <div className="mt-8 flex flex-col gap-3">
                {features.map((feature) => {
                  const Icon = feature.icon
                  return (
                    <div key={feature.text} className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-plumbing/20">
                        <Icon className="size-4 text-plumbing" />
                      </div>
                      <span className="text-sm text-white/80">{feature.text}</span>
                    </div>
                  )
                })}
              </div>

              {/* CTA Buttons */}
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Button
                  size="lg"
                  className="bg-plumbing text-white hover:bg-plumbing/90"
                  onClick={() => setShowLoginModal(true)}
                >
                  Ver el dashboard
                  <ArrowRight className="ml-2 size-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  onClick={() => setShowLoginModal(true)}
                >
                  Ya tengo cuenta
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="flex items-center justify-between text-sm text-white/40">
            <p>&copy; 2026 FixNow. Todos los derechos reservados.</p>
            <div className="flex gap-6">
              <button className="hover:text-white/60">Términos</button>
              <button className="hover:text-white/60">Privacidad</button>
            </div>
          </footer>
        </div>

        {/* Right Side - Logo & Services */}
        <div className="hidden flex-col items-center justify-center bg-[#04395E] px-12 lg:flex lg:w-[45%]">
          {/* Large Logo */}
          <div className="relative mb-12">
            <Image
              src="/fix-now-logo.png"
              alt="FixNow"
              width={320}
              height={320}
              className="size-72 object-contain xl:size-80"
              priority
            />
          </div>

          {/* Services Grid */}
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
              <span className="text-xs font-medium text-white/80">Gráficos</span>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl bg-white/5 p-4 backdrop-blur-sm">
              <div className="flex size-12 items-center justify-center rounded-lg bg-white/10">
                <TrendingUp className="size-6 text-white/80" />
              </div>
              <span className="text-xs font-medium text-white/80">Reportes</span>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="mt-8 flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 backdrop-blur-sm">
            <Activity className="size-4 text-plumbing" />
            <span className="text-xs text-white/70">Datos consolidados de 4 aplicaciones</span>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/fix-now-logo.png"
                alt="FixNow"
                width={40}
                height={40}
                className="size-10"
              />
            </div>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Bienvenido de nuevo
            </DialogTitle>
            <DialogDescription>
              Ingresa tus credenciales para acceder al dashboard de analítica
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="tu@email.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-sm text-plumbing hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <Button
              type="submit"
              className="w-full bg-brand-dark text-white hover:bg-brand-dark/90"
              disabled={isLoading}
            >
              {isLoading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿No tienes cuenta?{" "}
              <button
                type="button"
                className="text-plumbing hover:underline"
                onClick={() => {
                  setShowLoginModal(false)
                  setShowSignupModal(true)
                }}
              >
                Regístrate
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Signup Modal */}
      <Dialog open={showSignupModal} onOpenChange={setShowSignupModal}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <div className="mb-4 flex items-center gap-3">
              <Image
                src="/fix-now-logo.png"
                alt="FixNow"
                width={40}
                height={40}
                className="size-10"
              />
            </div>
            <DialogTitle className="font-[family-name:var(--font-display)] text-xl">
              Crea tu cuenta
            </DialogTitle>
            <DialogDescription>
              Regístrate para acceder al panel de analítica de FixNow
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Nombre completo</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="Catalina Méndez"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-email">Correo electrónico</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="tu@email.com"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirmar contraseña</Label>
              <Input
                id="signup-confirm-password"
                type="password"
                placeholder="••••••••"
                value={signupConfirmPassword}
                onChange={(e) => setSignupConfirmPassword(e.target.value)}
                required
              />
              {signupPassword &&
                signupConfirmPassword &&
                signupPassword !== signupConfirmPassword && (
                  <p className="text-sm text-destructive">
                    Las contraseñas no coinciden
                  </p>
                )}
            </div>
            <Button
              type="submit"
              className="w-full bg-plumbing text-white hover:bg-plumbing/90"
              disabled={
                isLoading ||
                (signupPassword !== signupConfirmPassword &&
                  signupConfirmPassword.length > 0)
              }
            >
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{" "}
              <button
                type="button"
                className="text-plumbing hover:underline"
                onClick={() => {
                  setShowSignupModal(false)
                  setShowLoginModal(true)
                }}
              >
                Inicia sesión
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
