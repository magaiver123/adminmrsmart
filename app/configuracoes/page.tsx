"use client"

import { AdminLayout } from "@/components/admin/admin-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Upload,
  Settings,
  Palette,
  Clock,
  Power,
  AlertTriangle,
  ImageIcon,
} from "lucide-react"

export default function ConfiguracoesPage() {
  return (
    <AdminLayout title="Configurações">
      <div className="space-y-6 max-w-4xl">
        {/* System Info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Informações do Sistema</CardTitle>
            </div>
            <CardDescription>
              Configure as informações básicas do sistema de autoatendimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="systemName">Nome do Sistema</Label>
              <Input id="systemName" defaultValue="Kiosk Autoatendimento" />
            </div>
            <div className="space-y-2">
              <Label>Logo do Sistema</Label>
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <Button variant="outline" className="gap-2 bg-transparent">
                    <Upload className="h-4 w-4" />
                    Fazer Upload
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    PNG ou SVG, tamanho recomendado: 200x200px
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Cores do Sistema</CardTitle>
            </div>
            <CardDescription>
              Personalize as cores da interface do autoatendimento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <div className="flex gap-2">
                  <Input id="primaryColor" defaultValue="#f97316" className="flex-1" />
                  <div className="h-9 w-9 rounded-md border border-border bg-primary" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondaryColor">Cor Secundária</Label>
                <div className="flex gap-2">
                  <Input id="secondaryColor" defaultValue="#000000" className="flex-1" />
                  <div className="h-9 w-9 rounded-md border border-border bg-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input id="backgroundColor" defaultValue="#ffffff" className="flex-1" />
                  <div className="h-9 w-9 rounded-md border border-border bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Cor de Destaque</Label>
                <div className="flex gap-2">
                  <Input id="accentColor" defaultValue="#f97316" className="flex-1" />
                  <div className="h-9 w-9 rounded-md border border-border bg-accent" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Operating Hours */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Horário de Funcionamento</CardTitle>
            </div>
            <CardDescription>
              Defina os horários em que o sistema estará disponível para pedidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((day) => (
                <div key={day} className="flex items-center gap-4">
                  <span className="w-24 text-sm font-medium">{day}</span>
                  <Input type="time" defaultValue="08:00" className="w-32" />
                  <span className="text-muted-foreground">até</span>
                  <Input type="time" defaultValue="22:00" className="w-32" />
                  <Switch defaultChecked={day !== "Domingo"} />
                  <span className="text-sm text-muted-foreground">
                    {day === "Domingo" ? "Fechado" : "Aberto"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Controls */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Power className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">Controles do Sistema</CardTitle>
            </div>
            <CardDescription>
              Gerencie o funcionamento geral do sistema de autoatendimento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Aceitar Pedidos</Label>
                <p className="text-sm text-muted-foreground">
                  Habilita ou desabilita o recebimento de novos pedidos.
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <Label className="text-base">Modo Manutenção</Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  Quando ativado, exibe uma mensagem de manutenção para os clientes.
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button size="lg">Salvar Configurações</Button>
        </div>
      </div>
    </AdminLayout>
  )
}
