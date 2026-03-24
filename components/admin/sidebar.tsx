"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  MonitorSmartphone,
  Printer,
  Package,
  FolderOpen,
  Warehouse,
  Monitor,
  ShoppingCart,
  Store,
  Users,
  UserCog,
  Settings,
  FileText,
  User,
  Library,
  ChevronLeft,
  ChevronRight,
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
import {
  GLOBAL_MENU_ITEMS,
  STORE_MENU_ITEMS,
  getEnvironmentFromPathname,
  getEnvironmentLabel,
} from "./navigation"

interface SidebarProps {
  collapsed: boolean
  onToggle: (value: boolean) => void
}

type StoreType = {
  id: string
  name: string
  status: boolean
}

const iconByHref = {
  "/dashboard": LayoutDashboard,
  "/totens": MonitorSmartphone,
  "/impressoras": Printer,
  "/impressoras-global": Printer,
  "/produtos": Package,
  "/categorias": FolderOpen,
  "/estoque": Warehouse,
  "/kiosk": Monitor,
  "/menu-banner": Monitor,
  "/pedidos": ShoppingCart,
  "/lojas": Store,
  "/produtos-globais": Library,
  "/categorias-globais": FolderOpen,
  "/usuarios": Users,
  "/admin-usuarios": UserCog,
  "/configuracoes": Settings,
  "/logs": FileText,
  "/perfil": User,
} as const

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const environment = getEnvironmentFromPathname(pathname)
  const { store, setStore } = useStore()
  const [stores, setStores] = useState<StoreType[]>([])

  const menuItems =
    environment === "global" ? GLOBAL_MENU_ITEMS : STORE_MENU_ITEMS

  useEffect(() => {
    if (environment !== "store") return

    async function loadStores() {
      const res = await fetch("/api/admin/stores")
      if (!res.ok) return

      const data = await res.json()
      const activeStores = data.filter((s: StoreType) => s.status === true)
      setStores(activeStores)
    }

    loadStores()
  }, [environment])

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-white text-black transition-all duration-300 flex flex-col border-r",
        collapsed ? "w-16" : "w-64"
      )}
    >
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
              <span className="text-xs text-black/60">Pegue, pague, pronto</span>
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

      {!collapsed && (
        <div className="border-b px-4 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-black/50">
            {getEnvironmentLabel(environment)}
          </p>
        </div>
      )}

      {!collapsed && environment === "store" && (
        <div className="border-b px-4 py-3">
          <span className="text-xs text-black/60 block mb-1">Loja ativa</span>

          <Select
            value={store?.id ?? ""}
            onValueChange={(value) => {
              const selected = stores.find((s) => s.id === value) || null
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

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = iconByHref[item.href as keyof typeof iconByHref]

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
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {!collapsed && (
        <div className="border-t p-4">
          <p className="text-xs text-black/60">Kiosk Admin v1.0</p>
        </div>
      )}
    </aside>
  )
}

