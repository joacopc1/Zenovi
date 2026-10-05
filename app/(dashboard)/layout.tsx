import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getAccountContext } from "@/lib/data/account-context";
import { getCreditBalance } from "@/lib/data/credit-balance";
import { getNotifications } from "@/lib/notifications/data";

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

  const [credits, notifications] = await Promise.all([
    getCreditBalance(account.workspace.id),
    getNotifications(account.userId),
  ]);

  return (
    <AppShell
      identity={{
        accountAvatarUrl: account.avatarUrl,
        displayName: account.displayName,
        initials: account.initials,
        workspaceName: account.workspace.name,
        instagram: account.instagram,
        credits,
        notifications,
      }}
    >
      {children}
    </AppShell>
  );
}
