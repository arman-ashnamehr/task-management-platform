"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";

import {
  registerSchema,
  type RegisterFormValues,
} from "@/lib/validations/auth";

import { PasswordInput } from "./password-input";

const initialValues: RegisterFormValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export function RegisterForm() {
  const [statusMessage, setStatusMessage] = useState("");

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  });

  function onSubmit(data: RegisterFormValues) {
    setStatusMessage(
      "Your information is valid. Account creation is not connected yet.",
    );

    // Validated data will be sent to the server
    // when we implement authentication.
    console.log(data);
  }
  /**Controller is intended for components that need an explicit controlled interface,
   * such as our custom PasswordInput, date pickers, and many third-party UI library components. */
  return (
    <Card>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">Create your account</h1>

        <p className="mt-2 text-sm text-slate-400">
          Get started by creating your TaskFlow account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormField id="name" label="Full name" error={errors.name?.message}>
          <input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            {...register("name")}
          />
        </FormField>

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
          hint="Use at least 8 characters."
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
                autoComplete="new-password"
                placeholder="Create a password"
                invalid={Boolean(errors.password)}
                describedBy={
                  errors.password ? "password-error" : "password-hint"
                }
              />
            )}
          />
        </FormField>

        <FormField
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <PasswordInput
                id="confirmPassword"
                name={field.name}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                inputRef={field.ref}
                autoComplete="new-password"
                placeholder="Enter your password again"
                invalid={Boolean(errors.confirmPassword)}
                describedBy={
                  errors.confirmPassword ? "confirmPassword-error" : undefined
                }
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
          Create account
        </Button>
      </form>
    </Card>
  );
}
