"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

import { PasswordInput } from "./password-input";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const [statusMessage, setStatusMessage] = useState("");
  /**
 *register: connects native fields.
  control: provides the control object required by Controller.
  handleSubmit: coordinates validation and submission.
  errors: contains validation errors.
  isSubmitting: indicates whether an asynchronous submission is in progress.
 */
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });

  function onSubmit(data: LoginFormValues) {
    setStatusMessage(
      "Your input is valid. Authentication is not connected yet.",
    );

    // Validated data will be sent to the server
    // when we implement authentication.
    console.log(data);
  }

  return (
    <Card>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Welcome back</h1>

        <p className="mt-2 text-sm text-slate-400">
          Sign in to continue to your workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField
          id="email"
          label="Email address"
          error={errors.email?.message}
        >
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            {...register("email")}
          />
        </FormField>

        <FormField
          id="password"
          label="Password"
          error={errors.password?.message}
        >
          {/* Controller connects a custom controlled component to RHF. because PasswordInput is a custom component. */}
          <Controller
            name="password"
            control={control}
            render={({ field }) => (
              <PasswordInput
                id="password"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                autoComplete="current-password"
                placeholder="Enter your password"
                invalid={Boolean(errors.password)}
                describedBy={errors.password ? "password-error" : undefined}
              />
            )}
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Sign in
        </Button>
      </form>
    </Card>
  );
}
