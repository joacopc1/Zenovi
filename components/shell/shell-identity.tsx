"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CreditBalance } from "@/lib/credits/pricing";
import type { InstagramAccountIdentity } from "@/lib/meta/connection-state";
import type { AppNotification } from "@/lib/notifications/model";

export type ShellIdentity = {
  accountAvatarUrl: string | null;
  displayName: string;
  initials: string;
  workspaceName: string;
  instagram: InstagramAccountIdentity | null;
  credits: CreditBalance;
  notifications: AppNotification[];
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
