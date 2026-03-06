import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type UserStatus = "ativo" | "bloqueado";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");

  if (!storeId) {
    return NextResponse.json(
      { error: "store_id é obrigatório." },
      { status: 400 }
    );
  }

  const [{ data: storeUsersData, error: usersError }, { data: ordersData, error: ordersError }] =
    await Promise.all([
      supabase
        .from("store_users")
        .select(
          `
          user_id,
          users (
            id,
            name,
            cpf,
            status,
            last_access_at
          )
        `
        )
        .eq("store_id", storeId),
      supabase.from("orders").select("*").eq("store_id", storeId),
    ]);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  if (ordersError) {
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }

  const users =
    storeUsersData
      ?.map((item: any) => item.users)
      .filter((user: any) => Boolean(user)) ?? [];

  return NextResponse.json({
    users,
    orders: ordersData ?? [],
  });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const userId = body?.user_id as string | undefined;
  const status = body?.status as UserStatus | undefined;

  if (!userId || !status) {
    return NextResponse.json(
      { error: "user_id e status são obrigatórios." },
      { status: 400 }
    );
  }

  if (status !== "ativo" && status !== "bloqueado") {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
