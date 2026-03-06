import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")

  if (!storeId) {
    return NextResponse.json([], { status: 200 })
  }

  const { data, error } = await supabase
    .from("store_products")
    .select(`
      id,
      price,
      is_active,
      products (
        id,
        name,
        image_url,
        categories ( name )
      )
    `)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { store_id, product_id, price } = await req.json()

  const { error } = await supabase
    .from("store_products")
    .insert({
      store_id,
      product_id,
      price,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { id, store_id, price, is_active } = await req.json()

  if (!id || !store_id) {
    return NextResponse.json({ error: "ID e store_id são obrigatórios" }, { status: 400 })
  }

  const updateData: any = {}

  if (price !== undefined) updateData.price = price
  if (is_active !== undefined) updateData.is_active = is_active

  const { error } = await supabase
    .from("store_products")
    .update(updateData)
    .eq("id", id)
    .eq("store_id", store_id)

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
    return NextResponse.json({ error: "ID e store_id são obrigatórios" }, { status: 400 })
  }

  const { error } = await supabase
    .from("store_products")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

