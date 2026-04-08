"use client"

import { useEffect, useMemo, useState } from "react"
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
import { Activity, Lock, Pencil, Plus, TestTube2 } from "lucide-react"
import {
  createLock,
  fetchLockDiagnosticEvents,
  fetchLockDiagnostics,
  fetchLocks,
  fetchLockLiveStatus,
  testOpenLock,
  updateLock,
  type LockDiagnosticEventRow,
  type LockDiagnosticRow,
  type LockLiveStatusRow,
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

function stageToLabel(stage: string) {
  if (stage === "created") return "Criado"
  if (stage === "publish_attempt") return "Tentativa de envio"
  if (stage === "published") return "Comando publicado"
  if (stage === "device_received") return "Comando recebido"
  if (stage === "unlock_started") return "Destravamento iniciado"
  if (stage === "unlock_completed") return "Destravamento concluído"
  if (stage === "unlock_failed") return "Falha no destravamento"
  if (stage === "timeout") return "Tempo esgotado"
  return stage || "Desconhecido"
}

function resultBadge(result: string) {
  if (result === "success") return <Badge className="bg-green-600">Sucesso</Badge>
  if (result === "error") return <Badge variant="destructive">Falha</Badge>
  if (result === "in_progress") return <Badge className="bg-blue-600">Em andamento</Badge>
  return <Badge variant="outline">Desconhecido</Badge>
}

function connectionBadge(status: "online" | "stale" | "offline" | "unknown") {
  if (status === "online") return <Badge className="bg-green-600">Online</Badge>
  if (status === "stale") return <Badge className="bg-yellow-600">Instável</Badge>
  if (status === "offline") return <Badge variant="secondary">Offline</Badge>
  return <Badge variant="outline">Desconhecido</Badge>
}

export default function FechadurasPage() {
  const { store } = useStore()
  const [locks, setLocks] = useState<LockRow[]>([])
  const [fridges, setFridges] = useState<FridgeRow[]>([])
  const [diagnostics, setDiagnostics] = useState<LockDiagnosticRow[]>([])
  const [liveStatus, setLiveStatus] = useState<LockLiveStatusRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
  const [realtimeWarning, setRealtimeWarning] = useState<string | null>(null)

  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [editingLock, setEditingLock] = useState<LockRow | null>(null)
  const [deviceId, setDeviceId] = useState("")
  const [status, setStatus] = useState<"pending" | "active" | "inactive">("active")
  const [saving, setSaving] = useState(false)

  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false)
  const [movingLock, setMovingLock] = useState<LockRow | null>(null)
  const [targetFridgeId, setTargetFridgeId] = useState("")

  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false)
  const [selectedDiagnostic, setSelectedDiagnostic] = useState<LockDiagnosticRow | null>(null)
  const [timelineEvents, setTimelineEvents] = useState<LockDiagnosticEventRow[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState<string | null>(null)

  const liveByLockId = useMemo(() => {
    const map = new Map<string, LockLiveStatusRow>()
    for (const item of liveStatus) map.set(item.lockId, item)
    return map
  }, [liveStatus])

  const summary = useMemo(() => {
    let online = 0
    let stale = 0
    let offline = 0
    let unknown = 0

    for (const item of liveStatus) {
      if (item.connectionStatus === "online") online += 1
      else if (item.connectionStatus === "stale") stale += 1
      else if (item.connectionStatus === "offline") offline += 1
      else unknown += 1
    }

    return { online, stale, offline, unknown }
  }, [liveStatus])

  async function loadRuntime(activeStoreId: string, silent = false) {
    if (!silent) setLoading(true)
    try {
      const [diagnosticsData, liveData] = await Promise.all([
        fetchLockDiagnostics(activeStoreId, 25),
        fetchLockLiveStatus(activeStoreId),
      ])
      setDiagnostics(diagnosticsData)
      setLiveStatus(liveData.items)
      setLastUpdatedAt(liveData.updatedAt)
    } catch (runtimeError) {
      setError(runtimeError instanceof Error ? runtimeError.message : "Erro ao atualizar status em tempo real.")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  async function loadAll(activeStoreId: string) {
    setLoading(true)
    setError(null)
    try {
      const [locksData, fridgesData, diagnosticsData, liveData] = await Promise.all([
        fetchLocks(activeStoreId),
        fetchFridges(activeStoreId),
        fetchLockDiagnostics(activeStoreId, 25),
        fetchLockLiveStatus(activeStoreId),
      ])
      setLocks(locksData)
      setFridges(fridgesData)
      setDiagnostics(diagnosticsData)
      setLiveStatus(liveData.items)
      setLastUpdatedAt(liveData.updatedAt)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar módulo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!store?.id) {
      setLocks([])
      setFridges([])
      setDiagnostics([])
      setLiveStatus([])
      setRealtimeWarning(null)
      return
    }

    void loadAll(store.id)

    const fallbackInterval = window.setInterval(() => {
      void loadRuntime(store.id, true)
    }, 8000)

    let eventSource: EventSource | null = null
    try {
      eventSource = new EventSource(`/api/admin/locks/realtime?store_id=${store.id}`)
      eventSource.addEventListener("snapshot", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data)
          if (Array.isArray(payload?.diagnostics)) {
            setDiagnostics(payload.diagnostics as LockDiagnosticRow[])
          }
          if (Array.isArray(payload?.liveStatus)) {
            setLiveStatus(payload.liveStatus as LockLiveStatusRow[])
          }
          if (typeof payload?.updatedAt === "string") {
            setLastUpdatedAt(payload.updatedAt)
          }
          setRealtimeWarning(null)
        } catch {
          setRealtimeWarning("Falha ao interpretar evento em tempo real. Usando atualização periódica.")
        }
      })
      eventSource.addEventListener("error", () => {
        setRealtimeWarning("Canal em tempo real indisponível. Usando atualização periódica.")
      })
    } catch {
      setRealtimeWarning("Canal em tempo real indisponível. Usando atualização periódica.")
    }

    return () => {
      window.clearInterval(fallbackInterval)
      if (eventSource) eventSource.close()
    }
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
      setError("device_id é obrigatório para lock ativo/inativo.")
      return
    }
    if (status === "pending" && deviceId.trim()) {
      setError("Lock pendente não deve ter device_id.")
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
      const traceSuffix = response?.traceId ? ` | trace: ${response.traceId}` : ""
      setFeedback(
        `Comando enviado para ${response.deviceId || lock.device_id || "lock"} (tópico: ${response.topic}).${traceSuffix}`,
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

  async function openTimelineModal(diag: LockDiagnosticRow) {
    if (!store?.id) return
    setSelectedDiagnostic(diag)
    setTimelineEvents([])
    setTimelineError(null)
    setTimelineLoading(true)
    setIsTimelineModalOpen(true)

    try {
      const events = await fetchLockDiagnosticEvents({
        store_id: store.id,
        trace_id: diag.traceId,
        limit: 100,
      })
      setTimelineEvents(events)
    } catch (timelineLoadError) {
      setTimelineError(
        timelineLoadError instanceof Error
          ? timelineLoadError.message
          : "Erro ao carregar a linha do tempo.",
      )
    } finally {
      setTimelineLoading(false)
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
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ESP Online</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-green-600">{summary.online}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ESP Instável</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-yellow-600">{summary.stale}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">ESP Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-zinc-700">{summary.offline}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Sem Telemetria</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold text-zinc-500">{summary.unknown}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Fechaduras da loja {store.name}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Cadastre, configure e acompanhe o fluxo MQTT/ESP em tempo real.
              </p>
              {lastUpdatedAt ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Última atualização: {new Date(lastUpdatedAt).toLocaleString("pt-BR")}
                </p>
              ) : null}
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
            {realtimeWarning ? (
              <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-700">
                {realtimeWarning}
              </div>
            ) : null}
            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead>Conexão ESP</TableHead>
                  <TableHead>Último Comando</TableHead>
                  <TableHead>Geladeira</TableHead>
                  <TableHead>Habilitada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {locks.map((lock) => {
                  const live = liveByLockId.get(lock.id)
                  const command = live?.lastCommand
                  const canTest =
                    Boolean(lock.device_id) &&
                    lock.status === "active" &&
                    live?.connectionStatus === "online"
                  return (
                    <TableRow key={lock.id}>
                      <TableCell className="font-mono text-xs">{lock.device_id || "-"}</TableCell>
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
                      <TableCell>{live ? connectionBadge(live.connectionStatus) : connectionBadge("unknown")}</TableCell>
                      <TableCell>
                        {command ? (
                          <div className="space-y-1">
                            {resultBadge(command.result)}
                            <p className="text-xs text-muted-foreground">{stageToLabel(command.stage)}</p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sem comando recente</span>
                        )}
                      </TableCell>
                      <TableCell>{lock.fridge ? `${lock.fridge.name} (${lock.fridge.code})` : "-"}</TableCell>
                      <TableCell>{lock.enabled ? "Sim" : "Não"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTestOpen(lock)}
                            disabled={!canTest}
                            className="gap-2"
                          >
                            <TestTube2 className="h-4 w-4" />
                            Testar
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openMoveModal(lock)}>
                            Mover
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(lock)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {locks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
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
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Diagnóstico (últimos comandos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diagnostics.map((diag) => (
                  <TableRow key={diag.id}>
                    <TableCell>{new Date(diag.createdAt || diag.created_at).toLocaleString("pt-BR")}</TableCell>
                    <TableCell className="font-mono text-xs">{diag.device_id || "-"}</TableCell>
                    <TableCell>{diag.source || "-"}</TableCell>
                    <TableCell>{stageToLabel(diag.stage || diag.status)}</TableCell>
                    <TableCell>{resultBadge(diag.result)}</TableCell>
                    <TableCell className="font-mono text-xs">{diag.code || "-"}</TableCell>
                    <TableCell className="text-xs text-red-600">{diag.error || "-"}</TableCell>
                    <TableCell>{diag.attempts}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openTimelineModal(diag)}>
                        Timeline
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {diagnostics.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
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
                <Select value={status} onValueChange={(value) => setStatus(value as "pending" | "active" | "inactive")}>
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
                Se a fechadura de destino já estiver vinculada, o sistema faz a troca (swap) automaticamente.
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

        <Dialog open={isTimelineModalOpen} onOpenChange={setIsTimelineModalOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Linha do Tempo do Comando</DialogTitle>
            </DialogHeader>

            {selectedDiagnostic ? (
              <div className="space-y-3">
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <p><span className="font-semibold">Trace:</span> {selectedDiagnostic.traceId}</p>
                  <p><span className="font-semibold">Device:</span> {selectedDiagnostic.device_id || "-"}</p>
                  <p><span className="font-semibold">Socket:</span> {selectedDiagnostic.socketId || "-"}</p>
                </div>

                {timelineError ? (
                  <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {timelineError}
                  </div>
                ) : null}

                {timelineLoading ? (
                  <p className="text-sm text-muted-foreground">Carregando timeline...</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Etapa</TableHead>
                        <TableHead>Resultado</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Mensagem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timelineEvents.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>{new Date(event.created_at).toLocaleString("pt-BR")}</TableCell>
                          <TableCell>{stageToLabel(event.stage)}</TableCell>
                          <TableCell>{resultBadge(event.result)}</TableCell>
                          <TableCell className="font-mono text-xs">{event.code || "-"}</TableCell>
                          <TableCell className="text-xs text-red-600">{event.error || "-"}</TableCell>
                        </TableRow>
                      ))}
                      {timelineEvents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Sem eventos para este trace.
                          </TableCell>
                        </TableRow>
                      ) : null}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
