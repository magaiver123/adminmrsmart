import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "../_proxy"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")
  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const result = await callFridgeBackend({
    path: "/api/admin/fridges/next-code",
    query: { storeId },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
