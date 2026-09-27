"use client";

import { useState } from "react";
import { cx, primaryButton, secondaryButton } from "./ui";

interface ShareLinkProps {
  url: string;
  label: string;
  shareTitle: string;
  shareText: string;
  variant?: "primary" | "secondary";
}

/** Uses the native share sheet on phones, falling back to copying the link. */
export function ShareLink({ url, label, shareTitle, shareText, variant = "primary" }: ShareLinkProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: shareTitle, text: shareText, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("copied");
      setTimeout(() => setStatus("idle"), 2500);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button type="button" onClick={share} className={cx(variant === "primary" ? primaryButton : secondaryButton)}>
        {status === "copied" ? "Copied! ✓" : label}
      </button>
      <p
        className={cx("select-all break-all rounded-xl bg-card-2 px-3 py-2 text-center text-xs text-muted", status === "error" && "ring-2 ring-brand")}
      >
        {url}
      </p>
      <p aria-live="polite" className="sr-only">
        {status === "copied" ? "Link copied" : ""}
      </p>
      {status === "error" && <p className="text-center text-xs text-muted">Couldn&apos;t copy automatically — press and hold the link to copy it.</p>}
    </div>
  );
}
