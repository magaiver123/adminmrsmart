export async function fetchFridges(storeId: string) {
  const res = await fetch(`/api/admin/fridges?store_id=${storeId}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar geladeiras.")
  }
  return Array.isArray(body.fridges) ? body.fridges : []
}

export async function fetchNextFridgeCode(storeId: string) {
  const res = await fetch(`/api/admin/fridges/next-code?store_id=${storeId}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao prever codigo da geladeira.")
  }
  return typeof body.code === "string" ? body.code : ""
}

export async function createFridge(input: {
  store_id: string
  name: string
  lock_id: string
  expected_code?: string
}) {
  const res = await fetch("/api/admin/fridges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok && res.status !== 409) {
    throw new Error(body.error || "Erro ao criar geladeira.")
  }
  return body
}

export async function updateFridge(input: {
  store_id: string
  fridge_id: string
  name?: string
  status?: string
  lock_id?: string
  is_primary?: boolean
}) {
  const res = await fetch("/api/admin/fridges", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao atualizar geladeira.")
  }
  return body
}

export async function inactivateFridge(storeId: string, fridgeId: string) {
  const res = await fetch("/api/admin/fridges/inactivate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store_id: storeId,
      fridge_id: fridgeId,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao inativar geladeira.")
  }
  return body
}
