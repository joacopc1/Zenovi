import { getAccountContext } from "@/lib/data/account-context";
import { getBrandDna } from "@/lib/data/brand-dna";
import { BrandDnaForm } from "@/components/brand/brand-dna-form";
import { AppHeader } from "@/components/shell/app-header";

export default async function BrandPage() {
  const account = await getAccountContext();

  if (!account?.workspace) {
    return null;
  }

  const dna = await getBrandDna(account.workspace.id);

  return (
    <>
      <AppHeader />
      <main className="mx-auto w-full max-w-[1240px] px-5 py-6 md:px-8 md:py-8 lg:px-10">
        <h1 className="text-xl font-semibold tracking-[-0.02em]">ADN de marca</h1>

        <BrandDnaForm initial={dna} />
      </main>
    </>
  );
}
