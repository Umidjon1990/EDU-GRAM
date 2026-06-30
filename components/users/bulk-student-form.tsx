"use client";

import { useActionState, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

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
  const [bulkText, setBulkText] = useState("");
  const preview = useMemo(() => parsePreview(bulkText), [bulkText]);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setBulkText(text);
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black">{t.bulkTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t.bulkDescription}</p>

      <div className="mt-4 rounded-2xl bg-muted p-4">
        <p className="text-xs font-black text-muted-foreground">Shablon</p>
        <pre className="mt-2 whitespace-pre-wrap text-sm font-semibold">
          {t.bulkTemplate}
        </pre>
        <pre className="mt-3 whitespace-pre-wrap border-t border-border pt-3 text-sm font-semibold">
          {t.bulkCsvTemplate}
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
        <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-dashed border-border bg-background px-4 py-4 text-sm font-black text-muted-foreground transition hover:bg-muted">
          {t.bulkFile}
          <input
            accept=".csv,text/csv,text/plain"
            className="sr-only"
            onChange={handleFile}
            type="file"
          />
        </label>
        <textarea
          className="min-h-52 rounded-2xl border border-border bg-background px-4 py-3 outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          name="bulkText"
          onChange={(event) => setBulkText(event.target.value)}
          placeholder={t.bulkPlaceholder}
          required
          value={bulkText}
        />
        <ImportPreview invalidRows={preview.invalidRows} validRows={preview.validRows} />
        <Button disabled={isPending} type="submit">
          {isPending ? userManagementDictionary.common.creating : t.bulkSubmit}
        </Button>
      </form>
    </section>
  );
}

type PreviewRow = {
  line: number;
  fullName: string;
  phone: string;
  username: string;
  password: string;
};

type InvalidRow = {
  line: number;
  value: string;
};

function ImportPreview({
  invalidRows,
  validRows,
}: {
  invalidRows: InvalidRow[];
  validRows: PreviewRow[];
}) {
  if (validRows.length === 0 && invalidRows.length === 0) {
    return (
      <p className="rounded-2xl bg-muted px-4 py-4 text-sm text-muted-foreground">
        {t.bulkNoPreview}
      </p>
    );
  }

  return (
    <div className="grid gap-3 rounded-2xl border border-border bg-background p-4">
      <div>
        <h3 className="font-black">{t.bulkPreview}</h3>
        <p className="mt-1 text-sm font-semibold text-success">
          {t.bulkValidRows.replace("{count}", String(validRows.length))}
        </p>
      </div>

      {validRows.length > 0 ? (
        <div className="max-h-52 overflow-auto rounded-2xl border border-border">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-bold">{t.bulkFullName}</th>
                <th className="px-3 py-2 font-bold">{t.bulkPhone}</th>
                <th className="px-3 py-2 font-bold">{t.bulkUsername}</th>
                <th className="px-3 py-2 font-bold">{t.bulkPassword}</th>
              </tr>
            </thead>
            <tbody>
              {validRows.map((row) => (
                <tr className="border-t border-border" key={`${row.line}-${row.username}`}>
                  <td className="px-3 py-2 font-semibold">{row.fullName}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.phone}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.username}</td>
                  <td className="px-3 py-2 text-muted-foreground">{row.password}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {invalidRows.length > 0 ? (
        <div className="rounded-2xl border border-danger/20 bg-danger/10 px-4 py-3">
          <p className="text-sm font-black text-danger">{t.bulkInvalidRows}</p>
          <ul className="mt-2 grid gap-1 text-sm text-danger">
            {invalidRows.map((row) => (
              <li key={`${row.line}-${row.value}`}>
                {row.line}-qator: {row.value}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function parsePreview(text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const validRows: PreviewRow[] = [];
  const invalidRows: InvalidRow[] = [];

  if (lines.length === 0) {
    return { validRows, invalidRows };
  }

  if (lines.some((line) => /[,;\t]/.test(line))) {
    for (const [index, line] of lines.entries()) {
      const [fullName, phone] = splitImportLine(line);
      addPreviewRow({
        fullName,
        invalidRows,
        line: index + 1,
        phone,
        raw: line,
        validRows,
      });
    }
  } else {
    for (let index = 0; index < lines.length; index += 2) {
      addPreviewRow({
        fullName: lines[index],
        invalidRows,
        line: index + 1,
        phone: lines[index + 1],
        raw: `${lines[index] ?? ""} ${lines[index + 1] ?? ""}`.trim(),
        validRows,
      });
    }
  }

  return { validRows, invalidRows };
}

function addPreviewRow({
  fullName,
  invalidRows,
  line,
  phone,
  raw,
  validRows,
}: {
  fullName?: string;
  invalidRows: InvalidRow[];
  line: number;
  phone?: string;
  raw: string;
  validRows: PreviewRow[];
}) {
  const password = getPhonePassword(phone ?? "");
  const username = normalizeUsername(fullName?.split(/\s+/).at(-1) ?? "");

  if (!fullName || !phone || password.length !== 9 || username.length < 3) {
    invalidRows.push({ line, value: raw });
    return;
  }

  validRows.push({ line, fullName, phone, username, password });
}

function getPhonePassword(value: string) {
  return value.replace(/\D/g, "").slice(-9);
}

function splitImportLine(line: string) {
  return line
    .split(/\t|,|;/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeUsername(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 48);
}
