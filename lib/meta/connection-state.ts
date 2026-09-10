export const INSTAGRAM_CONNECTION_STATUSES = [
  "oauth_started",
  "meta_authorized",
  "callback_validated",
  "token_verified",
  "account_resolved",
  "initial_sync_queued",
  "syncing",
  "connected",
  "action_required",
  "failed",
] as const;

export type InstagramConnectionStatus = (typeof INSTAGRAM_CONNECTION_STATUSES)[number];

export type InstagramAccountIdentity = {
  status: InstagramConnectionStatus;
  username: string | null;
  profilePictureUrl: string | null;
};

export type InstagramConnectionState = "not_connected" | InstagramConnectionStatus;

const allowedTransitions: Record<InstagramConnectionState, readonly InstagramConnectionStatus[]> = {
  not_connected: ["oauth_started"],
  oauth_started: ["meta_authorized", "action_required", "failed"],
  meta_authorized: ["callback_validated", "action_required", "failed"],
  callback_validated: ["token_verified", "action_required", "failed"],
  token_verified: ["account_resolved", "action_required", "failed"],
  account_resolved: ["initial_sync_queued", "action_required", "failed"],
  initial_sync_queued: ["syncing", "action_required", "failed"],
  syncing: ["connected", "action_required", "failed"],
  connected: ["oauth_started", "syncing", "action_required", "failed"],
  action_required: ["oauth_started", "syncing", "failed"],
  failed: ["oauth_started"],
};

export function isInstagramConnectionStatus(value: unknown): value is InstagramConnectionStatus {
  return (
    typeof value === "string" &&
    (INSTAGRAM_CONNECTION_STATUSES as readonly string[]).includes(value)
  );
}

export function canTransitionInstagramConnection(
  from: InstagramConnectionState,
  to: InstagramConnectionStatus,
) {
  return allowedTransitions[from].includes(to);
}

export function assertInstagramConnectionTransition(
  from: InstagramConnectionState,
  to: InstagramConnectionStatus,
) {
  if (!canTransitionInstagramConnection(from, to)) {
    throw new Error(`Invalid Instagram connection transition: ${from} -> ${to}`);
  }
}
