export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getDashboardData } from "@/src/services/dashboard.service";

export async function GET(req: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get("store_id");

    if (!storeId) {
      return NextResponse.json(
        { error: "store_id é obrigatório." },
        { status: 400 }
      );
    }

    const data = await getDashboardData(supabase, storeId);

    return NextResponse.json(data);
  } catch (error) {
    console.error("[DASHBOARD API ERROR]", error);
    return NextResponse.json(
      { error: "Erro ao carregar dashboard" },
      { status: 500 }
    );
  }
}
