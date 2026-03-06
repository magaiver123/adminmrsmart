import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logoutAdmin } from "@/src/services/session.service";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("admin_session");

    if (!sessionCookie) {
      return NextResponse.json(
        { error: "Sessão não encontrada." },
        { status: 401 }
      );
    }

    await logoutAdmin(sessionCookie.value);

    const response = NextResponse.json({ success: true });

    response.cookies.delete("admin_session");

    return response;
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao fazer logout." },
      { status: 500 }
    );
  }
}
