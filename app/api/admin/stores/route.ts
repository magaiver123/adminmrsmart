import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from("stores")
    .select("id, name, status")
    .eq("status", true) // 🔥 Apenas lojas ativas
    .order("name", { ascending: true })

  if (error) {
    console.error("Erro ao buscar lojas:", error)
    return NextResponse.json(
      { error: "Erro ao buscar lojas" },
      { status: 500 }
    )
  }

  return NextResponse.json(data)
}
