import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

type UserStatus = "ativo" | "bloqueado"

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(req.url)
  const storeId = searchParams.get("store_id")

  const [usersQuery, ordersQuery, storesQuery] = await Promise.all([
    supabase
      .from("users")
      .select("id, name, cpf, email, phone, status, last_access_at, created_at")
      .eq("role", "cliente")
      .order("created_at", { ascending: false }),
    (() => {
      const query = supabase
        .from("orders")
        .select(
          "id, order_number, user_id, status, total_amount, payment_method, created_at, store_id"
        )
        .not("user_id", "is", null)
        .order("created_at", { ascending: false })

      return storeId ? query.eq("store_id", storeId) : query
    })(),
    supabase.from("stores").select("id, name, status").order("name", { ascending: true }),
  ])

  if (usersQuery.error) {
    return NextResponse.json({ error: usersQuery.error.message }, { status: 500 })
  }

  if (ordersQuery.error) {
    return NextResponse.json({ error: ordersQuery.error.message }, { status: 500 })
  }

  if (storesQuery.error) {
    return NextResponse.json({ error: storesQuery.error.message }, { status: 500 })
  }

  const orders = ordersQuery.data ?? []
  const usersFromDb = usersQuery.data ?? []

  if (storeId) {
    const usersWithOrders = new Set(orders.map((order: any) => order.user_id))
    const filteredUsers = usersFromDb.filter((user: any) => usersWithOrders.has(user.id))

    return NextResponse.json({
      users: filteredUsers,
      orders,
      stores: storesQuery.data ?? [],
    })
  }

  return NextResponse.json({
    users: usersFromDb,
    orders,
    stores: storesQuery.data ?? [],
  })
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await req.json()

  const userId = body?.user_id as string | undefined
  const status = body?.status as UserStatus | undefined

  if (!userId || !status) {
    return NextResponse.json(
      { error: "user_id e status são obrigatórios." },
      { status: 400 }
    )
  }

  if (status !== "ativo" && status !== "bloqueado") {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 })
  }

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
