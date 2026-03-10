type UserStatus = "ativo" | "bloqueado"

export async function fetchUsersGlobal(storeId?: string) {
  const query = storeId ? `?store_id=${encodeURIComponent(storeId)}` : ""
  const res = await fetch(`/api/admin/users${query}`)

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao buscar usuários.")
  }

  return res.json()
}

export async function updateUserStatus(userId: string, status: UserStatus) {
  const res = await fetch("/api/admin/users", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, status }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || "Erro ao atualizar status do usuário.")
  }
}
