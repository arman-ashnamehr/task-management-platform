"use client";

import { useState } from "react";
import type { ChangeEventHandler } from "react";

type PasswordInputProps = {
  id: string;
  name: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  autoComplete: "new-password" | "current-password";
  placeholder: string;
  invalid?: boolean;
  describedBy?: string;
};

export function PasswordInput({
  id,
  name,
  value,
  onChange,
  autoComplete,
  placeholder,
  invalid = false,
  describedBy,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 pr-20 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
        placeholder={placeholder}
      />

      <button
        type="button"
        onClick={() => setIsVisible((previous) => !previous)}
        className="absolute inset-y-0 right-3 text-xs font-medium text-slate-400 transition hover:text-white"
        aria-label={isVisible ? "Hide password" : "Show password"}
      >
        {isVisible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
