import { getViewer } from "@/lib/server/data";
import { CreateWizard } from "./CreateWizard";

export const metadata = { title: "Create a challenge · Stronger Together" };

export default async function CreatePage() {
  const viewer = await getViewer();
  return (
    <main className="safe-top mx-auto flex min-h-dvh w-full max-w-md flex-col px-4">
      <CreateWizard switchingChallenge={viewer !== null} />
    </main>
  );
}
