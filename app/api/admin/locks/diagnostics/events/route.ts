import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "../../../fridges/_proxy"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")
  const traceId = searchParams.get("trace_id") ?? searchParams.get("traceId")

  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  if (!traceId) {
    return NextResponse.json({ error: "trace_id e obrigatorio." }, { status: 400 })
  }

  const limit = searchParams.get("limit")
  const result = await callFridgeBackend({
    path: "/api/admin/locks/diagnostics/events",
    query: {
      storeId,
      traceId,
      limit: limit ?? undefined,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
