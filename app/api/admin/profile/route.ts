import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import {
  getAdminProfile,
  updateAdminName,
  updateAdminPassword,
} from "@/src/services/profile.service"

export async function GET() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("admin_session")

  if (!sessionCookie) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  try {
    const profile = await getAdminProfile(sessionCookie.value)
    return NextResponse.json(profile)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 401 })
  }
}

export async function PUT(req: Request) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get("admin_session")

  if (!sessionCookie) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 })
  }

  const body = await req.json()

  try {
    const profile = await getAdminProfile(sessionCookie.value)

    if (body.type === "name") {
      await updateAdminName(profile.id, body.name)
      return NextResponse.json({ success: true })
    }

    if (body.type === "password") {
      await updateAdminPassword(
        profile.id,
        body.currentPassword,
        body.newPassword
      )
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Operação inválida." }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
}
