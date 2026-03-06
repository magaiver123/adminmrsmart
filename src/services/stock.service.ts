export async function fetchStockProducts(storeId: string) {
  const res = await fetch(`/api/admin/stock?mode=products&store_id=${storeId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar estoque.");
  }
  return res.json();
}

export async function fetchStockHistory(storeId: string) {
  const res = await fetch(`/api/admin/stock?mode=history&store_id=${storeId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar histórico.");
  }
  return res.json();
}

export async function adjustStockApi(input: {
  storeId: string;
  productId: string;
  type: "entrada" | "saida";
  quantity: number;
  reason?: string;
}) {
  const res = await fetch("/api/admin/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao ajustar estoque.");
  }
}
