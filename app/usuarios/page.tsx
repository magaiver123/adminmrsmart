"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Eye, Lock, ShoppingCart, DollarSign, Calendar } from "lucide-react"
import { fetchUsersGlobal, updateUserStatus } from "@/src/services/users.service"

type UserRow = {
  id: string
  name: string | null
  email: string | null
  cpf: string | null
  status: "ativo" | "bloqueado"
  last_access_at: string | null
}

type OrderRow = {
  id: string
  order_number: number
  user_id: string
  status: string
  total_amount: number
  payment_method: string
  created_at: string
  store_id: string
}

type StoreRow = {
  id: string
  name: string
  status: boolean
}

const statusColors: Record<string, string> = {
  processed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-700",
}

const statusLabels: Record<string, string> = {
  processed: "Processado",
  pending: "Pendente",
  canceled: "Cancelado",
}

function getDisplayName(user: Pick<UserRow, "name" | "email">) {
  return user.name?.trim() || user.email?.trim() || "Sem nome"
}

function getInitials(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

export default function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [stores, setStores] = useState<StoreRow[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [storeFilter, setStoreFilter] = useState("all")

  async function loadData(storeId?: string) {
    const data = await fetchUsersGlobal(storeId)
    setUsers(data.users ?? [])
    setOrders(data.orders ?? [])
    setStores(data.stores ?? [])
  }

  useEffect(() => {
    const selectedStore = storeFilter !== "all" ? storeFilter : undefined
    loadData(selectedStore)
  }, [storeFilter])

  const storeMap = useMemo(
    () => new Map(stores.map((store) => [store.id, store.name])),
    [stores]
  )

  const usersWithStats = useMemo(() => {
    return users.map((user) => {
      const userOrders = orders.filter((order) => order.user_id === user.id)
      const processed = userOrders.filter((order) => order.status === "processed")

      const totalSpent = processed.reduce(
        (sum, order) => sum + Number(order.total_amount),
        0
      )

      return {
        ...user,
        displayName: getDisplayName(user),
        ordersCount: userOrders.length,
        totalSpent,
        avgTicket: processed.length > 0 ? totalSpent / processed.length : 0,
        lastAccessFormatted: user.last_access_at
          ? new Date(user.last_access_at).toLocaleString("pt-BR")
          : "—",
      }
    })
  }, [users, orders])

  const filteredUsers = useMemo(() => {
    return usersWithStats.filter((user) => {
      const matchesSearch =
        !search ||
        user.displayName.toLowerCase().includes(search.toLowerCase()) ||
        (user.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (user.cpf ?? "").includes(search)

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [usersWithStats, search, statusFilter])

  async function toggleUserStatus() {
    if (!selectedUser) return

    const newStatus = selectedUser.status === "ativo" ? "bloqueado" : "ativo"
    await updateUserStatus(selectedUser.id, newStatus)
    await loadData(storeFilter !== "all" ? storeFilter : undefined)
    setSelectedUser((prev: any) => (prev ? { ...prev, status: newStatus } : prev))
  }

  return (
    <AdminLayout title="Usuários / Clientes">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou CPF..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={storeFilter} onValueChange={setStoreFilter}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filtrar por loja" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as lojas</SelectItem>
              {stores.map((store) => (
                <SelectItem key={store.id} value={store.id}>
                  {store.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="bloqueado">Bloqueados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Lista Global de Clientes
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({filteredUsers.length} usuários)
              </span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Total Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.displayName}</p>
                          <p className="text-xs text-muted-foreground">{user.email ?? "—"}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>{user.cpf ?? "—"}</TableCell>
                    <TableCell>{user.lastAccessFormatted}</TableCell>
                    <TableCell>{user.ordersCount}</TableCell>
                    <TableCell>R$ {user.totalSpent.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.status === "ativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {user.status === "ativo" ? "Ativo" : "Bloqueado"}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedUser(user)
                          setIsDetailOpen(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado para os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selectedUser && (
          <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
            <DialogContent className="!max-w-[90vw] w-[90vw] max-h-[90vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader className="pb-4 border-b">
                <DialogTitle className="text-xl">Detalhes do Cliente</DialogTitle>
                <DialogDescription>
                  Informações globais do cliente e histórico consolidado de pedidos.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 pt-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-muted/50 border">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                      {getInitials(selectedUser.displayName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{selectedUser.displayName}</h3>
                      <Badge
                        className={
                          selectedUser.status === "ativo"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {selectedUser.status === "ativo" ? "Ativo" : "Bloqueado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Email: {selectedUser.email ?? "—"}</p>
                    <p className="text-sm text-muted-foreground">CPF: {selectedUser.cpf ?? "—"}</p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={toggleUserStatus}
                  >
                    <Lock className="h-4 w-4" />
                    {selectedUser.status === "ativo" ? "Bloquear" : "Desbloquear"}
                  </Button>
                </div>

                <div className="grid gap-3 grid-cols-4">
                  <StatCard
                    icon={<ShoppingCart className="h-4 w-4 text-primary" />}
                    label="Total Pedidos"
                    value={selectedUser.ordersCount}
                  />
                  <StatCard
                    icon={<DollarSign className="h-4 w-4 text-green-500" />}
                    label="Total Gasto"
                    value={`R$ ${selectedUser.totalSpent.toFixed(2)}`}
                  />
                  <StatCard
                    icon={<Calendar className="h-4 w-4 text-blue-500" />}
                    label="Último Acesso"
                    value={selectedUser.lastAccessFormatted}
                    small
                  />
                  <StatCard
                    icon={<DollarSign className="h-4 w-4 text-purple-500" />}
                    label="Ticket Médio"
                    value={`R$ ${selectedUser.avgTicket.toFixed(2)}`}
                  />
                </div>

                <Tabs defaultValue="orders">
                  <TabsList className="border-b rounded-none bg-transparent">
                    <TabsTrigger value="orders">Histórico de Pedidos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="orders" className="mt-6">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pedido</TableHead>
                          <TableHead>Loja</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Pagamento</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders
                          .filter((order) => order.user_id === selectedUser.id)
                          .map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>#{order.order_number}</TableCell>
                              <TableCell>{storeMap.get(order.store_id) ?? "—"}</TableCell>
                              <TableCell>
                                {new Date(order.created_at).toLocaleString("pt-BR")}
                              </TableCell>
                              <TableCell>R$ {Number(order.total_amount).toFixed(2)}</TableCell>
                              <TableCell>{order.payment_method ?? "—"}</TableCell>
                              <TableCell>
                                <Badge
                                  className={
                                    statusColors[order.status] ??
                                    "bg-slate-100 text-slate-700"
                                  }
                                >
                                  {statusLabels[order.status] ?? order.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </AdminLayout>
  )
}

function StatCard({
  icon,
  label,
  value,
  small,
}: {
  icon: ReactNode
  label: string
  value: string | number
  small?: boolean
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
        <p className={small ? "text-sm font-bold" : "text-2xl font-bold"}>{value}</p>
      </CardContent>
    </Card>
  )
}
