export async function fetchLocks(storeId: string) {
  const res = await fetch(`/api/admin/locks?store_id=${storeId}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar fechaduras.")
  }
  return Array.isArray(body.locks) ? body.locks : []
}

export async function createLock(input: {
  store_id: string
  device_id?: string | null
  status?: string
  is_primary?: boolean
}) {
  const res = await fetch("/api/admin/locks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao criar fechadura.")
  }
  return body.lock
}

export async function updateLock(input: {
  store_id: string
  lock_id: string
  device_id?: string | null
  status?: string
  is_primary?: boolean
}) {
  const res = await fetch("/api/admin/locks", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao atualizar fechadura.")
  }
  return body.lock
}

export async function testOpenLock(input: {
  store_id: string
  lock_id: string
  socket_id?: string
}) {
  const res = await fetch("/api/admin/locks/test-open", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao testar abertura.")
  }
  return body
}

export async function fetchLockDiagnostics(storeId: string, limit = 20) {
  const res = await fetch(`/api/admin/locks/diagnostics?store_id=${storeId}&limit=${limit}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(body.error || "Erro ao carregar diagnostico.")
  }
  return Array.isArray(body.diagnostics) ? body.diagnostics : []
}
