export async function fetchStoreProducts(storeId: string) {
  const res = await fetch(
    `/api/admin/store-products?store_id=${storeId}`
  )

  if (!res.ok) throw new Error("Erro ao buscar produtos")
  return res.json()
}

export async function addStoreProduct(
  storeId: string,
  productId: string,
  price: number
) {
  const res = await fetch("/api/admin/store-products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      store_id: storeId,
      product_id: productId,
      price,
    }),
  })

  if (!res.ok) throw new Error("Erro ao adicionar produto")
}

export async function removeStoreProduct(id: string, storeId: string) {
  const res = await fetch(`/api/admin/store-products?id=${id}&store_id=${storeId}`, {
    method: "DELETE",
  })

  if (!res.ok) throw new Error("Erro ao remover produto")
}

/* 🔥 NOVO: atualizar preço e/ou status */
export async function updateStoreProduct(
  id: string,
  storeId: string,
  data: {
    price?: number
    is_active?: boolean
  }
) {
  const res = await fetch("/api/admin/store-products", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      store_id: storeId,
      ...data,
    }),
  })

  if (!res.ok) throw new Error("Erro ao atualizar produto")
}

export async function fetchGlobalProducts() {
  const res = await fetch("/api/admin/products-global")

  if (!res.ok) throw new Error("Erro ao buscar produtos globais")

  return res.json()
}
