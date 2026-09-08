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
        <main className="min-w-0 flex-1 p-0 md:p-2 md:pl-0">
          <div className="min-h-screen overflow-hidden bg-paper md:min-h-[calc(100vh-16px)] md:rounded-panel md:border md:border-ink/[0.07]">
            {children}
          </div>
        </main>
      </div>
    </ShellIdentityProvider>
  );
}
