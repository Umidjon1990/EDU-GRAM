"use client";

import { useActionState, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  bulkCreateAssignmentsAction,
  type AssignmentState,
} from "@/features/assignments/actions";
import { assignmentDictionary } from "@/i18n/locales/uz-Latn-UZ";

const t = assignmentDictionary;
const initialState: AssignmentState = { status: "idle" };
const responseModes = ["TEXT", "AUDIO", "IMAGE", "VIDEO", "FILE"] as const;

type AssignmentRow = {
  id: string;
  title: string;
  responseMode: (typeof responseModes)[number];
};

export function BulkAssignmentForm({
  groups,
}: {
  groups: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(
    bulkCreateAssignmentsAction,
    initialState,
  );
  const [rows, setRows] = useState<AssignmentRow[]>([
    {
      id: crypto.randomUUID(),
      title: "",
      responseMode: "AUDIO",
    },
  ]);
  const items = useMemo(
    () =>
      JSON.stringify(
        rows
          .map(({ responseMode, title }) => ({
            responseMode,
            title: title.trim(),
          }))
          .filter((row) => row.title.length > 0),
      ),
    [rows],
  );

  function updateRow(id: string, patch: Partial<AssignmentRow>) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    );
  }

  function addRow() {
    setRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: "",
        responseMode: "IMAGE",
      },
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-2xl font-black">{t.bulkCreateTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {t.bulkCreateDescription}
      </p>
      {state.message ? (
        <p className="mt-3 rounded-2xl bg-muted px-4 py-3 text-sm font-bold">
          {state.message}
        </p>
      ) : null}

      <form action={formAction} className="mt-5 grid gap-3">
        <input name="items" type="hidden" value={items} />
        <select
          className="rounded-2xl border border-border bg-background px-4 py-3"
          name="groupId"
          required
        >
          <option value="">{t.chooseGroup}</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>

        <div className="grid gap-3">
          {rows.map((row, index) => (
            <div className="grid gap-2 rounded-2xl bg-muted p-3" key={row.id}>
              <input
                className="rounded-2xl border border-border bg-background px-4 py-3"
                onChange={(event) => updateRow(row.id, { title: event.target.value })}
                placeholder={`${index + 1}. ${t.titlePlaceholder}`}
                required
                value={row.title}
              />
              <div className="grid gap-2">
                <select
                  className="rounded-2xl border border-border bg-background px-4 py-3"
                  onChange={(event) =>
                    updateRow(row.id, {
                      responseMode: event.target.value as AssignmentRow["responseMode"],
                    })
                  }
                  value={row.responseMode}
                >
                  {responseModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {t.responseModes[mode]}
                    </option>
                  ))}
                </select>
              </div>
              {rows.length > 1 ? (
                <Button
                  onClick={() => removeRow(row.id)}
                  type="button"
                  variant="secondary"
                >
                  {t.removeAssignmentRow}
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <Button onClick={addRow} type="button" variant="secondary">
          {t.addAssignmentRow}
        </Button>
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
        <textarea
          className="min-h-24 rounded-2xl border border-border bg-background px-4 py-3"
          name="description"
          placeholder={t.descriptionPlaceholder}
        />
        <input
          className="rounded-2xl border border-border bg-background px-4 py-3"
          name="dueAt"
          type="datetime-local"
        />
        <textarea
          className="min-h-20 rounded-2xl border border-border bg-background px-4 py-3"
          name="rubric"
          placeholder={t.rubricPlaceholder}
        />
        <Button disabled={isPending || groups.length === 0} type="submit">
          {isPending ? t.creating : t.bulkCreate}
        </Button>
      </form>
    </section>
  );
}
