import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/data/account-context";
import { getContentItems } from "@/lib/data/production";
import { getProductionLinks } from "@/lib/data/production-links";
import { AppHeader } from "@/components/shell/app-header";
import { ProductionView } from "@/components/production/production-view";

export default async function ProductionPage() {
  const account = await getAccountContext();

  if (!account) redirect("/login");
  if (!account.workspace) redirect("/onboarding/workspace");

  const items = await getContentItems(account.workspace.id);
  const links = await getProductionLinks(account.workspace.id, items);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Producción</h1>

        <ProductionView items={items} links={links} />
      </main>
    </>
  );
}
