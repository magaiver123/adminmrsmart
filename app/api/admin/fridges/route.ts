import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "./_proxy"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")
  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const result = await callFridgeBackend({
    path: "/api/admin/fridges",
    query: { storeId },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}

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
    path: "/api/admin/fridges",
    body: {
      storeId,
      name: body?.name,
      lockId: body?.lock_id ?? body?.lockId,
      expectedCode: body?.expected_code ?? body?.expectedCode,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}

export async function PUT(req: Request) {
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
    method: "PUT",
    path: "/api/admin/fridges",
    body: {
      storeId,
      fridgeId: body?.fridge_id ?? body?.fridgeId,
      name: body?.name,
      status: body?.status,
      lockId: body?.lock_id ?? body?.lockId,
      isPrimary: body?.is_primary ?? body?.isPrimary,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
