import { NextResponse } from "next/server"
import { callFridgeBackend, fridgeBackendErrorResponse } from "../fridges/_proxy"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")
  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const result = await callFridgeBackend({
    path: "/api/admin/locks",
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
    path: "/api/admin/locks",
    body: {
      storeId,
      deviceId: body?.device_id ?? body?.deviceId ?? null,
      status: body?.status,
      isPrimary: body?.is_primary ?? body?.isPrimary,
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
    path: "/api/admin/locks",
    body: {
      storeId,
      lockId: body?.lock_id ?? body?.lockId ?? body?.id,
      deviceId: body?.device_id ?? body?.deviceId,
      status: body?.status,
      isPrimary: body?.is_primary ?? body?.isPrimary,
    },
  })

  if (!result.ok) return fridgeBackendErrorResponse(result)
  return NextResponse.json(result.data)
}
