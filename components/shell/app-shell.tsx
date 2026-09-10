import { Sidebar } from "./sidebar";
import { ShellIdentityProvider, type ShellIdentity } from "./shell-identity";

export function AppShell({
  children,
  identity,
}: {
  children: React.ReactNode;
  identity: ShellIdentity;
}) {
  return (
    <ShellIdentityProvider identity={identity}>
      <div className="flex min-h-screen bg-canvas">
        <Sidebar />
        <main className="min-h-screen min-w-0 flex-1 bg-paper">
          {children}
        </main>
      </div>
    </ShellIdentityProvider>
  );
}
