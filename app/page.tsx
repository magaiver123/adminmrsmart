"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Eye, EyeOff, Lock, Mail } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()

  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()

    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Erro ao fazer login.")
        setLoading(false)
        return
      }

      router.push("/dashboard")
    } catch (err) {
      setError("Erro inesperado. Tente novamente.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-10 flex flex-col items-center text-center">
          <Image
            src="/logo.svg"
            alt="Mr Smart logo"
            width={72}
            height={72}
            className="mb-4"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Mr Smart
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Pague, pegue, pronto
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            {/* Email Field */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-foreground"
                >
                  Senha
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-[#FF6A00] transition-colors hover:text-[#E05E00]"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-input bg-background pl-11 pr-12 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-[#FF6A00] focus:ring-2 focus:ring-[#FF6A00]/20"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Remember Me */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                  rememberMe
                    ? "border-[#FF6A00] bg-[#FF6A00] text-white"
                    : "border-input bg-background"
                }`}
              >
                {rememberMe && (
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              <label
                className="cursor-pointer text-sm text-muted-foreground"
                onClick={() => setRememberMe(!rememberMe)}
              >
                Lembrar de mim
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-xl bg-[#FF6A00] text-sm font-semibold text-white shadow-lg shadow-[#FF6A00]/25 transition-all hover:bg-[#E05E00] hover:shadow-[#FF6A00]/30 active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
