"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { createBakeryRow } from "@/lib/bakery/mutations";
import { signInSchema, signUpSchema } from "@/lib/schemas/auth";

export interface AuthState {
  status: "idle" | "error" | "confirm_email";
  message?: string;
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });
  if (error) {
    return { status: "error", message: error.message };
  }

  // Supabase Auth issues a session immediately when email confirmation is
  // disabled; otherwise `session` is null until the user clicks the email
  // link. Handle both without assuming project config.
  if (data.user && !data.session) {
    return { status: "confirm_email" };
  }

  if (data.user) {
    await createBakeryRow({
      type: "customer",
      data: { user_id: data.user.id, full_name: parsed.data.fullName },
    }).catch((err) => console.error("[auth] khong the tao customer profile:", err));
  }

  redirect("/tai-khoan");
}

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "invalid_input" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { status: "error", message: "Email hoặc mật khẩu không đúng." };
  }

  redirect("/tai-khoan");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
