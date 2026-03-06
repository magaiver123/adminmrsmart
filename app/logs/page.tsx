"use client"

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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  FileText,
  DollarSign,
  Package,
  Trash2,
  Settings,
  UserCog,
  Download,
  Filter,
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import Loading from "./loading"

const mockLogs = [
  {
    id: 1,
    user: "Admin Principal",
    action: "Alteração de preço",
    description: 'Produto "X-Burger Especial" alterado de R$ 25,90 para R$ 29,90',
    type: "price",
    date: "18/01/2026 14:32:15",
  },
  {
    id: 2,
    user: "Carlos Operador",
    action: "Ajuste de estoque",
    description: 'Entrada de 50 unidades em "Refrigerante 2L"',
    type: "stock",
    date: "18/01/2026 13:45:22",
  },
  {
    id: 3,
    user: "Admin Principal",
    action: "Exclusão de produto",
    description: 'Produto "Combo Antigo" removido do sistema',
    type: "delete",
    date: "18/01/2026 12:15:08",
  },
  {
    id: 4,
    user: "Admin Principal",
    action: "Configuração alterada",
    description: "Horário de funcionamento atualizado para 08:00 - 23:00",
    type: "config",
    date: "18/01/2026 11:30:45",
  },
  {
    id: 5,
    user: "Carlos Operador",
    action: "Ajuste de estoque",
    description: 'Saída de 25 unidades em "Batata Frita Grande" - Motivo: Perda',
    type: "stock",
    date: "18/01/2026 10:22:33",
  },
  {
    id: 6,
    user: "Admin Principal",
    action: "Novo administrador",
    description: 'Usuário "Maria Visualização" criado com perfil Visualização',
    type: "user",
    date: "17/01/2026 18:45:12",
  },
  {
    id: 7,
    user: "Admin Principal",
    action: "Alteração de preço",
    description: 'Categoria "Combos" - desconto de 10% aplicado em todos os produtos',
    type: "price",
    date: "17/01/2026 16:30:00",
  },
  {
    id: 8,
    user: "Carlos Operador",
    action: "Pedido cancelado",
    description: 'Pedido #2844 cancelado - Motivo: Solicitação do cliente',
    type: "delete",
    date: "17/01/2026 14:55:18",
  },
  {
    id: 9,
    user: "Admin Principal",
    action: "Configuração alterada",
    description: "Modo manutenção ativado por 30 minutos",
    type: "config",
    date: "17/01/2026 09:00:00",
  },
  {
    id: 10,
    user: "Carlos Operador",
    action: "Ajuste de estoque",
    description: 'Entrada de 100 unidades em "Água Mineral 500ml"',
    type: "stock",
    date: "16/01/2026 15:20:45",
  },
]

const typeConfig = {
  price: { label: "Preço", color: "bg-green-100 text-green-700", icon: DollarSign },
  stock: { label: "Estoque", color: "bg-blue-100 text-blue-700", icon: Package },
  delete: { label: "Exclusão", color: "bg-red-100 text-red-700", icon: Trash2 },
  config: { label: "Configuração", color: "bg-purple-100 text-purple-700", icon: Settings },
  user: { label: "Usuário", color: "bg-yellow-100 text-yellow-700", icon: UserCog },
}

export default function LogsPage() {
  const searchParams = useSearchParams()

  return (
    <AdminLayout title="Logs / Auditoria">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground">
            Registro de todas as ações realizadas no sistema.
          </p>
          <Button variant="outline" className="gap-2 bg-transparent">
            <Download className="h-4 w-4" />
            Exportar Logs
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-5">
          {Object.entries(typeConfig).map(([key, config]) => {
            const count = mockLogs.filter(l => l.type === key).length
            const Icon = config.icon
            return (
              <Card key={key}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{config.label}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-lg ${config.color} flex items-center justify-center`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar nos logs..." className="pl-9" />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo de ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="price">Alteração de preço</SelectItem>
              <SelectItem value="stock">Ajuste de estoque</SelectItem>
              <SelectItem value="delete">Exclusão</SelectItem>
              <SelectItem value="config">Configuração</SelectItem>
              <SelectItem value="user">Usuário</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Usuário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Admin Principal</SelectItem>
              <SelectItem value="carlos">Carlos Operador</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="date" className="w-[160px]" />
            <Input type="date" className="w-[160px]" />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Histórico de Ações
              <span className="text-sm font-normal text-muted-foreground">
                ({mockLogs.length} registros)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<Loading />}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Descrição</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockLogs.map((log) => {
                    const config = typeConfig[log.type as keyof typeof typeConfig]
                    const Icon = config.icon
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {log.date}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {log.user.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{log.user}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`${config.color} gap-1`}>
                            <Icon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.action}</TableCell>
                        <TableCell className="max-w-md truncate text-muted-foreground">
                          {log.description}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
