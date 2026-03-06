export async function fetchCategories(storeId: string) {
  const res = await fetch(`/api/admin/categories?store_id=${storeId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar categorias.");
  }
  return res.json();
}

export async function createCategoryApi(input: {
  name: string;
  is_active: boolean;
  store_id: string;
}) {
  const res = await fetch("/api/admin/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao criar categoria.");
  }
}

export async function updateCategoryApi(input: {
  id: string;
  name: string;
  is_active: boolean;
  store_id: string;
}) {
  const res = await fetch("/api/admin/categories", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao atualizar categoria.");
  }
}

export async function toggleCategoryStatusApi(
  id: string,
  is_active: boolean,
  store_id: string
) {
  const res = await fetch("/api/admin/categories", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, is_active, store_id }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao alterar status.");
  }
}

export async function deleteCategoryApi(id: string, store_id: string) {
  const res = await fetch(`/api/admin/categories?id=${id}&store_id=${store_id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao excluir categoria.");
  }
}
