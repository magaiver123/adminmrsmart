"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Eye,
  MoreHorizontal,
  XCircle,
  CreditCard,
  Smartphone,
  Banknote,
  ShoppingCart,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { useStore } from "@/components/admin/store-context";
import { fetchOrdersByStore } from "@/src/services/orders.service";

type OrderStatus = "processed" | "pending" | "canceled" | "failed" | "expired";
type PaymentMethod = "pix" | "credit" | "debit";

type Order = {
  id: string;
  order_number: number;
  status: OrderStatus;
  payment_method: string; // continua string pois vem do banco
  total_amount: number;
  created_at: string;
  items: any[];
};

const statusConfig = {
  processed: {
    label: "Processado",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  pending: {
    label: "Pendente",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  canceled: {
    label: "Cancelado",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
  failed: {
    label: "Não autorizado",
    color: "bg-red-100 text-red-700",
    icon: AlertTriangle,
  },
  expired: {
    label: "Expirado",
    color: "bg-gray-100 text-gray-700",
    icon: Clock,
  },
} as const;

const paymentConfig = {
  pix: { label: "PIX", icon: Smartphone, color: "text-green-600" },
  credit: { label: "Crédito", icon: CreditCard, color: "text-blue-600" },
  debit: { label: "Débito", icon: Banknote, color: "text-purple-600" },
} as const;

function normalizePayment(method: string) {
  if (method === "credit_card") return "credit";
  if (method === "debit_card") return "debit";
  return method;
}

function formatDateOnly(date: string) {
  const d = new Date(date);
  return d.toLocaleDateString("pt-BR");
}

export default function PedidosPage() {
  const { store } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  async function loadOrders() {
    if (!store?.id) {
      setOrders([]);
      return;
    }

    const data = await fetchOrdersByStore(store.id);
    setOrders(data || []);
  }

  useEffect(() => {
    if (!store?.id) {
      setOrders([]);
      setSelectedOrder(null);
      return;
    }

    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [store?.id]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.order_number.toString().includes(search.replace("#", ""));

      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const payment = normalizePayment(order.payment_method);
      const matchesPayment =
        paymentFilter === "all" || payment === paymentFilter;

      const matchesDate =
        !dateFilter ||
        new Date(order.created_at).toLocaleDateString("en-CA") === dateFilter;

      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    });
  }, [orders, search, statusFilter, paymentFilter, dateFilter]);

  // 🔹 Cards baseados nos FILTROS
  const total = filteredOrders.length;
  const processed = filteredOrders.filter(
    (o) => o.status === "processed"
  ).length;
  const pending = filteredOrders.filter((o) => o.status === "pending").length;
  const canceled = filteredOrders.filter((o) => o.status === "canceled").length;
  const failed = filteredOrders.filter((o) => o.status === "failed").length;
  const expired = filteredOrders.filter((o) => o.status === "expired").length;

  if (!store) {
    return (
      <AdminLayout title="Pedidos">
        <p className="text-muted-foreground">
          Selecione uma loja para visualizar pedidos.
        </p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pedidos">
      <div className="space-y-6">
        {/* CARDS */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground min-h-[40px] flex items-center">
                Total
              </CardTitle>
              <ShoppingCart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground min-h-[40px] flex items-center">
                Processados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {processed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground min-h-[40px] flex items-center">
                Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground min-h-[40px] flex items-center">
                Cancelados
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {canceled}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground min-h-[40px] flex items-center">
                Não autorizados
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{failed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground min-h-[40px] flex items-center">
                Expirados
              </CardTitle>
              <Clock className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{expired}</div>
            </CardContent>
          </Card>
        </div>

        {/* FILTROS */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="processed">Processado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="failed">Não autorizado</SelectItem>
              <SelectItem value="expired">Expirado</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pix">PIX</SelectItem>
              <SelectItem value="credit">Crédito</SelectItem>
              <SelectItem value="debit">Débito</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            className="w-[180px]"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>

        {/* TABELA */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Lista de Pedidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => {
                  const statusCfg =
                    statusConfig[order.status] ?? statusConfig.pending;
                  const paymentKey = normalizePayment(
                    order.payment_method
                  ) as PaymentMethod;
                  const paymentCfg =
                    paymentConfig[paymentKey] ?? paymentConfig.credit;
                  const StatusIcon = statusCfg.icon;
                  const PaymentIcon = paymentCfg.icon;

                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        #{order.order_number}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {order.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`flex items-center gap-1.5 ${paymentCfg.color}`}
                        >
                          <PaymentIcon className="h-4 w-4" />
                          {paymentCfg.label}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusCfg.color} gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsDetailOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODAL */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Pedido #{selectedOrder?.order_number}</DialogTitle>
              <DialogDescription>Itens do pedido</DialogDescription>
            </DialogHeader>

            {selectedOrder && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder.items.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>R$ {item.price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
