export async function fetchMenuBannerSlides(storeId: string) {
  const res = await fetch(`/api/admin/menu-banner?store_id=${storeId}`)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao buscar banners do menu.")
  }

  return res.json()
}

export async function createMenuBannerSlide({
  storeId,
  file,
  duration,
  active,
}: {
  storeId: string
  file: File
  duration: number
  active: boolean
}) {
  const formData = new FormData()
  formData.append("store_id", storeId)
  formData.append("duration", String(duration))
  formData.append("active", String(active))
  formData.append("file", file)

  const res = await fetch("/api/admin/menu-banner", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao criar banner do menu.")
  }
}

export async function reorderMenuBannerSlides(storeId: string, orderedIds: string[]) {
  const res = await fetch("/api/admin/menu-banner", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "reorder",
      store_id: storeId,
      ordered_ids: orderedIds,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao reordenar banners do menu.")
  }
}

export async function toggleMenuBannerSlide(
  storeId: string,
  id: string,
  active: boolean,
) {
  const res = await fetch("/api/admin/menu-banner", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "toggle",
      store_id: storeId,
      id,
      active,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao atualizar banner do menu.")
  }
}

export async function deleteMenuBannerSlide(storeId: string, id: string) {
  const res = await fetch(`/api/admin/menu-banner?store_id=${storeId}&id=${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao excluir banner do menu.")
  }
}
