export function SkeletonScreen({ blocks = [24, 28, 64, 40] }: { blocks?: number[] }) {
  return (
    <div className="flex flex-col gap-4 pt-4" aria-busy="true" aria-label="Loading">
      {blocks.map((h, i) => (
        <div key={i} className="animate-pulse rounded-3xl bg-card-2" style={{ height: `${h * 4}px` }} />
      ))}
    </div>
  );
}
