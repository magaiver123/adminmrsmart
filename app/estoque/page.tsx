"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  History,
} from "lucide-react";
import { useStore } from "@/components/admin/store-context";

import {
  adjustStockApi,
  fetchStockHistory,
  fetchStockProducts,
} from "@/src/services/stock.service";

type StockProduct = {
  id: string;
  name: string;
  quantity: number;
};

type HistoryItem = {
  id: string;
  product: string;
  type: "entrada" | "saida" | "ajuste";
  qty: number;
  reason: string | null;
  user: string | null;
  date: string;
};

const statusConfig = {
  ok: { label: "OK", color: "bg-green-100 text-green-700", icon: CheckCircle },
  low: {
    label: "Baixo",
    color: "bg-yellow-100 text-yellow-700",
    icon: AlertTriangle,
  },
  out: { label: "Zerado", color: "bg-red-100 text-red-700", icon: XCircle },
};

const typeConfig = {
  entrada: { label: "Entrada", color: "bg-green-100 text-green-700" },
  saida: { label: "Saída", color: "bg-red-100 text-red-700" },
  ajuste: { label: "Ajuste", color: "bg-blue-100 text-blue-700" },
};

export default function EstoquePage() {
  const { store } = useStore();
  const [stock, setStock] = useState<StockProduct[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProduct | null>(
    null
  );

  const [movementType, setMovementType] = useState<"entrada" | "saida" | null>(
    null
  );
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [store?.id]);

  async function loadAll() {
    if (!store?.id) {
      setStock([]);
      setHistory([]);
      return;
    }

    const [stockData, historyData] = await Promise.all([
      fetchStockProducts(store.id),
      fetchStockHistory(store.id),
    ]);

    setStock(stockData);
    setHistory(historyData);
  }

  const openAdjustModal = (product: StockProduct) => {
    setSelectedProduct(product);
    setMovementType(null);
    setQuantity("");
    setReason("");
    setIsAdjustModalOpen(true);
  };

  async function handleConfirmAdjust() {
    if (!selectedProduct || !movementType || !quantity || !store) return;

    const qty = Number(quantity);
    if (qty <= 0) return;

    setLoading(true);

    try {
      await adjustStockApi({
        productId: selectedProduct.id,
        type: movementType,
        quantity: qty,
        reason,
        storeId: store.id,
      });

      await loadAll();
      setIsAdjustModalOpen(false);
    } catch (err: any) {
      alert(err.message ?? "Erro ao ajustar estoque");
    } finally {
      setLoading(false);
    }
  }

  const lowStockCount = stock.filter(
    (p) => p.quantity > 0 && p.quantity <= 5
  ).length;
  const outOfStockCount = stock.filter((p) => p.quantity === 0).length;

  if (!store) {
    return (
      <AdminLayout title="Estoque">
        <p className="text-muted-foreground">
          Selecione uma loja para gerenciar o estoque.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Estoque">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Produtos
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stock.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque OK
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stock.filter((p) => p.quantity >= 10).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Estoque Baixo
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {lowStockCount}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sem Estoque
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {outOfStockCount}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Estoque Atual</TabsTrigger>
            <TabsTrigger value="history">
              Histórico de Movimentações
            </TabsTrigger>
          </TabsList>

          {/* ESTOQUE */}
          <TabsContent value="stock" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Estoque Atual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stock.map((product) => {
                      const status =
                        product.quantity === 0
                          ? "out"
                          : product.quantity < 6
                          ? "low"
                          : "ok";

                      const config =
                        statusConfig[status as keyof typeof statusConfig];
                      const StatusIcon = config.icon;

                      return (
                        <TableRow key={product.id}>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>{product.quantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={`${config.color} gap-1`}
                            >
                              <StatusIcon className="h-3 w-3" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openAdjustModal(product)}
                            >
                              Ajustar Estoque
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTÓRICO */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Histórico de Movimentações
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Usuário</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.map((entry) => {
                      const config = typeConfig[entry.type];
                      return (
                        <TableRow key={entry.id}>
                          <TableCell className="text-muted-foreground">
                            {entry.date}
                          </TableCell>
                          <TableCell className="font-medium">
                            {entry.product}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={config.color}>
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span
                              className={
                                entry.type === "entrada"
                                  ? "text-green-600"
                                  : entry.type === "saida"
                                  ? "text-red-600"
                                  : "text-blue-600"
                              }
                            >
                              {entry.type === "entrada" ? "+" : "-"}
                              {Math.abs(entry.qty)}
                            </span>
                          </TableCell>
                          <TableCell>{entry.reason ?? "-"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {entry.user ?? "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* MODAL */}
        <Dialog open={isAdjustModalOpen} onOpenChange={setIsAdjustModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Ajustar Estoque</DialogTitle>
              <DialogDescription>{selectedProduct?.name}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Estoque Atual</p>
                  <p className="text-3xl font-bold">
                    {selectedProduct?.quantity}
                  </p>
                </div>
              </div>

              <Label>Tipo de Movimentação</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setMovementType("entrada")}
                  className={
                    movementType === "entrada"
                      ? "bg-green-600 text-white hover:bg-green-600"
                      : "border border-green-200 text-green-700 bg-transparent hover:bg-green-50"
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Entrada
                </Button>

                <Button
                  onClick={() => setMovementType("saida")}
                  className={
                    movementType === "saida"
                      ? "bg-red-600 text-white hover:bg-red-600"
                      : "border border-red-200 text-red-700 bg-transparent hover:bg-red-50"
                  }
                >
                  <Minus className="h-4 w-4 mr-2" />
                  Saída
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Motivo do Ajuste</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setIsAdjustModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmAdjust} disabled={loading}>
                Confirmar Ajuste
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
