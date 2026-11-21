"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

import { signIn } from "@/lib/auth/auth-client";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";

import { PasswordInput } from "./password-input";

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

export function LoginForm() {
  const [errorMessage, setErrorMessage] = useState("");
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

  async function onSubmit(data: LoginFormValues) {
    setErrorMessage("");

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
        callbackURL: "/dashboard",
      });

      if (result.error) {
        setErrorMessage("Invalid email or password. Please try again.");
        return;
      }
    } catch {
      setErrorMessage("Something went wrong. Please try again later.");
    }
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

        {errorMessage && (
          <p
            role="alert"
            className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300"
          >
            {errorMessage}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {/* We don't need another useState for loading. RHF already provides isSubmitting, which is exactly what we need. */}
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
