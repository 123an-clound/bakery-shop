"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { signUp, type AuthState } from "@/lib/actions/auth";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: AuthState = { status: "idle" };

export function SignUpForm() {
  const t = useTranslations("Auth");
  const [state, formAction, isPending] = useActionState(signUp, initialState);

  if (state.status === "confirm_email") {
    return <p className="bg-success/15 text-success-foreground rounded-2xl p-4 text-sm">{t("confirmEmail")}</p>;
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("fullName")}</label>
        <Input name="fullName" required className="rounded-full" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("email")}</label>
        <Input name="email" type="email" required className="rounded-full" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("password")}</label>
        <Input name="password" type="password" required minLength={6} className="rounded-full" />
      </div>

      {state.status === "error" ? <p className="text-destructive text-sm">{state.message}</p> : null}

      <Button type="submit" disabled={isPending} className="w-full rounded-full">
        {isPending ? "..." : t("signUpSubmit")}
      </Button>

      <p className="text-muted-foreground text-center text-sm">
        {t("haveAccount")}{" "}
        <Link href="/tai-khoan/dang-nhap" className="text-primary hover:underline">
          {t("signInLink")}
        </Link>
      </p>
    </form>
  );
}
