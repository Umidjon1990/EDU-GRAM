"use client";

import { useActionState } from "react";
import { Eye, LockKeyhole, UserRound } from "lucide-react";

import { loginAction, type LoginState } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import { authDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = authDictionary.login;

const initialState: LoginState = {
  status: "idle",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      {state.status === "error" && state.message ? (
        <p className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          {state.message}
        </p>
      ) : null}

      <label className="grid gap-2">
        <span className="text-sm font-bold">{t.username}</span>
        <span className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <UserRound aria-hidden className="size-5 text-muted-foreground" />
          <input
            autoComplete="username"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            name="username"
            placeholder={t.usernamePlaceholder}
            required
            type="text"
          />
        </span>
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-bold">{t.password}</span>
        <span className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
          <LockKeyhole aria-hidden className="size-5 text-muted-foreground" />
          <input
            autoComplete="current-password"
            className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
            name="password"
            placeholder={t.passwordPlaceholder}
            required
            type="password"
          />
          <span
            aria-label={t.showPassword}
            className="text-muted-foreground"
            role="img"
          >
            <Eye aria-hidden className="size-5" />
          </span>
        </span>
      </label>

      <div className="flex items-center justify-between gap-4 text-sm">
        <label className="flex items-center gap-2 text-muted-foreground">
          <input
            className="size-4 accent-[var(--primary)]"
            name="remember"
            type="checkbox"
          />
          {t.remember}
        </label>
        <span className="font-bold text-primary">{t.forgotPassword}</span>
      </div>

      <Button className="w-full" disabled={isPending} size="lg" type="submit">
        {isPending ? t.submitting : t.submit}
      </Button>
    </form>
  );
}
