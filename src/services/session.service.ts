import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function logoutAdmin(sessionId: string) {
  const supabase = await createSupabaseServerClient()

  await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId)
}
