type ProductGlobalInput = {
  id?: string
  name: string
  description?: string
  image_url?: string
  category_id?: string
  is_active: boolean
}

function getErrorMessage(body: any, fallback: string) {
  return body?.error || fallback
}

export async function fetchGlobalProductsAdmin() {
  const res = await fetch("/api/admin/products-global")
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao buscar produtos globais."))
  }
  return res.json()
}

export async function createGlobalProduct(input: ProductGlobalInput) {
  const res = await fetch("/api/admin/products-global", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao criar produto global."))
  }
}

export async function updateGlobalProduct(input: ProductGlobalInput & { id: string }) {
  const res = await fetch("/api/admin/products-global", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao atualizar produto global."))
  }
}

export async function toggleGlobalProductStatus(id: string, isActive: boolean) {
  const res = await fetch("/api/admin/products-global", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, is_active: isActive }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao alterar status do produto global."))
  }
}

export async function deleteGlobalProduct(id: string) {
  const res = await fetch(`/api/admin/products-global?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao excluir produto global."))
  }
}
