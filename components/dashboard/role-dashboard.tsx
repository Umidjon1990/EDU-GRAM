import { BookOpenCheck, MessageSquareText, ShieldCheck } from "lucide-react";

import { dashboardDictionary } from "@/i18n/locales/uz-Latn-UZ";

type RoleDashboardProps = {
  title: string;
  description: string;
  items: readonly string[];
};

const icons = [ShieldCheck, MessageSquareText, BookOpenCheck];

export function RoleDashboard({ description, items, title }: RoleDashboardProps) {
  return (
    <section className="grid gap-8">
      <div className="max-w-3xl">
        <p className="text-sm font-bold text-primary">
          {dashboardDictionary.status.foundation}
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 text-lg leading-8 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];

          return (
            <article
              className="rounded-3xl border border-border bg-card p-6 shadow-sm"
              key={item}
            >
              <Icon aria-hidden className="size-7 text-primary" />
              <h2 className="mt-5 text-xl font-black">{item}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">
                {dashboardDictionary.status.next}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
