import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type StoreInput = {
  id?: string;
  name: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
};

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("stores")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const input = (await req.json()) as StoreInput;

  const { data: existingName } = await supabase
    .from("stores")
    .select("id")
    .ilike("name", input.name)
    .limit(1);

  if (existingName && existingName.length > 0) {
    return NextResponse.json(
      { error: "Já existe uma loja com esse nome." },
      { status: 409 }
    );
  }

  const { data: existingAddress } = await supabase
    .from("stores")
    .select("id")
    .eq("rua", input.rua)
    .eq("numero", input.numero)
    .eq("bairro", input.bairro)
    .eq("cidade", input.cidade)
    .eq("estado", input.estado)
    .limit(1);

  if (existingAddress && existingAddress.length > 0) {
    return NextResponse.json(
      { error: "Já existe uma loja cadastrada nesse endereço." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("stores").insert({
    name: input.name,
    slug: generateSlug(input.name),
    cep: input.cep,
    rua: input.rua,
    numero: input.numero,
    bairro: input.bairro,
    cidade: input.cidade,
    estado: input.estado,
    status: true,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const input = (await req.json()) as StoreInput;

  if (!input.id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name: input.name,
      cep: input.cep,
      rua: input.rua,
      numero: input.numero,
      bairro: input.bairro,
      cidade: input.cidade,
      estado: input.estado,
    })
    .eq("id", input.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const id = String(body?.id ?? "");
  const current = body?.current;

  if (!id || typeof current !== "boolean") {
    return NextResponse.json(
      { error: "id e current são obrigatórios." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("stores")
    .update({ status: !current })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });
  }

  const { error } = await supabase.from("stores").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
