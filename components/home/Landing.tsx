import Link from "next/link";
import { Card, Eyebrow, primaryButton } from "@/components/ui";

const STEPS = [
  { emoji: "🎯", title: "Choose your goals", text: "Goal, experience, time and equipment." },
  { emoji: "✨", title: "Get a 4–6 week program", text: "Built for you both. Review it, then start." },
  { emoji: "🤝", title: "Invite your friend", text: "Train on your own schedule, cheer each other on." },
];

export function Landing({ notice }: { notice?: string }) {
  return (
    <div className="flex flex-1 flex-col gap-6 pt-6">
      <div className="animate-rise-in">
        <Eyebrow>Stronger Together 💪</Eyebrow>
        <h1 className="mt-3 text-4xl font-black leading-[1.05] tracking-tight">
          Get strong with <span className="text-brand-gradient">your friend.</span>
        </h1>
        <p className="mt-3 text-lg text-muted">A private strength challenge for two. Tick off workouts, keep each other going.</p>
      </div>

      {notice && (
        <p role="status" className="rounded-2xl bg-card-2 px-4 py-3 text-sm font-semibold">
          {notice}
        </p>
      )}

      <Card className="flex flex-col gap-4">
        {STEPS.map((step) => (
          <div key={step.title} className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-card-2 text-xl" aria-hidden>
              {step.emoji}
            </div>
            <div>
              <p className="font-bold">{step.title}</p>
              <p className="text-sm text-muted">{step.text}</p>
            </div>
          </div>
        ))}
      </Card>

      <div className="mt-auto flex flex-col gap-3">
        <Link href="/create" className={primaryButton}>
          CREATE A CHALLENGE
        </Link>
        <p className="text-center text-sm text-muted">Got an invite? Just open the link your friend sent you.</p>
      </div>
    </div>
  );
}
