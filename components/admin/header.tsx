"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search, ChevronDown, User, Settings, LogOut, LayoutGrid } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AdminEnvironment,
  getDefaultRouteForEnvironment,
  getEnvironmentFromPathname,
  getEnvironmentLabel,
} from "./navigation"

interface HeaderProps {
  title: string
}

export function Header({ title }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const environment = getEnvironmentFromPathname(pathname)

  async function handleLogout() {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
      })

      router.push("/")
      router.refresh()
    } catch {
      console.error("Erro ao fazer logout")
    }
  }

  function handleEnvironmentChange(value: string) {
    const nextEnvironment = value as AdminEnvironment

    if (nextEnvironment === environment) {
      return
    }

    router.push(getDefaultRouteForEnvironment(nextEnvironment))
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        <Select value={environment} onValueChange={handleEnvironmentChange}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecionar ambiente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="store">{getEnvironmentLabel("store")}</SelectItem>
            <SelectItem value="global">{getEnvironmentLabel("global")}</SelectItem>
          </SelectContent>
        </Select>

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="w-64 pl-9 bg-secondary border-border"
          />
        </div>

        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder.svg" alt="Admin" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  AD
                </AvatarFallback>
              </Avatar>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/perfil" className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/configuracoes" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href="/ambientes" className="flex items-center">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Central de Ambientes
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
