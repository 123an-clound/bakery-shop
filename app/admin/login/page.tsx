"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (response.ok) {
      router.replace(searchParams.get("redirect") || "/admin");
      router.refresh();
      return;
    }

    setPending(false);
    setError(
      response.status === 429
        ? "Bạn đã thử sai quá nhiều lần. Vui lòng thử lại sau 15 phút."
        : "Mật khẩu không đúng.",
    );
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Đăng nhập quản trị</CardTitle>
        <CardDescription>Tiệm Bánh Ngọt Ngào</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-password">Mật khẩu</Label>
            <Input
              id="admin-password"
              type="password"
              autoFocus
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "admin-password-error" : undefined}
            />
          </div>
          {error ? (
            <p id="admin-password-error" role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
