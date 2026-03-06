import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get("store_id");
  const mode = searchParams.get("mode");

  if (!storeId || !mode) {
    return NextResponse.json(
      { error: "store_id e mode são obrigatórios." },
      { status: 400 }
    );
  }

  if (mode === "products") {
    const { data: storeProducts, error: storeProductsError } = await supabase
      .from("store_products")
      .select(
        `
        product_id,
        products!inner (
          id,
          name,
          is_active
        )
      `
      )
      .eq("store_id", storeId)
      .eq("is_active", true)
      .eq("products.is_active", true);

    if (storeProductsError) {
      return NextResponse.json(
        { error: storeProductsError.message },
        { status: 500 }
      );
    }

    const productIds = (storeProducts ?? [])
      .map((item: any) => item.product_id)
      .filter(Boolean);

    let stockRows: Array<{ product_id: string; quantity: number }> = [];

    if (productIds.length > 0) {
      const { data: stockData, error: stockError } = await supabase
        .from("product_stock")
        .select("product_id, quantity")
        .eq("store_id", storeId)
        .in("product_id", productIds);

      if (stockError) {
        return NextResponse.json({ error: stockError.message }, { status: 500 });
      }

      stockRows = (stockData as Array<{ product_id: string; quantity: number }>) ?? [];
    }

    const quantityMap = new Map(
      stockRows.map((row) => [row.product_id, row.quantity])
    );

    const products = (storeProducts ?? [])
      .map((item: any) => ({
        id: item.products.id,
        name: item.products.name,
        quantity: quantityMap.get(item.product_id) ?? 0,
      }))
      .sort((a: any, b: any) => a.name.localeCompare(b.name, "pt-BR"));

    return NextResponse.json(products);
  }

  if (mode === "history") {
    const { data, error } = await supabase
      .from("stock_movements")
      .select(
        `
        id,
        type,
        quantity,
        reason,
        created_at,
        products ( name )
      `
      )
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const history = (data || []).map((item: any) => ({
      id: item.id,
      product: item.products?.name ?? "-",
      type: item.type,
      qty: item.quantity,
      reason: item.reason,
      date: new Date(item.created_at).toLocaleString("pt-BR"),
      user: "Sistema",
    }));

    return NextResponse.json(history);
  }

  return NextResponse.json({ error: "mode inválido." }, { status: 400 });
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const body = await req.json();

  const storeId = String(body?.storeId ?? "");
  const productId = String(body?.productId ?? "");
  const type = body?.type as "entrada" | "saida" | undefined;
  const quantity = Number(body?.quantity ?? 0);
  const reason = body?.reason as string | undefined;

  if (!storeId || !productId || !type || quantity <= 0) {
    return NextResponse.json(
      { error: "storeId, productId, type e quantity são obrigatórios." },
      { status: 400 }
    );
  }

  const { data: linkedProduct, error: linkError } = await supabase
    .from("store_products")
    .select("id")
    .eq("store_id", storeId)
    .eq("product_id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 500 });
  }

  if (!linkedProduct) {
    return NextResponse.json(
      { error: "Produto não vinculado a esta loja." },
      { status: 404 }
    );
  }

  const { data: currentStock, error: stockError } = await supabase
    .from("product_stock")
    .select("quantity")
    .eq("product_id", productId)
    .eq("store_id", storeId)
    .maybeSingle();

  if (stockError) {
    return NextResponse.json({ error: stockError.message }, { status: 500 });
  }

  const current = Number(currentStock?.quantity ?? 0);
  const newQuantity = type === "entrada" ? current + quantity : current - quantity;

  if (newQuantity < 0) {
    return NextResponse.json(
      { error: "Estoque não pode ficar negativo." },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const { error: historyError } = await supabase.from("stock_movements").insert({
    product_id: productId,
    store_id: storeId,
    type,
    quantity,
    reason: reason ?? (type === "entrada" ? "Entrada manual" : "Saída manual"),
    user_id: null,
    created_at: now,
  });

  if (historyError) {
    return NextResponse.json({ error: historyError.message }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("product_stock")
    .upsert(
      {
        store_id: storeId,
        product_id: productId,
        quantity: newQuantity,
        updated_at: now,
      },
      { onConflict: "store_id,product_id" }
    );

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
