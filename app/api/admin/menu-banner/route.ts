import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

async function normalizeOrder(supabase: any, storeId: string) {
  const { data: activeBanners, error } = await supabase
    .from("menu_banners")
    .select("id")
    .eq("store_id", storeId)
    .eq("active", true)
    .order("order", { ascending: true })

  if (error || !activeBanners) return

  for (let i = 0; i < activeBanners.length; i++) {
    await supabase
      .from("menu_banners")
      .update({ order: i + 1 })
      .eq("id", activeBanners[i].id)
      .eq("store_id", storeId)
  }
}

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")

  if (!storeId) {
    return NextResponse.json(
      { error: "store_id e obrigatorio." },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("menu_banners")
    .select("*")
    .eq("store_id", storeId)
    .order("order", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const formData = await req.formData()

  const storeId = String(formData.get("store_id") ?? "")
  const duration = Number(formData.get("duration") ?? 5)
  const active = String(formData.get("active") ?? "true") === "true"
  const file = formData.get("file")

  if (!storeId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "store_id e file sao obrigatorios." },
      { status: 400 },
    )
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato invalido. Use JPG, PNG ou WEBP." },
      { status: 400 },
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter no maximo 5MB." },
      { status: 413 },
    )
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type] ?? "bin"
  const path = `menu-banners/${storeId}/${crypto.randomUUID()}.${extension}`
  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage
    .from("kiosk-slides")
    .upload(path, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicData } = supabase.storage
    .from("kiosk-slides")
    .getPublicUrl(path)

  if (!publicData?.publicUrl) {
    return NextResponse.json(
      { error: "Nao foi possivel obter URL publica da imagem." },
      { status: 500 },
    )
  }

  const { error: insertError } = await supabase.from("menu_banners").insert({
    image_url: publicData.publicUrl,
    duration,
    active,
    order: active ? 9999 : 0,
    store_id: storeId,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await normalizeOrder(supabase, storeId)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()
  const action = body?.action as string | undefined
  const storeId = body?.store_id as string | undefined

  if (!action || !storeId) {
    return NextResponse.json(
      { error: "action e store_id sao obrigatorios." },
      { status: 400 },
    )
  }

  if (action === "reorder") {
    const orderedIds = body?.ordered_ids as string[] | undefined
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "ordered_ids e obrigatorio." },
        { status: 400 },
      )
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("menu_banners")
        .update({ order: i + 1 })
        .eq("id", orderedIds[i])
        .eq("store_id", storeId)
    }

    await normalizeOrder(supabase, storeId)
    return NextResponse.json({ success: true })
  }

  if (action === "toggle") {
    const id = body?.id as string | undefined
    const active = body?.active as boolean | undefined

    if (!id || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "id e active sao obrigatorios." },
        { status: 400 },
      )
    }

    const { error } = await supabase
      .from("menu_banners")
      .update({
        active,
        order: active ? 9999 : 0,
      })
      .eq("id", id)
      .eq("store_id", storeId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await normalizeOrder(supabase, storeId)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: "Acao invalida." }, { status: 400 })
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const storeId = searchParams.get("store_id")

  if (!id || !storeId) {
    return NextResponse.json(
      { error: "id e store_id sao obrigatorios." },
      { status: 400 },
    )
  }

  const { error } = await supabase
    .from("menu_banners")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await normalizeOrder(supabase, storeId)
  return NextResponse.json({ success: true })
}
