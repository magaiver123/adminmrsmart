import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data } = await supabase
  .from("products")
  .select(`
    id,
    name,
    description,
    image_url,
    categories ( name )
  `)
  .order("name");

  return NextResponse.json(data || [])
}
