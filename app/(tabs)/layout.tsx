import { BottomNav } from "@/components/BottomNav";
import { getViewer } from "@/lib/server/data";

export default async function TabsLayout({ children }: LayoutProps<"/">) {
  const viewer = await getViewer();
  return (
    <>
      <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 pb-32">{children}</main>
      {viewer && <BottomNav />}
    </>
  );
}
