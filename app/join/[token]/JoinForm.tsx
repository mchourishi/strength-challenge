"use client";

import { useActionState } from "react";
import { joinChallengeAction, type ActionResult } from "@/app/actions";
import { primaryButton } from "@/components/ui";

export function JoinForm({ inviteToken }: { inviteToken: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    async (_previous, formData) => joinChallengeAction(inviteToken, String(formData.get("name") ?? "")),
    null,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label htmlFor="name" className="text-sm font-bold">
        Your first name
      </label>
      <input
        id="name"
        name="name"
        required
        maxLength={40}
        autoComplete="given-name"
        autoCapitalize="words"
        className="min-h-14 rounded-2xl bg-card-2 px-4 text-lg font-semibold outline-none ring-brand focus:ring-2"
        placeholder="e.g. Sam"
      />
      {state && !state.ok && (
        <p role="alert" className="text-sm font-semibold text-brand">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={primaryButton}>
        {pending ? "Joining…" : "JOIN THE CHALLENGE 💪"}
      </button>
    </form>
  );
}
