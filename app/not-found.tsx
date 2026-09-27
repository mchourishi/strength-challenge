import Link from "next/link";
import { EmptyState, primaryButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6">
      <EmptyState emoji="🧭" title="We couldn't find that">
        It may belong to a different challenge.
        <Link href="/" className={`${primaryButton} mt-6`}>
          GO HOME
        </Link>
      </EmptyState>
    </main>
  );
}
