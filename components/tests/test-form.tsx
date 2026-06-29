"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { createTestAction, type TestState } from "@/features/tests/actions";
import { testDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = testDictionary;
const initialState: TestState = { status: "idle" };

export function TestForm({ groups }: { groups: { id: string; name: string }[] }) {
  const [state, formAction, isPending] = useActionState(createTestAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-2xl font-black">{t.createTitle}</h2>
      <select className="rounded-2xl border border-border bg-background px-4 py-3" name="groupId" required>
        <option value="">{t.chooseGroup}</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
      <input className="rounded-2xl border border-border bg-background px-4 py-3" name="title" placeholder={t.titlePlaceholder} required />
      <textarea className="min-h-20 rounded-2xl border border-border bg-background px-4 py-3" name="description" placeholder={t.descriptionPlaceholder} />
      <textarea className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3" name="prompt" placeholder={t.questionPlaceholder} required />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="optionA" placeholder={t.optionA} required />
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="optionB" placeholder={t.optionB} required />
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="optionC" placeholder={t.optionC} required />
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="optionD" placeholder={t.optionD} required />
      </div>
      <select className="rounded-2xl border border-border bg-background px-4 py-3" name="correctAnswer" required>
        <option value="">{t.correctAnswer}</option>
        {["A", "B", "C", "D"].map((answer) => (
          <option key={answer} value={answer}>
            {answer}
          </option>
        ))}
      </select>
      {state.message ? (
        <p className={state.status === "error" ? "text-sm font-semibold text-destructive" : "text-sm font-semibold text-primary"}>
          {state.message}
        </p>
      ) : null}
      <Button disabled={isPending || groups.length === 0} type="submit">
        {isPending ? t.creating : t.create}
      </Button>
    </form>
  );
}
