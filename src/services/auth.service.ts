import bcrypt from "bcrypt";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAdmin(email: string, password: string) {
  const supabase = await createSupabaseServerClient();

  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (error || !user) {
    throw new Error("Credenciais inválidas.");
  }

  if (user.role !== "admin") {
    throw new Error("Acesso não permitido.");
  }

  if (user.status !== "ativo") {
    throw new Error("Acesso não permitido.");
  }

  const passwordMatch = await bcrypt.compare(
    password,
    user.password_hash
  );

  if (!passwordMatch) {
    throw new Error("Credenciais inválidas.");
  }

  return user;
}
