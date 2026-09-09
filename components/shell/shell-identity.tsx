"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { InstagramConnectionStatus } from "@/lib/meta/connection-state";

export type ShellIdentity = {
  displayName: string;
  initials: string;
  workspaceName: string;
  instagram: {
    status: InstagramConnectionStatus;
    username: string | null;
  } | null;
};

const ShellIdentityContext = createContext<ShellIdentity | null>(null);

export function ShellIdentityProvider({
  identity,
  children,
}: {
  identity: ShellIdentity;
  children: ReactNode;
}) {
  return (
    <ShellIdentityContext value={identity}>
      {children}
    </ShellIdentityContext>
  );
}

export function useShellIdentity() {
  const identity = useContext(ShellIdentityContext);

  if (!identity) {
    throw new Error("ShellIdentityProvider is missing.");
  }

  return identity;
}
