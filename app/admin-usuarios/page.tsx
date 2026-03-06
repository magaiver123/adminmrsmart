"use client"

import { useState } from "react"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Pencil, Trash2, Shield, Eye, Edit, Trash, Settings } from "lucide-react"

const mockAdmins = [
  { 
    id: 1, 
    name: "Admin Principal", 
    email: "admin@kiosk.com", 
    role: "Super Admin", 
    status: "active",
    permissions: { view: true, edit: true, delete: true, configure: true },
    lastAccess: "18/01/2026 14:32"
  },
  { 
    id: 2, 
    name: "Carlos Operador", 
    email: "carlos@kiosk.com", 
    role: "Operador", 
    status: "active",
    permissions: { view: true, edit: true, delete: false, configure: false },
    lastAccess: "18/01/2026 12:15"
  },
  { 
    id: 3, 
    name: "Maria Visualização", 
    email: "maria@kiosk.com", 
    role: "Visualização", 
    status: "active",
    permissions: { view: true, edit: false, delete: false, configure: false },
    lastAccess: "17/01/2026 18:45"
  },
  { 
    id: 4, 
    name: "João Suporte", 
    email: "joao@kiosk.com", 
    role: "Operador", 
    status: "inactive",
    permissions: { view: true, edit: true, delete: false, configure: false },
    lastAccess: "10/01/2026 09:00"
  },
]

const roleColors = {
  "Super Admin": "bg-primary/10 text-primary",
  "Operador": "bg-blue-100 text-blue-700",
  "Visualização": "bg-gray-100 text-gray-700",
}

export default function AdminUsuariosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <AdminLayout title="Usuários do Admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p className="text-muted-foreground">
            Gerencie os usuários que têm acesso ao painel administrativo.
          </p>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Administrador
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Novo Administrador</DialogTitle>
                <DialogDescription>
                  Adicione um novo usuário com acesso ao painel admin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" placeholder="Ex: João Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" placeholder="joao@kiosk.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input id="password" type="password" placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil de Acesso</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="superadmin">Super Admin</SelectItem>
                      <SelectItem value="operador">Operador</SelectItem>
                      <SelectItem value="visualizacao">Visualização</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>Permissões</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="perm-view" defaultChecked />
                      <label htmlFor="perm-view" className="text-sm flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        Ver dados
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="perm-edit" />
                      <label htmlFor="perm-edit" className="text-sm flex items-center gap-2">
                        <Edit className="h-4 w-4 text-muted-foreground" />
                        Editar dados
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="perm-delete" />
                      <label htmlFor="perm-delete" className="text-sm flex items-center gap-2">
                        <Trash className="h-4 w-4 text-muted-foreground" />
                        Excluir dados
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="perm-config" />
                      <label htmlFor="perm-config" className="text-sm flex items-center gap-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        Configurar sistema
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => setIsModalOpen(false)}>Criar Administrador</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Role Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Super Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Acesso total ao sistema</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Operador
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">2</p>
              <p className="text-xs text-muted-foreground">Pode ver e editar dados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                Visualização
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">1</p>
              <p className="text-xs text-muted-foreground">Apenas visualização</p>
            </CardContent>
          </Card>
        </div>

        {/* Admins Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Administradores
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({mockAdmins.length} usuários)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Último Acesso</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAdmins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {admin.name.split(" ").map(n => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-xs text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={roleColors[admin.role as keyof typeof roleColors]}>
                        {admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {admin.permissions.view && (
                          <div className="h-6 w-6 rounded bg-green-100 flex items-center justify-center" title="Ver">
                            <Eye className="h-3 w-3 text-green-600" />
                          </div>
                        )}
                        {admin.permissions.edit && (
                          <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center" title="Editar">
                            <Edit className="h-3 w-3 text-blue-600" />
                          </div>
                        )}
                        {admin.permissions.delete && (
                          <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center" title="Excluir">
                            <Trash className="h-3 w-3 text-red-600" />
                          </div>
                        )}
                        {admin.permissions.configure && (
                          <div className="h-6 w-6 rounded bg-purple-100 flex items-center justify-center" title="Configurar">
                            <Settings className="h-3 w-3 text-purple-600" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{admin.lastAccess}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          admin.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {admin.status === "active" ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
