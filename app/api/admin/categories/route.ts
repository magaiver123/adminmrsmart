import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

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
    .eq("store_id", storeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const categories =
    (data ?? [])
      .map((row: any) => ({
        id: row.categories.id,
        name: row.categories.name,
        slug: row.categories.slug,
        is_active: row.is_active,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"));

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const name = String(body?.name ?? "").trim();
  const isActive = Boolean(body?.is_active);
  const storeId = String(body?.store_id ?? "");

  if (!name || !storeId) {
    return NextResponse.json(
      { error: "name e store_id são obrigatórios." },
      { status: 400 }
    );
  }

  const slug = generateSlug(name);

  const { data: existingCategory, error: findError } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (findError) {
    return NextResponse.json({ error: findError.message }, { status: 500 });
  }

  let categoryId = existingCategory?.id as string | undefined;

  if (!categoryId) {
    const { data: insertedCategory, error: insertCategoryError } = await supabase
      .from("categories")
      .insert({
        name,
        slug,
        is_active: true,
      })
      .select("id")
      .single();

    if (insertCategoryError) {
      return NextResponse.json(
        { error: insertCategoryError.message },
        { status: 500 }
      );
    }

    categoryId = insertedCategory.id;
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
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: categoryId });
}

export async function PUT(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const id = String(body?.id ?? "");
  const name = String(body?.name ?? "").trim();
  const storeId = String(body?.store_id ?? "");
  const isActive = Boolean(body?.is_active);

  if (!id || !name || !storeId) {
    return NextResponse.json(
      { error: "id, name e store_id são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: link, error: linkError } = await supabase
    .from("store_categories")
    .select("category_id")
    .eq("store_id", storeId)
    .eq("category_id", id)
    .maybeSingle();

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  if (!link) {
    return NextResponse.json(
      { error: "Categoria não vinculada a esta loja." },
      { status: 404 }
    );
  }

  const { error: categoryError } = await supabase
    .from("categories")
    .update({
      name,
      slug: generateSlug(name),
    })
    .eq("id", id);

  if (categoryError) {
    return NextResponse.json({ error: categoryError.message }, { status: 500 });
  }

  const { error: linkUpdateError } = await supabase
    .from("store_categories")
    .update({ is_active: isActive })
    .eq("store_id", storeId)
    .eq("category_id", id);

  if (linkUpdateError) {
    return NextResponse.json({ error: linkUpdateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const id = String(body?.id ?? "");
  const storeId = String(body?.store_id ?? "");
  const isActive = body?.is_active;

  if (!id || !storeId || typeof isActive !== "boolean") {
    return NextResponse.json(
      { error: "id, store_id e is_active são obrigatórios." },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("store_categories")
    .update({ is_active: isActive })
    .eq("store_id", storeId)
    .eq("category_id", id);

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
    .from("store_categories")
    .delete()
    .eq("store_id", storeId)
    .eq("category_id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

