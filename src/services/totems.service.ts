export async function fetchTotems(storeId: string) {
  const res = await fetch(`/api/admin/totems?store_id=${storeId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar totens.");
  }
  return res.json();
}

export async function createTotemApi(input: {
  name: string;
  store_id: string;
  activation_code: string;
}) {
  const res = await fetch("/api/admin/totems", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function updateTotemApi(input: {
  id: string;
  name: string;
  store_id: string;
}) {
  const res = await fetch("/api/admin/totems", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function deleteTotemApi(id: string, storeId: string) {
  const res = await fetch(`/api/admin/totems?id=${id}&store_id=${storeId}`, {
    method: "DELETE",
  });
  return res.json();
}
