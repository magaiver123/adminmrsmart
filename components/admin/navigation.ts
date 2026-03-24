export type AdminEnvironment = "store" | "global"

export type AdminMenuItem = {
  label: string
  href: string
}

export const STORE_MENU_ITEMS: AdminMenuItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Totens", href: "/totens" },
  { label: "Impressoras", href: "/impressoras" },
  { label: "Produtos", href: "/produtos" },
  { label: "Categorias", href: "/categorias" },
  { label: "Estoque", href: "/estoque" },
  { label: "Tela Inicial", href: "/kiosk" },
  { label: "Banner do Menu", href: "/menu-banner" },
  { label: "Pedidos", href: "/pedidos" },
]

export const GLOBAL_MENU_ITEMS: AdminMenuItem[] = [
  { label: "Lojas", href: "/lojas" },
  { label: "Impressoras Global", href: "/impressoras-global" },
  { label: "Print Agents", href: "/print-agents" },
  { label: "Produtos Globais", href: "/produtos-globais" },
  { label: "Categorias Globais", href: "/categorias-globais" },
  { label: "Usuários", href: "/usuarios" },
  { label: "Usuários Admin", href: "/admin-usuarios" },
  { label: "Configurações", href: "/configuracoes" },
  { label: "Logs / Auditoria", href: "/logs" },
  { label: "Meu Perfil", href: "/perfil" },
]

function matchesPath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function getEnvironmentFromPathname(pathname: string): AdminEnvironment {
  if (GLOBAL_MENU_ITEMS.some((item) => matchesPath(pathname, item.href))) {
    return "global"
  }

  return "store"
}

export function getDefaultRouteForEnvironment(
  environment: AdminEnvironment
): string {
  return environment === "global" ? "/lojas" : "/dashboard"
}

export function getEnvironmentLabel(environment: AdminEnvironment): string {
  return environment === "global" ? "Configuração Global" : "Configuração por Loja"
}
