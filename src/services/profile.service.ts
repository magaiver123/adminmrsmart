import bcrypt from "bcrypt"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function getAdminProfile(sessionId: string) {
  const supabase = await createSupabaseServerClient()

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("*, users(*)")
    .eq("id", sessionId)
    .single()

  if (!session || !session.users) {
    throw new Error("Sessão inválida.")
  }

  return {
    id: session.users.id,
    name: session.users.name,
    email: session.users.email,
    role: session.users.role,
  }
}

export async function updateAdminName(userId: string, name: string) {
  const supabase = await createSupabaseServerClient()

  await supabase
    .from("users")
    .update({ name })
    .eq("id", userId)
}

export async function updateAdminPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const supabase = await createSupabaseServerClient()

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single()

  if (!user) throw new Error("Usuário não encontrado.")

  const passwordMatch = await bcrypt.compare(
    currentPassword,
    user.password_hash
  )

  if (!passwordMatch) {
    throw new Error("Senha atual incorreta.")
  }

  if (newPassword.length < 6)
    throw new Error("A senha deve ter no mínimo 6 caracteres.")

  if (newPassword.length > 15)
    throw new Error("A senha deve ter no máximo 15 caracteres.")

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword))
    throw new Error("A senha deve conter pelo menos um caractere especial.")

  if (newPassword === currentPassword)
    throw new Error("A nova senha deve ser diferente da atual.")

  const hashed = await bcrypt.hash(newPassword, 10)

  await supabase
    .from("users")
    .update({ password_hash: hashed })
    .eq("id", userId)
}
