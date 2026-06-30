"use client";

import { Button } from "@/components/ui/button";
import { submitTestAction } from "@/features/tests/actions";
import { testDictionary } from "@/i18n/locales/uz-Latn-UZ";

type Question = {
  id: string;
  prompt: string;
  options: unknown;
  type?: "MULTIPLE_CHOICE" | "TRUE_FALSE" | "WRITTEN";
};

const t = testDictionary;

function getOptions(options: unknown) {
  if (!options || typeof options !== "object") return {};
  return options as Record<string, string>;
}

export function TestAttemptForm({ testId, questions }: { testId: string; questions: Question[] }) {
  return (
    <form action={submitTestAction} className="mt-4 grid gap-4">
      <input name="testId" type="hidden" value={testId} />
      {questions.map((question, index) => {
        const options = getOptions(question.options);
        return (
          <fieldset className="rounded-2xl bg-muted p-4" key={question.id}>
            <legend className="font-bold">
              {index + 1}. {question.prompt}
            </legend>
            {question.type === "WRITTEN" ? (
              <textarea
                className="mt-3 min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                name={`answer:${question.id}`}
                required
              />
            ) : (
              <div className="mt-3 grid gap-2">
                {Object.entries(options).map(([key, value]) => (
                  <label className="flex items-center gap-3 rounded-xl bg-background px-3 py-2 text-sm" key={key}>
                    <input name={`answer:${question.id}`} required type="radio" value={key} />
                    <span>
                      <b>{key}.</b> {value}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        );
      })}
      <Button type="submit">{t.submit}</Button>
    </form>
  );
}
