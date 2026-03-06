"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  MonitorSmartphone,
  Store,
  LayoutDashboard,
  Package,
  FolderOpen,
  Warehouse,
  Monitor,
  Users,
  ShoppingCart,
  Settings,
  UserCog,
  FileText,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useStore } from "./store-context"
import { useEffect, useState } from "react"

interface SidebarProps {
  collapsed: boolean
  onToggle: (value: boolean) => void
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: Store, label: "Lojas", href: "/lojas" },
  { icon: MonitorSmartphone, label: "Totens", href: "/totens" }, 
  { icon: Package, label: "Produtos", href: "/produtos" },
  { icon: FolderOpen, label: "Categorias", href: "/categorias" },
  { icon: Warehouse, label: "Estoque", href: "/estoque" },
  { icon: Monitor, label: "Tela Inicial", href: "/kiosk" },
  { icon: Users, label: "Usuários", href: "/usuarios" },
  { icon: ShoppingCart, label: "Pedidos", href: "/pedidos" },
  { icon: Settings, label: "Configurações", href: "/configuracoes" },
  { icon: UserCog, label: "Usuários Admin", href: "/admin-usuarios" },
  { icon: FileText, label: "Logs / Auditoria", href: "/logs" },
  { icon: User, label: "Meu Perfil", href: "/perfil" },
]

type Store = {
  id: string
  name: string
  status: boolean
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { store, setStore } = useStore()
  const [stores, setStores] = useState<Store[]>([])

  useEffect(() => {
    async function loadStores() {
      const res = await fetch("/api/admin/stores")
      if (!res.ok) return
      const data = await res.json()

      // 🔥 FILTRA APENAS LOJAS ATIVAS
      const activeStores = data.filter((s: Store) => s.status === true)

      setStores(activeStores)
    }

    loadStores()
  }, [])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white text-black transition-all duration-300 flex flex-col border-r",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-20 items-center justify-between border-b px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Mr Smart"
              width={44}
              height={44}
              priority
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold">Mr Smart</span>
              <span className="text-xs text-black/60">
                Pegue, pague, pronto
              </span>
            </div>
          </div>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggle(!collapsed)}
          className="text-black hover:bg-orange-100"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Loja ativa */}
      {!collapsed && (
        <div className="border-b px-4 py-3">
          <span className="text-xs text-black/60 block mb-1">
            Loja ativa
          </span>

          <Select
            value={store?.id ?? ""}
            onValueChange={(value) => {
              const selected =
                stores.find((s) => s.id === value) || null
              setStore(selected)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar loja" />
            </SelectTrigger>

            <SelectContent>
              {stores.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Menu */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-black hover:bg-orange-100",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-black/60">
            Kiosk Admin v1.0
          </p>
        </div>
      )}
    </aside>
  )
}
