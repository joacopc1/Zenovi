import { redirect } from "next/navigation";
import { getAccountContext } from "@/lib/data/account-context";
import { getContentItems } from "@/lib/data/production";
import { getProductionLinks } from "@/lib/data/production-links";
import { getRecentPublications } from "@/lib/data/posting-rhythm";
import { AppHeader } from "@/components/shell/app-header";
import { ProductionView } from "@/components/production/production-view";

export default async function ProductionPage() {
  const account = await getAccountContext();

  if (!account) redirect("/login");
  if (!account.workspace) redirect("/onboarding/workspace");

  // Las piezas y el historial de publicaciones no dependen entre sí: en serie eran dos
  // viajes seguidos a una base que está a unos 150 ms.
  const [items, published] = await Promise.all([
    getContentItems(account.workspace.id),
    getRecentPublications(account.workspace.id),
  ]);
  const links = await getProductionLinks(account.workspace.id, items);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">Producción</h1>

        <ProductionView items={items} links={links} published={published} />
      </main>
    </>
  );
}
