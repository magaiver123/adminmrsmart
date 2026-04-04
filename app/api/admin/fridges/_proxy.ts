import { NextResponse } from "next/server"

type ProxyOptions = {
  method?: "GET" | "POST" | "PUT"
  path: string
  query?: Record<string, string | number | null | undefined>
  body?: unknown
}

function getBackendBaseUrl() {
  const baseUrl = process.env.PRINT_BACKEND_BASE_URL || "http://localhost:3000"
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl
}

function getBackendToken() {
  const token = process.env.PRINT_ADMIN_API_TOKEN
  if (!token || token.trim() === "") {
    throw new Error("Missing PRINT_ADMIN_API_TOKEN env var.")
  }
  return token
}

export async function callFridgeBackend(options: ProxyOptions) {
  const method = options.method || "GET"
  const url = new URL(`${getBackendBaseUrl()}${options.path}`)

  for (const [key, value] of Object.entries(options.query || {})) {
    if (value === null || value === undefined || value === "") continue
    url.searchParams.set(key, String(value))
  }

  const hasBody = options.body !== undefined
  const bodyString = hasBody ? JSON.stringify(options.body) : undefined

  const response = await fetch(url.toString(), {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-print-admin-token": getBackendToken(),
    },
    body: bodyString,
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)

  return {
    ok: response.ok,
    status: response.status,
    data,
  }
}

export function fridgeBackendErrorResponse(result: { status: number; data: any }) {
  const error = result.data?.error || "Erro ao comunicar com o backend."
  const code = result.data?.code
  const retryable = result.data?.retryable

  return NextResponse.json(
    {
      error,
      ...(code ? { code } : {}),
      ...(typeof retryable === "boolean" ? { retryable } : {}),
    },
    { status: result.status || 500 },
  )
}
