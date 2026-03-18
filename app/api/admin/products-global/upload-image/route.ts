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

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file é obrigatório." }, { status: 400 })
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Formato inválido. Use JPG, PNG ou WEBP." },
      { status: 400 }
    )
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "A imagem deve ter no máximo 5MB." },
      { status: 413 }
    )
  }

  const extension = EXTENSION_BY_MIME_TYPE[file.type] ?? "bin"
  const path = `products-global/${crypto.randomUUID()}.${extension}`
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
      { error: "Não foi possível obter URL pública da imagem." },
      { status: 500 }
    )
  }

  return NextResponse.json({ image_url: publicData.publicUrl })
}
