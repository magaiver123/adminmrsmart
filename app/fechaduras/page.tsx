"use client"

import { useEffect, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useStore } from "@/components/admin/store-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Lock, Pencil, Plus, TestTube2 } from "lucide-react"
import {
  createLock,
  fetchLockDiagnostics,
  fetchLocks,
  testOpenLock,
  updateLock,
} from "@/src/services/locks.service"
import { fetchFridges, updateFridge } from "@/src/services/fridges.service"

type LockRow = {
  id: string
  device_id: string | null
  status: "pending" | "active" | "inactive" | string
  enabled: boolean
  is_primary: boolean
  fridge?: {
    id: string
    name: string
    code: string
  } | null
}

type FridgeRow = {
  id: string
  name: string
  code: string
}

type DiagnosticRow = {
  id: string
  order_id: string
  device_id: string
  topic: string
  status: string
  error: string | null
  attempts: number
  created_at: string
}

export default function FechadurasPage() {
  const { store } = useStore()
  const [locks, setLocks] = useState<LockRow[]>([])
  const [fridges, setFridges] = useState<FridgeRow[]>([])
  const [diagnostics, setDiagnostics] = useState<DiagnosticRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)

  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [editingLock, setEditingLock] = useState<LockRow | null>(null)
  const [deviceId, setDeviceId] = useState("")
  const [status, setStatus] = useState<"pending" | "active" | "inactive">("active")
  const [saving, setSaving] = useState(false)

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [movingLock, setMovingLock] = useState<LockRow | null>(null)
  const [targetFridgeId, setTargetFridgeId] = useState("")

  async function loadAll(activeStoreId: string) {
    setLoading(true)
    setError(null)
    try {
      const [locksData, fridgesData, diagnosticsData] = await Promise.all([
        fetchLocks(activeStoreId),
        fetchFridges(activeStoreId),
        fetchLockDiagnostics(activeStoreId, 25),
      ])
      setLocks(locksData)
      setFridges(fridgesData)
      setDiagnostics(diagnosticsData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar modulo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!store?.id) {
      setLocks([])
      setFridges([])
      setDiagnostics([])
      return
    }
    void loadAll(store.id)
  }, [store?.id])

  const openCreateModal = () => {
    setMode("create")
    setEditingLock(null)
    setDeviceId("")
    setStatus("active")
    setIsLockModalOpen(true)
  }

  const openEditModal = (lock: LockRow) => {
    setMode("edit")
    setEditingLock(lock)
    setDeviceId(lock.device_id || "")
    setStatus(lock.status === "pending" || lock.status === "inactive" ? lock.status : "active")
    setIsLockModalOpen(true)
  }

  async function handleSaveLock() {
    if (!store?.id) return
    if ((status === "active" || status === "inactive") && !deviceId.trim()) {
      setError("device_id e obrigatorio para lock ativo/inativo.")
      return
    }
    if (status === "pending" && deviceId.trim()) {
      setError("Lock pendente nao deve ter device_id.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (mode === "create") {
        await createLock({
          store_id: store.id,
          device_id: deviceId.trim() || null,
          status,
        })
      } else if (editingLock) {
        await updateLock({
          store_id: store.id,
          lock_id: editingLock.id,
          device_id: deviceId.trim() || null,
          status,
        })
      }
      setIsLockModalOpen(false)
      await loadAll(store.id)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar fechadura.")
    } finally {
      setSaving(false)
    }
  }

  async function handleTestOpen(lock: LockRow) {
    if (!store?.id) return
    setFeedback(null)
    setError(null)
    try {
      const response = await testOpenLock({
        store_id: store.id,
        lock_id: lock.id,
      })
      setFeedback(
        `Comando enviado para ${response.deviceId || lock.device_id || "lock"} (topic: ${response.topic}).`,
      )
      await loadAll(store.id)
    } catch (testError) {
      setError(testError instanceof Error ? testError.message : "Erro no teste de abertura.")
    }
  }

  const openMoveModal = (lock: LockRow) => {
    setMovingLock(lock)
    setTargetFridgeId(lock.fridge?.id || "")
    setIsMoveModalOpen(true)
  }

  async function handleMoveLock() {
    if (!store?.id || !movingLock || !targetFridgeId) return
    try {
      await updateFridge({
        store_id: store.id,
        fridge_id: targetFridgeId,
        lock_id: movingLock.id,
      })
      setIsMoveModalOpen(false)
      await loadAll(store.id)
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : "Erro ao mover fechadura.")
    }
  }

  if (!store) {
    return (
      <AdminLayout title="Fechaduras">
        <p className="text-muted-foreground">Selecione uma loja para gerenciar fechaduras.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Fechaduras">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Fechaduras da loja {store.name}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre, configure e teste as fechaduras da operacao MQTT/ESP.
              </p>
            </div>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Fechadura
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
            {feedback ? (
              <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-700">
                {feedback}
              </div>
            ) : null}
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Geladeira</TableHead>
                  <TableHead>Habilitada</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locks.map((lock) => (
                  <TableRow key={lock.id}>
                    <TableCell className="font-mono text-xs">
                      {lock.device_id || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          lock.status === "active"
                            ? "default"
                            : lock.status === "pending"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {lock.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {lock.fridge ? `${lock.fridge.name} (${lock.fridge.code})` : "-"}
                    </TableCell>
                    <TableCell>{lock.enabled ? "Sim" : "Nao"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTestOpen(lock)}
                          disabled={!lock.device_id || lock.status !== "active"}
                          className="gap-2"
                        >
                          <TestTube2 className="h-4 w-4" />
                          Testar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openMoveModal(lock)}
                        >
                          Mover
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(lock)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {locks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Nenhuma fechadura cadastrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Diagnostico (ultimos comandos)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Erro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnostics.map((diag) => (
                  <TableRow key={diag.id}>
                    <TableCell>{new Date(diag.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="font-mono text-xs">{diag.device_id}</TableCell>
                    <TableCell>{diag.status}</TableCell>
                    <TableCell>{diag.attempts}</TableCell>
                    <TableCell className="text-xs text-red-600">{diag.error || "-"}</TableCell>
                  </TableRow>
                ))}
                {diagnostics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Sem comandos recentes.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isLockModalOpen} onOpenChange={setIsLockModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "Nova Fechadura" : "Editar Fechadura"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Device ID (ESP)</Label>
                <Input
                  value={deviceId}
                  onChange={(event) => setDeviceId(event.target.value)}
                  placeholder={status === "pending" ? "Deixe vazio para pendente" : "ESP_ab12cd34"}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) =>
                    setStatus(value as "pending" | "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsLockModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveLock} disabled={saving}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Mover Fechadura</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Se a fechadura destino ja estiver vinculada, o sistema faz a troca (swap) automaticamente.
              </p>
              <div className="space-y-1">
                <Label>Geladeira de destino</Label>
                <Select value={targetFridgeId} onValueChange={setTargetFridgeId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a geladeira" />
                  </SelectTrigger>
                  <SelectContent>
                    {fridges.map((fridge) => (
                      <SelectItem key={fridge.id} value={fridge.id}>
                        {fridge.name} ({fridge.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsMoveModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleMoveLock} disabled={!targetFridgeId}>
                  Confirmar movimento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
