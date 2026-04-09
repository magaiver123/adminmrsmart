import { SupabaseClient } from "@supabase/supabase-js";

type OrderRow = {
  created_at: string;
  total_amount: number;
};

type RecentOrderRow = {
  order_number: number;
  total_amount: number;
  status: string;
  created_at: string;
  users: {
    name: string | null;
  } | null;
};

export async function getDashboardData(supabase: SupabaseClient, storeId: string) {
  /* =========================
     DATAS
  ========================= */
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  /* =========================
     MÉTRICAS
  ========================= */
  const [
    ordersToday,
    revenueToday,
    revenueWeek,
    revenueMonth,
    activeUsersOrders,
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .eq("status", "processed")
      .gte("created_at", todayStart.toISOString()),

    supabase
      .from("orders")
      .select("total_amount")
      .eq("store_id", storeId)
      .eq("status", "processed")
      .gte("created_at", todayStart.toISOString()),

    supabase
      .from("orders")
      .select("total_amount")
      .eq("store_id", storeId)
      .eq("status", "processed")
      .gte("created_at", weekStart.toISOString()),

    supabase
      .from("orders")
      .select("total_amount")
      .eq("store_id", storeId)
      .eq("status", "processed")
      .gte("created_at", monthStart.toISOString()),

    supabase
      .from("orders")
      .select("user_id")
      .eq("store_id", storeId)
      .eq("status", "processed")
      .not("user_id", "is", null)
      .gte("created_at", monthStart.toISOString()),

  ]);

  /* =========================
     GRÁFICOS
  ========================= */
  const { data: ordersRaw } = await supabase
    .from("orders")
    .select("created_at, total_amount")
    .eq("store_id", storeId)
    .eq("status", "processed")
    .gte("created_at", weekStart.toISOString());

  const ordersByDayMap: Record<string, number> = {};
  const revenueByDayMap: Record<string, number> = {};

  (ordersRaw as OrderRow[] | null)?.forEach((order) => {
    const day = new Date(order.created_at).toLocaleDateString("pt-BR", {
      weekday: "short",
    });

    ordersByDayMap[day] = (ordersByDayMap[day] || 0) + 1;
    revenueByDayMap[day] =
      (revenueByDayMap[day] || 0) + Number(order.total_amount);
  });

  const ordersByDay = Object.keys(ordersByDayMap).map((day) => ({
    day,
    pedidos: ordersByDayMap[day],
  }));

  const revenueByDay = Object.keys(revenueByDayMap).map((day) => ({
    day,
    faturamento: revenueByDayMap[day],
  }));

  /* =========================
     PRODUTOS MAIS VENDIDOS
  ========================= */
  const { data: ordersWithItems } = await supabase
    .from("orders")
    .select("items")
    .eq("store_id", storeId)
    .eq("status", "processed");

  type ProductAgg = {
    name: string;
    vendas: number;
    total: number;
  };

  const productMap: Record<string, ProductAgg> = {};

  if (ordersWithItems) {
    for (const order of ordersWithItems) {
      const items = order.items as any[];

      for (const item of items) {
        const productId = item.id;
        const name = item.name;
        const quantity = Number(item.quantity ?? 1);
        const price = Number(item.price ?? 0);

        if (!productId || !name || quantity <= 0) continue;

        if (!productMap[productId]) {
          productMap[productId] = {
            name,
            vendas: 0,
            total: 0,
          };
        }

        productMap[productId].vendas += quantity;
        productMap[productId].total += quantity * price;
      }
    }
  }

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.vendas - a.vendas)
    .slice(0, 5)
    .map((p) => ({
      name: p.name,
      vendas: p.vendas,
      valor: `R$ ${p.total.toFixed(2).replace(".", ",")}`,
    }));

  /* =========================
     ÚLTIMOS PEDIDOS
  ========================= */
  const { data: recentOrdersRaw } = await supabase
    .from("orders")
    .select(
      `
      order_number,
      total_amount,
      status,
      created_at,
      users ( name )
    `
    )
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })
    .limit(5);

  const recentOrders =
    (recentOrdersRaw as RecentOrderRow[] | null)?.map((order) => ({
      id: `#${order.order_number}`,
      cliente: order.users?.name ?? "—",
      valor: `R$ ${order.total_amount.toFixed(2).replace(".", ",")}`,
      status: order.status,
      hora: new Date(order.created_at).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    })) ?? [];

  const activeUsersCount = new Set(
    (activeUsersOrders.data ?? [])
      .map((row: any) => row.user_id)
      .filter(Boolean)
  ).size;

  return {
    metrics: {
      ordersToday: ordersToday.count ?? 0,
      revenueToday:
        revenueToday.data?.reduce(
          (sum: number, row: any) => sum + Number(row.total_amount),
          0
        ) ?? 0,
      revenueWeek:
        revenueWeek.data?.reduce(
          (sum: number, row: any) => sum + Number(row.total_amount),
          0
        ) ?? 0,
      revenueMonth:
        revenueMonth.data?.reduce(
          (sum: number, row: any) => sum + Number(row.total_amount),
          0
        ) ?? 0,
      activeUsers: activeUsersCount,
      lowStock: 0,
    },
    charts: {
      ordersByDay,
      revenueByDay,
    },
    topProducts,
    recentOrders,
  };
}
