import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getAccountContext } from "@/lib/data/account-context";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const account = await getAccountContext();

  if (!account) {
    redirect("/login");
  }

  if (!account.workspace) {
    redirect("/onboarding/workspace");
  }

  return (
    <AppShell
      identity={{
        displayName: account.displayName,
        initials: account.initials,
        workspaceName: account.workspace.name,
      }}
    >
      {children}
    </AppShell>
  );
}
