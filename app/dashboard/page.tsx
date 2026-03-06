"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  DollarSign,
  Users,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useStore } from "@/components/admin/store-context";

const statusColors = {
  processed: "bg-green-100 text-green-700",
  canceled: "bg-red-100 text-red-700",
  refunded: "bg-purple-100 text-purple-700",
  action_required: "bg-orange-100 text-orange-700",
  failed: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-700",
};

const statusLabels = {
  processed: "Processado",
  canceled: "Cancelado",
  refunded: "Reembolsado",
  action_required: "Ação no Terminal",
  failed: "Falhou",
  expired: "Expirado",
};

type DashboardResponse = Awaited<
  ReturnType<typeof import("@/src/services/dashboard.service").getDashboardData>
>;

export default function DashboardPage() {
  const { store } = useStore();
  const [data, setData] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    if (!store?.id) {
      setData(null);
      return;
    }

    fetch(`/api/admin/dashboard?store_id=${store.id}`)
      .then((res) => res.json())
      .then(setData);
  }, [store?.id]);

  if (!store) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-6 text-muted-foreground">
          Selecione uma loja para visualizar o dashboard.
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout title="Dashboard">
        <div className="p-6">Carregando dashboard...</div>
      </AdminLayout>
    );
  }

  const topProducts = data.topProducts ?? [];
  const recentOrders = data.recentOrders ?? [];

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Pedidos Hoje"
            value={data.metrics.ordersToday}
            icon={<ShoppingCart className="h-4 w-4 text-primary" />}
          />

          <MetricCard
            title="Faturamento Hoje"
            value={`R$ ${data.metrics.revenueToday.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
          />

          <MetricCard
            title="Faturamento Semana"
            value={`R$ ${data.metrics.revenueWeek.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
          />

          <MetricCard
            title="Faturamento Mês"
            value={`R$ ${data.metrics.revenueMonth.toFixed(2)}`}
            icon={<DollarSign className="h-4 w-4 text-primary" />}
          />

          <MetricCard
            title="Usuários Ativos"
            value={data.metrics.activeUsers}
            icon={<Users className="h-4 w-4 text-primary" />}
          />

          <MetricCard
            title="Estoque Baixo"
            value={data.metrics.lowStock}
            icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
            danger
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Pedidos por Dia"
            data={data.charts.ordersByDay}
            type="area"
          />

          <ChartCard
            title="Faturamento por Dia"
            data={data.charts.revenueByDay}
            type="bar"
          />
        </div>

        {/* Bottom */}
        <div className="grid gap-6 lg:grid-cols-2">
          <TopProductsCard products={topProducts} />
          <RecentOrdersCard orders={recentOrders} />
        </div>
      </div>
    </AdminLayout>
  );
}

/* ================= COMPONENTES ================= */

function MetricCard({ title, value, icon, danger = false }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 min-h-[56px]">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-tight">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold ${danger ? "text-destructive" : ""}`}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, data, type }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            {type === "area" ? (
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="pedidos"
                  stroke="oklch(0.65 0.18 45)"
                  fill="oklch(0.65 0.18 45)"
                />
              </AreaChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="faturamento" fill="oklch(0.65 0.18 45)" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function TopProductsCard({ products }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Produtos Mais Vendidos
        </CardTitle>
      </CardHeader>

      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum dado disponível.
          </p>
        ) : (
          <div className="space-y-4">
            {products.map((p: any, i: number) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_100px] items-center gap-4"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.vendas} vendas
                  </p>
                </div>

                <span className="font-semibold text-right tabular-nums">
                  {p.valor}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function RecentOrdersCard({ orders }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Últimos Pedidos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum pedido recente.
          </p>
        ) : (
          <div className="space-y-4">
            {orders.map((o: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{o.id}</p>
                  <p className="text-xs text-muted-foreground">{o.cliente}</p>
                </div>
                <div className="grid grid-cols-[100px_130px_60px] items-center text-center gap-3">
                  <span className="font-medium">{o.valor}</span>

                  <div className="flex justify-center">
                    <Badge
                      className={
                        statusColors[o.status as keyof typeof statusColors]
                      }
                    >
                      {statusLabels[o.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>

                  <span className="text-xs text-muted-foreground">
                    {o.hora}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
