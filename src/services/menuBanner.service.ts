function getErrorMessage(body: any, fallback: string) {
  return body?.error || fallback
}

export async function fetchMenuBanner(storeId: string) {
  const url = "/api/admin/menu-banner?store_id=" + encodeURIComponent(storeId)
  const res = await fetch(url)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao buscar banner do menu."))
  }

  const body = await res.json()
  return String(body?.image_url ?? "")
}

export async function uploadMenuBanner(storeId: string, file: File) {
  const formData = new FormData()
  formData.append("store_id", storeId)
  formData.append("file", file)

  const res = await fetch("/api/admin/menu-banner", {
    method: "POST",
    body: formData,
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao salvar banner do menu."))
  }

  const body = await res.json()
  return String(body?.image_url ?? "")
}

export async function deleteMenuBanner(storeId: string) {
  const url = "/api/admin/menu-banner?store_id=" + encodeURIComponent(storeId)
  const res = await fetch(url, {
    method: "DELETE",
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao remover banner do menu."))
  }
}

