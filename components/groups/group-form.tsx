"use client";

import { useActionState } from "react";
import { BookOpen, FileText } from "lucide-react";

import type { GroupActionState } from "@/features/groups/actions";
import { Button } from "@/components/ui/button";
import { groupManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

type GroupFormProps = {
  action: (
    state: GroupActionState,
    formData: FormData,
  ) => Promise<GroupActionState>;
};

const initialState: GroupActionState = {
  status: "idle",
};

const t = groupManagementDictionary;

export function GroupForm({ action }: GroupFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black">{t.createTitle}</h2>

      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "mt-4 rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-semibold text-success"
              : "mt-4 rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger"
          }
        >
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="mt-6 grid gap-4">
        <label className="grid gap-2">
          <span className="text-sm font-bold">{t.name}</span>
          <span className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <BookOpen aria-hidden className="size-5 text-muted-foreground" />
            <input
              className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
              name="name"
              placeholder={t.namePlaceholder}
              required
              type="text"
            />
          </span>
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-bold">{t.descriptionLabel}</span>
          <span className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <FileText
              aria-hidden
              className="mt-1 size-5 text-muted-foreground"
            />
            <textarea
              className="min-h-24 w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
              name="description"
              placeholder={t.descriptionPlaceholder}
            />
          </span>
        </label>

        <Button disabled={isPending} type="submit">
          {isPending ? t.creating : t.create}
        </Button>
      </form>
    </section>
  );
}
