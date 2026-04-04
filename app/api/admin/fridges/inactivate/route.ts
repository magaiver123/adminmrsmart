import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "../_proxy"

export async function POST(req: Request) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 })
  }

  const storeId = String(body?.store_id || "").trim()
  const fridgeId = String(body?.fridge_id || "").trim()
  if (!storeId || !fridgeId) {
    return NextResponse.json({ error: "store_id e fridge_id sao obrigatorios." }, { status: 400 })
  }

  const result = await callFridgeBackend({
    method: "POST",
    path: "/api/admin/fridges/inactivate",
    body: {
      storeId,
      fridgeId,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
