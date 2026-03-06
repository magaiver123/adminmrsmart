type UserStatus = "ativo" | "bloqueado";

export async function fetchUsersByStore(storeId: string) {
  const res = await fetch(`/api/admin/users?store_id=${storeId}`);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao buscar usuários.");
  }

  return res.json();
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const res = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, status }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Erro ao atualizar status do usuário.");
  }
}
