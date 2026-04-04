export async function fetchFridgeInventoryProducts(storeId: string, fridgeId: string) {
  const res = await fetch(
    `/api/admin/fridge-inventory?store_id=${storeId}&fridge_id=${fridgeId}&mode=products`,
    { cache: "no-store" },
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar mix da geladeira.")
  }
  return Array.isArray(body.products) ? body.products : []
}

export async function fetchFridgeInventoryHistory(storeId: string, fridgeId: string) {
  const res = await fetch(
    `/api/admin/fridge-inventory?store_id=${storeId}&fridge_id=${fridgeId}&mode=history`,
    { cache: "no-store" },
  )
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar historico da geladeira.")
  }
  return Array.isArray(body.history) ? body.history : []
}

export async function setFridgeMixItem(input: {
  store_id: string
  fridge_id: string
  product_id: string
  in_mix: boolean
}) {
  const res = await fetch("/api/admin/fridge-inventory/mix", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao atualizar mix da geladeira.")
  }
  return body
}

export async function adjustFridgeInventoryApi(input: {
  store_id: string
  fridge_id: string
  product_id: string
  type: "entrada" | "saida"
  quantity: number
  reason?: string
}) {
  const res = await fetch("/api/admin/fridge-inventory/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao ajustar estoque da geladeira.")
  }
  return body
}
