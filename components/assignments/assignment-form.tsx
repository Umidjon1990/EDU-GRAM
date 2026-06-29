"use client";

import { useActionState } from "react";
import { createAssignmentAction, type AssignmentState } from "@/features/assignments/actions";
import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = assignmentDictionary;
const initialState: AssignmentState = { status: "idle" };

export function AssignmentForm({ groups }: { groups: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createAssignmentAction, initialState);
  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-2xl font-black">{t.createTitle}</h2>
      {state.message ? <p className="mt-3 rounded-2xl bg-muted px-4 py-3 text-sm font-bold">{state.message}</p> : null}
      <form action={formAction} className="mt-5 grid gap-3">
        <select className="rounded-2xl border border-border bg-background px-4 py-3" name="groupId" required>
          <option value="">{t.chooseGroup}</option>
          {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
        </select>
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="title" placeholder={t.titlePlaceholder} required />
        <textarea className="min-h-28 rounded-2xl border border-border bg-background px-4 py-3" name="description" placeholder={t.descriptionPlaceholder} required />
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="dueAt" type="datetime-local" />
        <Button disabled={isPending} type="submit">{isPending ? t.creating : t.create}</Button>
      </form>
    </section>
  );
}
