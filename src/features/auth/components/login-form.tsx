"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

import { loginSchema, type LoginFormValues } from "@/lib/validation/auth";

import { PasswordInput } from "./password-input";

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(initialValues);

  const [errors, setErrors] = useState<LoginFormErrors>({});

  const [statusMessage, setStatusMessage] = useState("");

  function updateField<K extends keyof LoginFormValues>(
    field: K,
    value: LoginFormValues[K],
  ) {
    setValues((previousValues) => ({
      ...previousValues,
      [field]: value,
    }));

    setErrors((previousErrors) => ({
      ...previousErrors,
      [field]: undefined,
    }));

    setStatusMessage("");
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: LoginFormErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (field === "email" || field === "password") {
          nextErrors[field] ??= issue.message;
        }
      }

      setErrors(nextErrors);
      setStatusMessage("");
      return;
    }

    setErrors({});

    setStatusMessage(
      "Your input is valid. Authentication is not connected yet.",
    );

    // result.data contains validated and normalized values.
    // We will send it to the server when authentication is implemented.
  }

  return (
    <Card>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Welcome back</h1>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id="email" label="Email address" error={errors.email}>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) =>
              updateField("email", event.currentTarget.value)
            }
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="you@example.com"
          />
        </FormField>

        <FormField id="password" label="Password" error={errors.password}>
          <PasswordInput
            id="password"
            name="password"
            value={values.password}
            onChange={(event) =>
              updateField("password", event.currentTarget.value)
            }
            autoComplete="current-password"
            placeholder="Enter your password"
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? "password-error" : undefined}
          />
        </FormField>

        {statusMessage && (
          <p
            role="status"
            className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-sm text-emerald-300"
          >
            {statusMessage}
          </p>
        )}

        <Button type="submit" className="w-full">
          Sign in
        </Button>
      </form>
    </Card>
  );
}
