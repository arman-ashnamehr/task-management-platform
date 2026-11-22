"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { signOut } from "@/lib/auth/auth-client";

type UserMenuProps = {
  user: {
    name: string;
    email: string;
  };
};

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const initials = user.name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    setIsSigningOut(true);
    setErrorMessage("");

    try {
      const result = await signOut();

      if (result.error) {
        setErrorMessage("Unable to sign out. Please try again.");
        setIsSigningOut(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setIsSigningOut(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="flex size-9 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white"
        aria-label={`${user.name}'s avatar`}
      >
        {initials || "U"}
      </div>

      <div className="hidden min-w-0 sm:block">
        <p className="max-w-40 truncate text-sm font-medium text-white">
          {user.name}
        </p>
        <p className="max-w-40 truncate text-xs text-slate-400">{user.email}</p>
      </div>

      <button
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSigningOut ? "Signing out..." : "Sign out"}
      </button>

      {errorMessage && (
        <p role="alert" className="sr-only">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
