"use client";

import { useActionState } from "react";
import type { ComponentType, SVGProps } from "react";
import { KeyRound, UserRound } from "lucide-react";

import type { ManagedUserState } from "@/features/users/actions";
import { Button } from "@/components/ui/button";
import { userManagementDictionary } from "@/i18n/locales/uz-Latn-UZ";

type ManagedUserFormProps = {
  action: (
    state: ManagedUserState,
    formData: FormData,
  ) => Promise<ManagedUserState>;
  submitLabel: string;
  title: string;
};

const initialState: ManagedUserState = {
  status: "idle",
};

const t = userManagementDictionary.common;

export function ManagedUserForm({
  action,
  submitLabel,
  title,
}: ManagedUserFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <h2 className="text-2xl font-black">{title}</h2>

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
        <Field
          autoComplete="name"
          icon={UserRound}
          label={t.fullName}
          name="fullName"
          placeholder={t.fullNamePlaceholder}
          type="text"
        />
        <Field
          autoComplete="username"
          icon={UserRound}
          label={t.username}
          name="username"
          placeholder={t.usernamePlaceholder}
          type="text"
        />
        <Field
          autoComplete="new-password"
          icon={KeyRound}
          label={t.password}
          name="password"
          placeholder={t.passwordPlaceholder}
          type="password"
        />
        <Button disabled={isPending} type="submit">
          {isPending ? t.creating : submitLabel}
        </Button>
      </form>
    </section>
  );
}

function Field({
  autoComplete,
  icon: Icon,
  label,
  name,
  placeholder,
  type,
}: {
  autoComplete: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  name: string;
  placeholder: string;
  type: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-bold">{label}</span>
      <span className="flex items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Icon aria-hidden className="size-5 text-muted-foreground" />
        <input
          autoComplete={autoComplete}
          className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
          name={name}
          placeholder={placeholder}
          required
          type={type}
        />
      </span>
    </label>
  );
}
