"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { createProjectAction } from "@/features/projects/actions/create-project";
import type { CreateProjectResult } from "@/features/projects/actions/create-project";

type CreateProjectFormProps = {
  workspaceId: string;
};

const initialState: CreateProjectResult = {
  success: false,
  message: "",
};

export function CreateProjectForm({ workspaceId }: CreateProjectFormProps) {
  const router = useRouter();

  const [state, formAction, isPending] = useActionState(
    async (
      _previousState: CreateProjectResult,
      formData: FormData,
    ): Promise<CreateProjectResult> => {
      return createProjectAction(formData, workspaceId);
    },
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/50 p-6"
    >
      <div>
        <h3 className="font-semibold text-white">Create a project</h3>
        <p className="mt-1 text-sm text-slate-400">
          Organize your workspace activities into projects.
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="project-name"
          className="block text-sm font-medium text-slate-300"
        >
          Project name
        </label>

        <input
          id="project-name"
          name="name"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="e.g. Website Redesign"
          disabled={isPending}
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        />

        {state.success === false &&
          state.fieldErrors?.name?.map((error, index) => (
            <p key={index} className="text-sm text-red-400">
              {error}
            </p>
          ))}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="project-description"
          className="block text-sm font-medium text-slate-300"
        >
          Description
          <span className="ml-1 font-normal text-slate-500">(optional)</span>
        </label>

        <textarea
          id="project-description"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="What is this project about?"
          disabled={isPending}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
        />

        {state.success === false &&
          state.fieldErrors?.description?.map((error, index) => (
            <p key={index} className="text-sm text-red-400">
              {error}
            </p>
          ))}
      </div>

      {!state.success && state.message && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-emerald-400">
          Project created successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Creating..." : "Create project"}
      </button>
    </form>
  );
}
