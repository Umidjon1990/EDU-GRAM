"use client";

import { useActionState } from "react";
import { createAssignmentAction, type AssignmentState } from "@/features/assignments/actions";
import { Button } from "@/components/ui/button";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = assignmentDictionary;
const initialState: AssignmentState = { status: "idle" };
const responseModes = ["TEXT", "AUDIO", "IMAGE", "VIDEO", "FILE"] as const;

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
        <select className="rounded-2xl border border-border bg-background px-4 py-3" name="responseMode" required>
          {responseModes.map((mode) => (
            <option key={mode} value={mode}>
              {t.responseModes[mode]}
            </option>
          ))}
        </select>
        <div className="grid gap-2 sm:grid-cols-3">
          <label className="grid gap-1 text-sm font-bold text-muted-foreground">
            <span>{t.maxAttachmentCount}</span>
            <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue="1" name="maxAttachmentCount">
              {[1, 2, 3, 4, 5].map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-muted-foreground">
            <span>{t.audioMaxMinutes}</span>
            <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue="180" name="audioMaxSeconds">
              {[60, 120, 180, 240, 300].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds / 60} daqiqa
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-bold text-muted-foreground">
            <span>{t.videoMaxMinutes}</span>
            <select className="rounded-2xl border border-border bg-background px-4 py-3" defaultValue="60" name="videoMaxSeconds">
              {[30, 60, 90, 120, 180].map((seconds) => (
                <option key={seconds} value={seconds}>
                  {seconds < 60 ? `${seconds} soniya` : `${seconds / 60} daqiqa`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="rounded-2xl bg-muted px-3 py-2 text-xs font-bold text-muted-foreground">
          {t.maxAttachmentCountHint}
        </p>
        <textarea className="min-h-28 rounded-2xl border border-border bg-background px-4 py-3" name="description" placeholder={t.descriptionPlaceholder} required />
        <label className="grid gap-2 rounded-2xl border border-dashed border-border bg-background px-4 py-3 text-sm font-bold text-muted-foreground">
          <span>{t.sourceFile}</span>
          <span>{t.maxFileSize}</span>
          <input
            accept="text/plain,application/pdf,image/*,audio/*,video/mp4,video/webm,video/quicktime"
            name="sourceFile"
            type="file"
          />
        </label>
        <input className="rounded-2xl border border-border bg-background px-4 py-3" name="dueAt" type="datetime-local" />
        <textarea className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3" name="rubric" placeholder={t.rubricPlaceholder} />
        <div className="grid gap-2 rounded-2xl bg-muted p-3 text-sm">
          <p className="font-black">{t.templates}</p>
          <p>{t.pronunciationTemplate}: talaffuz 50, ravonlik 30, ishtirok 20</p>
          <p>{t.writingTemplate}: mazmun 40, grammatika 40, tartib 20</p>
        </div>
        <Button disabled={isPending} type="submit">{isPending ? t.creating : t.create}</Button>
      </form>
    </section>
  );
}
