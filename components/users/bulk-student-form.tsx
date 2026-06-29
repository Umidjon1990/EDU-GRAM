"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { bulkCreateStudentsAction, type ManagedUserState } from "@/features/users/actions";
import { userManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = userManagementDictionary.students;
const initialState: ManagedUserState = { status: "idle" };

export function BulkStudentForm() {
  const [state, formAction, isPending] = useActionState(
    bulkCreateStudentsAction,
    initialState,
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black">{t.bulkTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.bulkDescription}</p>

      <div className="mt-4 rounded-2xl bg-muted p-4">
        <p className="text-xs font-black text-muted-foreground">Shablon</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm font-semibold">
          {t.bulkTemplate}
        </pre>
      </div>

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

      <form action={formAction} className="mt-5 grid gap-4">
        <textarea
          className="min-h-52 rounded-2xl border border-border bg-background px-4 py-3 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          name="bulkText"
          placeholder={t.bulkPlaceholder}
          required
        />
        <Button disabled={isPending} type="submit">
          {isPending ? userManagementDictionary.common.creating : t.bulkSubmit}
        </Button>
      </form>
    </section>
  );
}
