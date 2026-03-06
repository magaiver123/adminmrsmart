type StoreInput = {
  id?: string;
  name: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
};

export async function fetchStoresAdmin() {
  const res = await fetch("/api/admin/stores-management");
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar lojas.");
  }
  return res.json();
}

export async function createStoreApi(input: StoreInput) {
  const res = await fetch("/api/admin/stores-management", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao criar loja.");
  }
}

export async function updateStoreApi(input: StoreInput) {
  const res = await fetch("/api/admin/stores-management", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao atualizar loja.");
  }
}

export async function deleteStoreApi(id: string) {
  const res = await fetch(`/api/admin/stores-management?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao excluir loja.");
  }
}

export async function toggleStoreStatusApi(id: string, current: boolean) {
  const res = await fetch("/api/admin/stores-management", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, current }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao alterar status.");
  }
}
