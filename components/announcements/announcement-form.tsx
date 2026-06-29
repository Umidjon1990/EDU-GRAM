"use client";

import { useActionState } from "react";

import {
  createAnnouncementAction,
  type AnnouncementState,
} from "@/features/announcements/actions";
import { Button } from "@/components/ui/button";
import { announcementDictionary } from "@/i18n/locales/uz-Latn-UZ";

const initialState: AnnouncementState = { status: "idle" };
const t = announcementDictionary;

export function AnnouncementForm({ groupId }: { groupId: string }) {
  const [state, formAction, isPending] = useActionState(
    createAnnouncementAction,
    initialState,
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-xl font-black">{t.createTitle}</h2>
      {state.message ? (
        <p
          className={
            state.status === "success"
              ? "mt-3 rounded-2xl bg-success/10 px-4 py-3 text-sm font-bold text-success"
              : "mt-3 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-bold text-danger"
          }
        >
          {state.message}
        </p>
      ) : null}
      <form action={formAction} className="mt-4 grid gap-3">
        <input name="groupId" type="hidden" value={groupId} />
        <input
          className="rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          name="title"
          placeholder={t.titlePlaceholder}
          required
        />
        <textarea
          className="min-h-28 resize-none rounded-2xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
          name="body"
          placeholder={t.bodyPlaceholder}
          required
        />
        <Button disabled={isPending} type="submit">
          {isPending ? t.creating : t.create}
        </Button>
      </form>
    </section>
  );
}
