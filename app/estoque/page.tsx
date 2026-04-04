"use client"

import { useEffect, useMemo, useState } from "react"
import { AdminLayout } from "@/components/admin/admin-layout"
import { useStore } from "@/components/admin/store-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { History, Refrigerator } from "lucide-react"
import { fetchFridges } from "@/src/services/fridges.service"
import {
  adjustFridgeInventoryApi,
  fetchFridgeInventoryHistory,
  fetchFridgeInventoryProducts,
  setFridgeMixItem,
} from "@/src/services/fridgeInventory.service"

type FridgeRow = {
  id: string
  name: string
  code: string
  status: string
}

type ProductRow = {
  id: string
  name: string
  in_mix: boolean
  quantity: number
}

type HistoryRow = {
  id: string
  product: string
  type: string
  qty: number
  reason: string | null
  created_at: string
}

export default function EstoquePage() {
  const { store } = useStore()

  const [fridges, setFridges] = useState<FridgeRow[]>([])
  const [selectedFridgeId, setSelectedFridgeId] = useState<string>("")
  const [products, setProducts] = useState<ProductRow[]>([])
  const [history, setHistory] = useState<HistoryRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [savingMixByProduct, setSavingMixByProduct] = useState<Record<string, boolean>>({})

  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null)
  const [movementType, setMovementType] = useState<"entrada" | "saida">("entrada")
  const [quantity, setQuantity] = useState("")
  const [reason, setReason] = useState("")
  const [savingAdjust, setSavingAdjust] = useState(false)

  async function loadFridges(storeId: string) {
    const fridgeData = await fetchFridges(storeId)
    const activeFridges = fridgeData.filter((fridge: FridgeRow) => fridge.status === "active")
    setFridges(activeFridges)
    if (!selectedFridgeId || !activeFridges.some((fridge) => fridge.id === selectedFridgeId)) {
      setSelectedFridgeId(activeFridges[0]?.id || "")
    }
  }

  async function loadInventory(storeId: string, fridgeId: string) {
    if (!fridgeId) return
    setLoading(true)
    setError(null)
    try {
      const [productData, historyData] = await Promise.all([
        fetchFridgeInventoryProducts(storeId, fridgeId),
        fetchFridgeInventoryHistory(storeId, fridgeId),
      ])
      setProducts(productData)
      setHistory(historyData)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Erro ao carregar estoque.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!store?.id) {
      setFridges([])
      setSelectedFridgeId("")
      setProducts([])
      setHistory([])
      return
    }
    void loadFridges(store.id)
  }, [store?.id])

  useEffect(() => {
    if (!store?.id || !selectedFridgeId) {
      setProducts([])
      setHistory([])
      return
    }
    void loadInventory(store.id, selectedFridgeId)
  }, [store?.id, selectedFridgeId])

  const selectedFridge = useMemo(
    () => fridges.find((fridge) => fridge.id === selectedFridgeId) || null,
    [fridges, selectedFridgeId],
  )

  const stats = useMemo(() => {
    const inMix = products.filter((product) => product.in_mix)
    const lowStock = inMix.filter((product) => product.quantity > 0 && product.quantity <= 5).length
    const outOfStock = inMix.filter((product) => product.quantity === 0).length
    return {
      totalProducts: products.length,
      inMix: inMix.length,
      lowStock,
      outOfStock,
    }
  }, [products])

  async function handleToggleMix(product: ProductRow, checked: boolean) {
    if (!store?.id || !selectedFridgeId) return
    setSavingMixByProduct((prev) => ({ ...prev, [product.id]: true }))
    try {
      await setFridgeMixItem({
        store_id: store.id,
        fridge_id: selectedFridgeId,
        product_id: product.id,
        in_mix: checked,
      })
      await loadInventory(store.id, selectedFridgeId)
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Erro ao atualizar mix.")
    } finally {
      setSavingMixByProduct((prev) => ({ ...prev, [product.id]: false }))
    }
  }

  function openAdjustModal(product: ProductRow) {
    setSelectedProduct(product)
    setMovementType("entrada")
    setQuantity("")
    setReason("")
    setIsAdjustModalOpen(true)
  }

  async function handleConfirmAdjust() {
    if (!store?.id || !selectedFridgeId || !selectedProduct) return
    const qty = Number(quantity)
    if (!Number.isFinite(qty) || qty <= 0) return

    setSavingAdjust(true)
    setError(null)
    try {
      await adjustFridgeInventoryApi({
        store_id: store.id,
        fridge_id: selectedFridgeId,
        product_id: selectedProduct.id,
        type: movementType,
        quantity: qty,
        reason,
      })
      setIsAdjustModalOpen(false)
      await loadInventory(store.id, selectedFridgeId)
    } catch (adjustError) {
      setError(adjustError instanceof Error ? adjustError.message : "Erro ao ajustar estoque.")
    } finally {
      setSavingAdjust(false)
    }
  }

  if (!store) {
    return (
      <AdminLayout title="Estoque">
        <p className="text-muted-foreground">Selecione uma loja para gerenciar estoque.</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Estoque">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Refrigerator className="h-5 w-5" />
              Estoque por Geladeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[320px_1fr]">
              <div className="space-y-1">
                <Label>Geladeira</Label>
                <Select value={selectedFridgeId} onValueChange={setSelectedFridgeId}>
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
              <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm">
                {selectedFridge ? (
                  <p>
                    Operacao ativa em <strong>{selectedFridge.name}</strong> ({selectedFridge.code}).
                  </p>
                ) : (
                  <p className="text-muted-foreground">Sem geladeira selecionada.</p>
                )}
              </div>
            </div>

            {error ? (
              <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">No Mix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inMix}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Estoque Baixo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.lowStock}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Zerados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.outOfStock}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="mix" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mix">Mix e Quantidade</TabsTrigger>
            <TabsTrigger value="history">Historico da Geladeira</TabsTrigger>
          </TabsList>

          <TabsContent value="mix">
            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">Carregando...</p>
                ) : null}

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>No Mix</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Acoes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const isLow = product.in_mix && product.quantity > 0 && product.quantity <= 5
                      const isOut = product.in_mix && product.quantity === 0
                      const statusLabel = !product.in_mix
                        ? "Fora do mix"
                        : isOut
                        ? "Sem estoque"
                        : isLow
                        ? "Baixo"
                        : "OK"

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>
                            <Switch
                              checked={product.in_mix}
                              disabled={savingMixByProduct[product.id] === true}
                              onCheckedChange={(checked) => void handleToggleMix(product, checked)}
                            />
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant={product.in_mix ? "default" : "secondary"}
                              className={
                                product.in_mix
                                  ? isOut
                                    ? "bg-red-600"
                                    : isLow
                                    ? "bg-yellow-500"
                                    : ""
                                  : ""
                              }
                            >
                              {statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!product.in_mix}
                              onClick={() => openAdjustModal(product)}
                            >
                              Ajustar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Nenhum produto encontrado para esta loja.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <History className="h-4 w-4" />
                  Historico de movimentacoes
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{new Date(entry.created_at).toLocaleString("pt-BR")}</TableCell>
                        <TableCell>{entry.product}</TableCell>
                        <TableCell>{entry.type}</TableCell>
                        <TableCell>{entry.qty}</TableCell>
                        <TableCell>{entry.reason || "-"}</TableCell>
                      </TableRow>
                    ))}
                    {history.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          Sem historico para esta geladeira.
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ajustar Estoque da Geladeira</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                Produto: <strong>{selectedProduct?.name}</strong>
                <br />
                Quantidade atual: <strong>{selectedProduct?.quantity ?? 0}</strong>
              </div>

              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={movementType}
                  onValueChange={(value) => setMovementType(value as "entrada" | "saida")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">entrada</SelectItem>
                    <SelectItem value="saida">saida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(event) => setQuantity(event.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Motivo</Label>
                <Input value={reason} onChange={(event) => setReason(event.target.value)} />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAdjustModalOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleConfirmAdjust} disabled={savingAdjust || !quantity}>
                  {savingAdjust ? "Salvando..." : "Confirmar"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  )
}
