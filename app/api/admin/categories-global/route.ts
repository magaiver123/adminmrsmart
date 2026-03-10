import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, is_active")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const name = String(body?.name ?? "").trim()
  const isActive = typeof body?.is_active === "boolean" ? body.is_active : true

  if (!name) {
    return NextResponse.json({ error: "name é obrigatório." }, { status: 400 })
  }

  const slug = generateSlug(name)

  const { data: existingCategory, error: existingError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existingCategory) {
    return NextResponse.json(
      { error: "Já existe uma categoria com este nome." },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug, is_active: isActive })
    .select("id, name, slug, is_active")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const id = String(body?.id ?? "")
  const name = String(body?.name ?? "").trim()
  const isActive = typeof body?.is_active === "boolean" ? body.is_active : true

  if (!id || !name) {
    return NextResponse.json(
      { error: "id e name são obrigatórios." },
      { status: 400 }
    )
  }

  const slug = generateSlug(name)

  const { data: duplicate, error: duplicateError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .neq("id", id)
    .maybeSingle()

  if (duplicateError) {
    return NextResponse.json({ error: duplicateError.message }, { status: 500 })
  }

  if (duplicate) {
    return NextResponse.json(
      { error: "Já existe uma categoria com este nome." },
      { status: 409 }
    )
  }

  const { data, error } = await supabase
    .from("categories")
    .update({
      name,
      slug,
      is_active: isActive,
    })
    .eq("id", id)
    .select("id, name, slug, is_active")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const id = String(body?.id ?? "")
  const isActive = body?.is_active

  if (!id || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "id e is_active são obrigatórios." },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("categories")
    .update({ is_active: isActive })
    .eq("id", id)
    .select("id, name, slug, is_active")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 })
  }

  const { error } = await supabase.from("categories").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
