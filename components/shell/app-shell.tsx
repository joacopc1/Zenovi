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
      {/* Un solo scroll: el de la página. La barra lateral se queda quieta porque es
          sticky, no porque el contenido tenga su propio contenedor con scroll —eso
          producía dos barras a la derecha. */}
      <div className="flex min-h-dvh bg-paper">
        <Sidebar />
        <main className="min-w-0 flex-1 bg-paper">
          {children}
        </main>
      </div>
    </ShellIdentityProvider>
  );
}
