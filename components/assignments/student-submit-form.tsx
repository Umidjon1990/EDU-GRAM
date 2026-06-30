"use client";

import { useActionState } from "react";
import { submitAssignmentAction, type AssignmentState } from "@/features/assignments/actions";
import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = assignmentDictionary;
const initialState: AssignmentState = { status: "idle" };

export function StudentSubmitForm({ assignmentId }: { assignmentId: string }) {
  const [state, formAction, isPending] = useActionState(submitAssignmentAction, initialState);
  return (
    <form action={formAction} className="mt-4 grid gap-3">
      <input name="assignmentId" type="hidden" value={assignmentId} />
      <textarea className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3" name="body" placeholder={t.answerPlaceholder} />
      <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm font-black text-muted-foreground hover:bg-muted">
        {t.fileAttachment}
        <input className="sr-only" name="attachment" type="file" />
      </label>
      <Button disabled={isPending} type="submit">{isPending ? t.submitting : t.submit}</Button>
      {state.message ? <p className="text-sm font-bold text-primary">{state.message}</p> : null}
    </form>
  );
}
