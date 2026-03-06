import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

  const { data: totems, error } = await supabase
    .from("totems")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!totems || totems.length === 0) {
    return NextResponse.json([]);
  }

  const storeIds = [...new Set(totems.map((t) => t.store_id))];
  const { data: stores } = await supabase
    .from("stores")
    .select("id, name")
    .in("id", storeIds);

  const storeMap = new Map(stores?.map((s) => [s.id, s.name]));

  return NextResponse.json(
    totems.map((totem) => ({
      ...totem,
      store_name: storeMap.get(totem.store_id) || "",
    }))
  );
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const name = String(body?.name ?? "").trim();
  const storeId = String(body?.store_id ?? "").trim();
  const activationCode = String(body?.activation_code ?? "").trim();

  if (!name || !storeId || !activationCode) {
    return NextResponse.json(
      { error: "Todos os campos são obrigatórios." },
      { status: 400 }
    );
  }

  const codePattern = /^T-\d{6}$/;
  if (!codePattern.test(activationCode)) {
    return NextResponse.json(
      { error: "O código deve estar no formato T-123456." },
      { status: 400 }
    );
  }

  const { data: existingCode } = await supabase
    .from("totems")
    .select("id")
    .eq("activation_code", activationCode)
    .maybeSingle();

  if (existingCode) {
    return NextResponse.json(
      { error: "Já existe um totem com esse código cadastrado." },
      { status: 409 }
    );
  }

  const { data: existingName } = await supabase
    .from("totems")
    .select("id")
    .eq("name", name)
    .eq("store_id", storeId)
    .maybeSingle();

  if (existingName) {
    return NextResponse.json(
      { error: "Já existe um totem com esse nome nesta loja." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("totems").insert({
    name,
    store_id: storeId,
    activation_code: activationCode,
    status: "inactive",
    device_id: null,
    activated_at: null,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const id = String(body?.id ?? "");
  const storeId = String(body?.store_id ?? "");
  const name = String(body?.name ?? "").trim();

  if (!id || !name || !storeId) {
    return NextResponse.json(
      { error: "id, store_id e name são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: existingName } = await supabase
    .from("totems")
    .select("id")
    .eq("name", name)
    .eq("store_id", storeId)
    .neq("id", id)
    .maybeSingle();

  if (existingName) {
    return NextResponse.json(
      { error: "Já existe um totem com esse nome nesta loja." },
      { status: 409 }
    );
  }

  const { error } = await supabase
    .from("totems")
    .update({
      name,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const id = String(body?.id ?? "");
  const storeId = String(body?.store_id ?? "");
  const status = body?.status as "active" | "inactive" | undefined;

  if (!id || !storeId || (status !== "active" && status !== "inactive")) {
    return NextResponse.json(
      { error: "id, store_id e status válidos são obrigatórios." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("totems")
    .update({ status })
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const storeId = searchParams.get("store_id");

  if (!id || !storeId) {
    return NextResponse.json(
      { error: "id e store_id são obrigatórios." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("totems")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
