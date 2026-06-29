import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { redirectAuthenticatedUser } from "@/app/(auth)/login/actions";
import { LoginForm } from "@/components/auth/login-form";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { authDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = authDictionary.login;

export const metadata = {
  title: t.metaTitle,
};

export default async function LoginPage() {
  await redirectAuthenticatedUser();

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-card lg:block">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_42%),radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--accent)_32%,transparent),transparent_24rem)]" />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link className="flex items-center gap-3 text-lg font-black" href="/">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              ME
            </span>
            Modern Edu
          </Link>
          <div className="max-w-lg">
            <p className="text-sm font-bold uppercase text-primary">
              {t.sideLabel}
            </p>
            <h1 className="mt-4 text-5xl font-black leading-tight">
              {t.sideTitle}
            </h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {t.sideText}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {t.sideStats.map((stat) => (
              <div className="rounded-3xl bg-background/75 p-4" key={stat.label}>
                <p className="text-2xl font-black">{stat.value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center justify-between">
            <Button asChild variant="ghost">
              <Link href="/">
                <ArrowLeft aria-hidden className="size-4" />
                {t.back}
              </Link>
            </Button>
            <ThemeToggle />
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl shadow-primary/10 sm:p-8">
            <div>
              <p className="text-sm font-bold text-primary">{t.eyebrow}</p>
              <h2 className="mt-3 text-3xl font-black">{t.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                {t.description}
              </p>
            </div>

            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
