import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")

  if (!storeId) {
    return NextResponse.json(
      { error: "store_id é obrigatório." },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("store_categories")
    .select(
      `
      is_active,
      categories!inner (
        id,
        name,
        slug,
        is_active
      )
    `
    )
    .eq("store_id", storeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const categories =
    (data ?? [])
      .map((row: any) => ({
        id: row.categories.id,
        name: row.categories.name,
        slug: row.categories.slug,
        is_active: row.is_active,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"))

  return NextResponse.json(categories)
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const categoryId = String(body?.category_id ?? "").trim()
  const storeId = String(body?.store_id ?? "")
  const isActive = typeof body?.is_active === "boolean" ? body.is_active : true

  if (!storeId || !categoryId) {
    return NextResponse.json(
      { error: "store_id e category_id são obrigatórios." },
      { status: 400 }
    )
  }

  const { data: existingById, error: findByIdError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle()

  if (findByIdError) {
    return NextResponse.json({ error: findByIdError.message }, { status: 500 })
  }

  if (!existingById) {
    return NextResponse.json(
      { error: "Categoria global não encontrada." },
      { status: 404 }
    )
  }

  const { error } = await supabase
    .from("store_categories")
    .upsert(
      {
        store_id: storeId,
        category_id: categoryId,
        is_active: isActive,
      },
      { onConflict: "store_id,category_id" }
    )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, id: categoryId })
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const id = String(body?.id ?? "")
  const storeId = String(body?.store_id ?? "")
  const isActive = body?.is_active

  if (!id || !storeId || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "id, store_id e is_active são obrigatórios." },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("store_categories")
    .update({ is_active: isActive })
    .eq("store_id", storeId)
    .eq("category_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const id = String(body?.id ?? "")
  const storeId = String(body?.store_id ?? "")
  const isActive = body?.is_active

  if (!id || !storeId || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "id, store_id e is_active são obrigatórios." },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("store_categories")
    .update({ is_active: isActive })
    .eq("store_id", storeId)
    .eq("category_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")
  const storeId = searchParams.get("store_id")

  if (!id || !storeId) {
    return NextResponse.json(
      { error: "id e store_id são obrigatórios." },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from("store_categories")
    .delete()
    .eq("store_id", storeId)
    .eq("category_id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
