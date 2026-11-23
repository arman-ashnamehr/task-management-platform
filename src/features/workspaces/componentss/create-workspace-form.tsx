"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createWorkspaceAction } from "@/features/workspaces/actions/create-workspace";
import type { CreateWorkspaceResult } from "@/features/workspaces/actions/create-workspace";

const initialState = {
  success: false as const,
  message: "",
};

export function CreateWorkspaceForm() {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _previousState: CreateWorkspaceResult,
      formData: FormData,
    ): Promise<CreateWorkspaceResult> => {
      return createWorkspaceAction(formData);
    },
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      //the dashboard data was originally fetched on the server, so the current rendered page may still show the previous result.
      //  router.refresh() requests a fresh server-rendered result for the current route.
      //  This lets the dashboard retrieve the newly created workspace without navigating away.
      router.refresh();
    }
  }, [state, router]);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="workspace-name"
          className="block text-sm font-medium text-slate-200"
        >
          Workspace name
        </label>

        <input
          id="workspace-name"
          name="name"
          type="text"
          placeholder="e.g. Acme Studio"
          maxLength={50}
          required
          disabled={isPending}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        />

        {state.success === false && state.fieldErrors?.name && (
          <ul className="space-y-1 text-sm text-red-400">
            {state.fieldErrors.name.map((error, index) => (
              <li key={`${error}-${index}`}>{error}</li>
            ))}
          </ul>
        )}
      </div>

      {state.success === false && state.message && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-emerald-400">
          Workspace &quot;{state.workspace.name}&quot; created successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating workspace..." : "Create workspace"}
      </button>
    </form>
  );
}
