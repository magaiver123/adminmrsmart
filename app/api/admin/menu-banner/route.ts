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

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")

  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("menu_banners")
    .select("image_url")
    .eq("store_id", storeId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ image_url: data?.image_url ?? null })
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const formData = await req.formData()

  const storeId = String(formData.get("store_id") ?? "")
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

  const { error: upsertError } = await supabase
    .from("menu_banners")
    .upsert(
      {
        store_id: storeId,
        image_url: publicData.publicUrl,
      },
      { onConflict: "store_id" },
    )

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 })
  }

  return NextResponse.json({ image_url: publicData.publicUrl })
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")

  if (!storeId) {
    return NextResponse.json({ error: "store_id e obrigatorio." }, { status: 400 })
  }

  const { error } = await supabase
    .from("menu_banners")
    .delete()
    .eq("store_id", storeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

