"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useStore } from "@/components/admin/store-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Pencil, Plus, Refrigerator } from "lucide-react"
import {
  createFridge,
  fetchFridges,
  fetchNextFridgeCode,
  inactivateFridge,
  updateFridge,
} from "@/src/services/fridges.service"
import { fetchLocks } from "@/src/services/locks.service"

type FridgeRow = {
  id: string
  name: string
  code: string
  status: "active" | "inactive" | string
  is_primary: boolean
  lock_id: string
  lock: {
    id: string
    device_id: string | null
    status: string
    enabled: boolean
  } | null
}

type LockRow = {
  id: string
  device_id: string | null
  status: string
  enabled: boolean
  fridge?: {
    id: string
    name: string
    code: string
  } | null
}

export default function GeladeirasPage() {
  const { store } = useStore()
  const [loading, setLoading] = useState(false)
  const [fridges, setFridges] = useState<FridgeRow[]>([])
  const [locks, setLocks] = useState<LockRow[]>([])
  const [nextCode, setNextCode] = useState("")
  const [error, setError] = useState<string | null>(null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState<"create" | "edit">("create")
  const [editingFridge, setEditingFridge] = useState<FridgeRow | null>(null)
  const [name, setName] = useState("")
  const [lockId, setLockId] = useState("")
  const [status, setStatus] = useState<"active" | "inactive">("active")
  const [isPrimary, setIsPrimary] = useState(false)
  const [saving, setSaving] = useState(false)
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const [expectedCode, setExpectedCode] = useState("")

  async function loadAll(activeStoreId: string) {
    setLoading(true)
    setError(null)
    try {
      const [fridgeData, lockData, previewCode] = await Promise.all([
        fetchFridges(activeStoreId),
        fetchLocks(activeStoreId),
        fetchNextFridgeCode(activeStoreId),
      ])
      setFridges(fridgeData)
      setLocks(lockData)
      setNextCode(previewCode)
      setExpectedCode(previewCode)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar modulo.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!store?.id) {
      setFridges([])
      setLocks([])
      return
    }
    void loadAll(store.id)
  }, [store?.id])

  const availableLocksForCreate = useMemo(
    () =>
      locks.filter(
        (lock) =>
          lock.enabled === true &&
          lock.status === "active" &&
          !lock.fridge &&
          typeof lock.device_id === "string" &&
          lock.device_id.trim() !== "",
      ),
    [locks],
  )

  const availableLocksForEdit = useMemo(
    () =>
      locks.filter(
        (lock) =>
          lock.enabled === true &&
          lock.status === "active" &&
          (lock.fridge?.id === editingFridge?.id || !lock.fridge) &&
          typeof lock.device_id === "string" &&
          lock.device_id.trim() !== "",
      ),
    [locks, editingFridge?.id],
  )

  const openCreateModal = () => {
    setMode("create")
    setEditingFridge(null)
    setName("")
    setLockId("")
    setStatus("active")
    setIsPrimary(false)
    setConflictMessage(null)
    setExpectedCode(nextCode)
    setIsModalOpen(true)
  }

  const openEditModal = (fridge: FridgeRow) => {
    setMode("edit")
    setEditingFridge(fridge)
    setName(fridge.name)
    setLockId(fridge.lock_id)
    setStatus(fridge.status === "inactive" ? "inactive" : "active")
    setIsPrimary(fridge.is_primary)
    setConflictMessage(null)
    setIsModalOpen(true)
  }

  async function handleSave() {
    if (!store?.id) return
    if (!name.trim()) return

    if (mode === "create" && availableLocksForCreate.length === 0) {
      setError("Nao ha fechadura ativa disponivel. Cadastre em Fechaduras antes de salvar.")
      return
    }

    if (!lockId) {
      setError("Selecione uma fechadura para a geladeira.")
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (mode === "create") {
        const response = await createFridge({
          store_id: store.id,
          name: name.trim(),
          lock_id: lockId,
          expected_code: expectedCode,
        })

        if (response.conflict === true) {
          const newCode =
            typeof response.nextCode === "string" ? response.nextCode : response.next_code
          if (typeof newCode === "string" && newCode) {
            setExpectedCode(newCode)
            setConflictMessage(
              `Codigo atualizado para ${newCode}. Clique em salvar novamente para confirmar.`,
            )
            return
          }
        }
      } else if (editingFridge) {
        await updateFridge({
          store_id: store.id,
          fridge_id: editingFridge.id,
          name: name.trim(),
          status,
          lock_id: lockId,
          is_primary: isPrimary,
        })
      }

      setIsModalOpen(false)
      await loadAll(store.id)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar geladeira.")
    } finally {
      setSaving(false)
    }
  }

  async function handleInactivate(fridge: FridgeRow) {
    if (!store?.id) return
    if (!confirm(`Inativar a geladeira ${fridge.name}?`)) return
    try {
      await inactivateFridge(store.id, fridge.id)
      await loadAll(store.id)
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Erro ao inativar geladeira.")
    }
  }

  if (!store) {
    return (
      <AdminLayout title="Geladeiras">
        <p className="text-muted-foreground">Selecione uma loja para gerenciar geladeiras.</p>
      </AdminLayout>
    )
  }

  const lockOptions = mode === "create" ? availableLocksForCreate : availableLocksForEdit

  return (
    <AdminLayout title="Geladeiras">
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Refrigerator className="h-5 w-5" />
                Geladeiras da loja {store.name}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada geladeira precisa de uma fechadura ativa vinculada.
              </p>
            </div>
            <Button onClick={openCreateModal} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Geladeira
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {error ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {loading ? <p className="text-sm text-muted-foreground">Carregando...</p> : null}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Fechadura</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fridges.map((fridge) => (
                  <TableRow key={fridge.id}>
                    <TableCell className="font-medium">{fridge.name}</TableCell>
                    <TableCell>{fridge.code}</TableCell>
                    <TableCell>
                      {fridge.lock?.device_id ? (
                        <span className="font-mono text-xs">{fridge.lock.device_id}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Sem device</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={fridge.status === "active" ? "default" : "secondary"}>
                        {fridge.status === "active" ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell>{fridge.is_primary ? "Sim" : "Nao"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(fridge)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {!fridge.is_primary ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInactivate(fridge)}
                          >
                            Inativar
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {fridges.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Nenhuma geladeira cadastrada.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{mode === "create" ? "Nova Geladeira" : "Editar Geladeira"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {mode === "create" ? (
                <div className="space-y-1">
                  <Label>Codigo</Label>
                  <Input value={expectedCode} disabled />
                </div>
              ) : null}

              <div className="space-y-1">
                <Label>Nome</Label>
                <Input value={name} onChange={(event) => setName(event.target.value)} />
              </div>

              <div className="space-y-1">
                <Label>Fechadura</Label>
                <Select value={lockId} onValueChange={setLockId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a fechadura" />
                  </SelectTrigger>
                  <SelectContent>
                    {lockOptions.map((lock) => (
                      <SelectItem key={lock.id} value={lock.id}>
                        {lock.device_id || "Sem device"} ({lock.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {mode === "create" && lockOptions.length === 0 ? (
                  <p className="text-xs text-orange-600">
                    Nao ha fechaduras disponiveis. Cadastre em Fechaduras primeiro.
                  </p>
                ) : null}
              </div>

              {mode === "edit" ? (
                <>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={status}
                      onValueChange={(value) => setStatus(value as "active" | "inactive")}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="inactive">Inativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <Label htmlFor="primary-switch">Geladeira principal</Label>
                    <Switch
                      id="primary-switch"
                      checked={isPrimary}
                      onCheckedChange={setIsPrimary}
                    />
                  </div>
                </>
              ) : null}

              {conflictMessage ? (
                <div className="rounded-md border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                  {conflictMessage}
                </div>
              ) : null}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving || !name.trim() || !lockId}>
                  {saving ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
