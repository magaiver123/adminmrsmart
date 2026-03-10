type CategoryGlobalInput = {
  id?: string
  name: string
  is_active: boolean
}

function getErrorMessage(body: any, fallback: string) {
  return body?.error || fallback
}

export async function fetchGlobalCategoriesAdmin() {
  const res = await fetch("/api/admin/categories-global")
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao buscar categorias globais."))
  }
  return res.json()
}

export async function createGlobalCategory(input: CategoryGlobalInput) {
  const res = await fetch("/api/admin/categories-global", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao criar categoria global."))
  }
}

export async function updateGlobalCategory(input: CategoryGlobalInput & { id: string }) {
  const res = await fetch("/api/admin/categories-global", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao atualizar categoria global."))
  }
}

export async function toggleGlobalCategoryStatus(id: string, isActive: boolean) {
  const res = await fetch("/api/admin/categories-global", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, is_active: isActive }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao alterar status da categoria global."))
  }
}

export async function deleteGlobalCategory(id: string) {
  const res = await fetch(`/api/admin/categories-global?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(getErrorMessage(body, "Erro ao excluir categoria global."))
  }
}
