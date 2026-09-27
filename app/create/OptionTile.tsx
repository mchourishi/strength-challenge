import { cx } from "@/components/ui";
import type { ChoiceOption } from "./wizard-steps";

export function OptionTile<V>({
  option,
  selected,
  onSelect,
}: {
  option: ChoiceOption<V>;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "flex min-h-16 w-full items-center gap-4 rounded-3xl bg-card px-4 py-3 text-left ring-1 transition active:scale-[0.98]",
        selected ? "ring-2 ring-brand shadow-lg shadow-brand/10" : "ring-line",
      )}
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-card-2 text-2xl" aria-hidden>
        {option.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-lg font-extrabold">{option.label}</span>
          {option.badge && (
            <span className="rounded-full bg-brand/12 px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wider text-brand">
              {option.badge}
            </span>
          )}
        </span>
        {option.description && <span className="mt-0.5 block text-sm leading-snug text-muted">{option.description}</span>}
      </span>
      <span
        aria-hidden
        className={cx(
          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-black",
          selected ? "bg-brand text-white" : "ring-2 ring-line",
        )}
      >
        {selected ? "✓" : ""}
      </span>
    </button>
  );
}
