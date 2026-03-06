import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function normalizeOrder(supabase: any, storeId: string) {
  const { data: activeSlides, error } = await supabase
    .from("kiosk_slides")
    .select("id")
    .eq("store_id", storeId)
    .eq("active", true)
    .order("order", { ascending: true });

  if (error || !activeSlides) return;

  for (let i = 0; i < activeSlides.length; i++) {
    await supabase
      .from("kiosk_slides")
      .update({ order: i + 1 })
      .eq("id", activeSlides[i].id)
      .eq("store_id", storeId);
  }
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
    .from("kiosk_slides")
    .select("*")
    .eq("store_id", storeId)
    .order("order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const formData = await req.formData();

  const storeId = String(formData.get("store_id") ?? "");
  const duration = Number(formData.get("duration") ?? 5);
  const active = String(formData.get("active") ?? "true") === "true";
  const file = formData.get("file");

  if (!storeId || !(file instanceof File)) {
    return NextResponse.json(
      { error: "store_id e file são obrigatórios." },
      { status: 400 }
    );
  }

  const path = `${crypto.randomUUID()}-${file.name}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("kiosk-slides")
    .upload(path, fileBuffer, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: publicData } = supabase.storage
    .from("kiosk-slides")
    .getPublicUrl(path);

  const { error: insertError } = await supabase.from("kiosk_slides").insert({
    image_url: publicData.publicUrl,
    duration,
    active,
    order: active ? 9999 : 0,
    store_id: storeId,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  await normalizeOrder(supabase, storeId);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();
  const action = body?.action as string | undefined;
  const storeId = body?.store_id as string | undefined;

  if (!action || !storeId) {
    return NextResponse.json(
      { error: "action e store_id são obrigatórios." },
      { status: 400 }
    );
  }

  if (action === "reorder") {
    const orderedIds = body?.ordered_ids as string[] | undefined;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json(
        { error: "ordered_ids é obrigatório." },
        { status: 400 }
      );
    }

    for (let i = 0; i < orderedIds.length; i++) {
      await supabase
        .from("kiosk_slides")
        .update({ order: i + 1 })
        .eq("id", orderedIds[i])
        .eq("store_id", storeId);
    }

    await normalizeOrder(supabase, storeId);
    return NextResponse.json({ success: true });
  }

  if (action === "toggle") {
    const id = body?.id as string | undefined;
    const active = body?.active as boolean | undefined;

    if (!id || typeof active !== "boolean") {
      return NextResponse.json(
        { error: "id e active são obrigatórios." },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("kiosk_slides")
      .update({
        active,
        order: active ? 9999 : 0,
      })
      .eq("id", id)
      .eq("store_id", storeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await normalizeOrder(supabase, storeId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
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
    .from("kiosk_slides")
    .delete()
    .eq("id", id)
    .eq("store_id", storeId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await normalizeOrder(supabase, storeId);
  return NextResponse.json({ success: true });
}
