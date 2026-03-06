import { NextResponse } from "next/server";
import { loginAdmin } from "@/src/services/auth.service";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function getClientIp(req: Request) {
  return req.headers.get("x-forwarded-for") || "unknown";
}

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const ip = getClientIp(req);

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email e senha são obrigatórios." },
        { status: 400 }
      );
    }

    // 🔒 RATE LIMIT
    const { data: attempt } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("ip", ip)
      .single();

    if (attempt) {
      const now = new Date();
      const diff =
        now.getTime() - new Date(attempt.last_attempt).getTime();

      if (attempt.attempts >= 5 && diff < 15 * 60 * 1000) {
        return NextResponse.json(
          { error: "Muitas tentativas. Tente novamente em alguns minutos." },
          { status: 429 }
        );
      }
    }

    const user = await loginAdmin(email, password);

    // 🔄 INVALIDA SESSÕES ANTIGAS
    await supabase
      .from("admin_sessions")
      .delete()
      .eq("user_id", user.id);

    const { data: session } = await supabase
      .from("admin_sessions")
      .insert({
        user_id: user.id,
        last_activity: Date.now(),
      })
      .select()
      .single();

    // 🔄 ZERA RATE LIMIT
    await supabase.from("login_attempts").delete().eq("ip", ip);

    // 📋 LOG DE AUDITORIA
    await supabase.from("admin_login_logs").insert({
      user_id: user.id,
      ip,
      success: true,
    });

    const response = NextResponse.json({ success: true });

    response.cookies.set("admin_session", session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });

    return response;
  } catch (error: any) {
    // 🔒 INCREMENTA RATE LIMIT
    const { data: existing } = await supabase
      .from("login_attempts")
      .select("*")
      .eq("ip", ip)
      .single();

    if (existing) {
      await supabase
        .from("login_attempts")
        .update({
          attempts: existing.attempts + 1,
          last_attempt: new Date(),
        })
        .eq("ip", ip);
    } else {
      await supabase.from("login_attempts").insert({
        ip,
        attempts: 1,
        last_attempt: new Date(),
      });
    }

    // 📋 LOG DE FALHA
    await supabase.from("admin_login_logs").insert({
      user_id: null,
      ip,
      success: false,
    });

    return NextResponse.json(
      { error: error.message || "Erro interno no servidor." },
      { status: 401 }
    );
  }
}
