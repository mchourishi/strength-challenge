import { SkeletonScreen } from "@/components/Skeleton";

export default function Loading() {
  return (
    <main className="safe-top mx-auto w-full max-w-md px-4">
      <SkeletonScreen blocks={[16, 24, 36, 36, 36]} />
    </main>
  );
}
