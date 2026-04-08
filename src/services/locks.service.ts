function buildApiErrorMessage(body: any, fallback: string) {
  const message = typeof body?.error === "string" ? body.error : fallback
  const code = typeof body?.code === "string" ? body.code : null
  return code ? `${message} [${code}]` : message
}

export type LockLiveStatusRow = {
  lockId: string
  storeId: string
  deviceId: string | null
  registrationStatus: string
  enabled: boolean
  isPrimary: boolean
  connectionStatus: "online" | "stale" | "offline" | "unknown"
  connection: {
    status: string
    firmware: string | null
    ip: string | null
    rssi: number | null
    uptime: number | null
    lastSeenAt: string | null
    lastOfflineAt: string | null
    updatedAt: string | null
  }
  lastCommand:
    | {
        traceId: string
        socketId: string
        source: string
        stage: string
        result: string
        code: string | null
        error: string | null
        retryable: boolean | null
        attempts: number
        createdAt: string
        updatedAt: string
        finishedAt: string | null
      }
    | null
}

export type LockDiagnosticRow = {
  id: string
  traceId: string
  order_id: string | null
  device_id: string | null
  topic: string | null
  status: string
  stage: string
  result: string
  source: string
  code: string | null
  error: string | null
  retryable: boolean | null
  attempts: number
  socketId: string | null
  created_at: string
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}

export type LockDiagnosticEventRow = {
  id: string
  trace_id: string
  store_id: string
  stage: string
  result: string
  code: string | null
  error: string | null
  retryable: boolean | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export async function fetchLocks(storeId: string) {
  const res = await fetch(`/api/admin/locks?store_id=${storeId}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(buildApiErrorMessage(body, "Erro ao carregar fechaduras."))
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
    throw new Error(buildApiErrorMessage(body, "Erro ao criar fechadura."))
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
    throw new Error(buildApiErrorMessage(body, "Erro ao atualizar fechadura."))
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
    throw new Error(buildApiErrorMessage(body, "Erro ao testar abertura."))
  }
  return body
}

export async function fetchLockDiagnostics(storeId: string, limit = 20) {
  const res = await fetch(`/api/admin/locks/diagnostics?store_id=${storeId}&limit=${limit}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(buildApiErrorMessage(body, "Erro ao carregar diagnóstico."))
  }
  return Array.isArray(body.diagnostics) ? (body.diagnostics as LockDiagnosticRow[]) : []
}

export async function fetchLockLiveStatus(storeId: string) {
  const res = await fetch(`/api/admin/locks/live-status?store_id=${storeId}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(buildApiErrorMessage(body, "Erro ao carregar status em tempo real."))
  }

  return {
    storeId: String(body.storeId || storeId),
    updatedAt: typeof body.updatedAt === "string" ? body.updatedAt : null,
    items: Array.isArray(body.items) ? (body.items as LockLiveStatusRow[]) : [],
  }
}

export async function fetchLockDiagnosticEvents(input: {
  store_id: string
  trace_id: string
  limit?: number
}) {
  const params = new URLSearchParams({
    store_id: input.store_id,
    trace_id: input.trace_id,
  })
  if (typeof input.limit === "number") {
    params.set("limit", String(input.limit))
  }

  const res = await fetch(`/api/admin/locks/diagnostics/events?${params.toString()}`, {
    cache: "no-store",
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(buildApiErrorMessage(body, "Erro ao carregar eventos do diagnóstico."))
  }

  return Array.isArray(body.events) ? (body.events as LockDiagnosticEventRow[]) : []
}
