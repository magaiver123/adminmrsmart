export async function fetchOrdersByStore(storeId: string) {
  const res = await fetch(`/api/admin/orders?store_id=${storeId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar pedidos.");
  }

  return res.json();
}
