"use client";

import Link from "next/link";
import { primaryButton, secondaryButton } from "@/components/ui";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="text-5xl" aria-hidden>
        😵‍💫
      </div>
      <h1 className="text-2xl font-black">Something went wrong</h1>
      <p className="text-muted">
        {process.env.NODE_ENV === "development" ? error.message : "Check your connection and try again."}
      </p>
      <button type="button" onClick={reset} className={primaryButton}>
        TRY AGAIN
      </button>
      <Link href="/" className={secondaryButton}>
        Go home
      </Link>
    </main>
  );
}
