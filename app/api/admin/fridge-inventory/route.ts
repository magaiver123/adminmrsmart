import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "../fridges/_proxy"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")
  const fridgeId = searchParams.get("fridge_id")
  const mode = searchParams.get("mode") || "products"

  if (!storeId || !fridgeId) {
    return NextResponse.json(
      { error: "store_id e fridge_id sao obrigatorios." },
      { status: 400 },
    )
  }

  const result = await callFridgeBackend({
    path: "/api/admin/fridge-inventory",
    query: {
      storeId,
      fridge_id: fridgeId,
      mode,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
