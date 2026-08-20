"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { signIn, type AuthState } from "@/lib/actions/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { status: "idle" };

export function SignInForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("email")}</label>
        <Input name="email" type="email" required className="rounded-full" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("password")}</label>
        <Input name="password" type="password" required className="rounded-full" />
      </div>

      {state.status === "error" ? <p className="text-destructive text-sm">{state.message}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full rounded-full">
        {isPending ? "..." : t("signInSubmit")}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t("noAccount")}{" "}
        <Link href="/tai-khoan/dang-ky" className="text-primary hover:underline">
          {t("signUpLink")}
        </Link>
      </p>
    </form>
  );
}
