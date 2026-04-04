import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "../../fridges/_proxy"

export async function POST(req: Request) {
  let body: any = null
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Payload invalido." }, { status: 400 })
  }

  const storeId = String(body?.store_id || "").trim()
  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const result = await callFridgeBackend({
    method: "POST",
    path: "/api/admin/fridge-inventory/adjust",
    body: {
      storeId,
      fridgeId: body?.fridge_id ?? body?.fridgeId,
      productId: body?.product_id ?? body?.productId,
      type: body?.type,
      quantity: body?.quantity,
      reason: body?.reason,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
