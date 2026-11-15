"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth";

import { PasswordInput } from "./password-input";

type RegisterFormErrors = Partial<Record<keyof RegisterFormValues, string>>;

const initialValues: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>(initialValues);

  const [errors, setErrors] = useState<RegisterFormErrors>({});

  const [statusMessage, setStatusMessage] = useState("");

  function updateField<K extends keyof RegisterFormValues>(
    field: K,
    value: RegisterFormValues[K],
  ) {
    setValues((previousValues) => ({
      ...previousValues,
      [field]: value,
    }));
    setErrors((previousErrors) => {
      const nextErrors = {
        ...previousErrors,
        [field]: undefined,
      };

      if (field === "password") {
        nextErrors.confirmPassword = undefined;
      }

      return nextErrors;
    });

    setStatusMessage("");
  }

  function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = registerSchema.safeParse(values);

    if (!result.success) {
      const nextErrors: RegisterFormErrors = {};

      for (const issue of result.error.issues) {
        const field = issue.path[0];

        if (
          field === "name" ||
          field === "email" ||
          field === "password" ||
          field === "confirmPassword"
        ) {
          nextErrors[field] ??= issue.message;
        }
      }

      setErrors(nextErrors);
      setStatusMessage("");
      return;
    }

    setErrors({});

    setStatusMessage(
      "Your information is valid. Account creation is not connected yet.",
    );

    // result.data contains validated and normalized values.
    // We will send it to the server when authentication is implemented.
  }

  return (
    <Card>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Create your account</h1>

        <p className="mt-2 text-sm text-slate-400">
          Get started by creating your TaskFlow account.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <FormField id="name" label="Full name" error={errors.name}>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateField("name", event.currentTarget.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            placeholder="Your full name"
          />
        </FormField>

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

        <FormField
          id="password"
          label="Password"
          error={errors.password}
          hint="Use at least 8 characters."
        >
          <PasswordInput
            id="password"
            name="password"
            value={values.password}
            onChange={(event) =>
              updateField("password", event.currentTarget.value)
            }
            autoComplete="new-password"
            placeholder="Create a password"
            invalid={Boolean(errors.password)}
            describedBy={errors.password ? "password-error" : "password-hint"}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword}
        >
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            value={values.confirmPassword}
            onChange={(event) =>
              updateField("confirmPassword", event.currentTarget.value)
            }
            autoComplete="new-password"
            placeholder="Enter your password again"
            invalid={Boolean(errors.confirmPassword)}
            describedBy={
              errors.confirmPassword ? "confirmPassword-error" : undefined
            }
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
          Create account
        </Button>
      </form>
    </Card>
  );
}
