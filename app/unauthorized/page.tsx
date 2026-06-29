import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { unauthorizedDictionary } from "@/i18n/locales/uz-Latn-UZ";
import { getCurrentUser, getDashboardPath } from "@/lib/auth/session";

const t = unauthorizedDictionary;

export const metadata = {
  title: t.title,
};

export default async function UnauthorizedPage() {
  const user = await getCurrentUser();
  const href = user ? getDashboardPath(user.role) : "/login";

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="w-full max-w-lg rounded-[2rem] border border-border bg-card p-8 text-center shadow-2xl shadow-primary/10">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
          <ShieldAlert aria-hidden className="size-7" />
        </div>
        <h1 className="mt-6 text-3xl font-black">{t.title}</h1>
        <p className="mt-4 leading-7 text-muted-foreground">{t.description}</p>
        <Button asChild className="mt-7">
          <Link href={href}>{user ? t.backToPanel : t.login}</Link>
        </Button>
      </section>
    </main>
  );
}
