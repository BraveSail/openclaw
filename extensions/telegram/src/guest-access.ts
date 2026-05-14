import { isSenderAllowed, normalizeAllowFrom } from "./bot-access.js";

export type GuestMessageAuthorizationDecision =
  | { allowed: true }
  | { allowed: false; reason: "allowfrom-empty" | "sender-not-allowed" };

/**
 * Bot API 10.0 Guest Mode authorization gate.
 *
 * When the bot is summoned via `@mention` in a chat where it is not a member,
 * Telegram delivers `Update.guest_message`. Group-membership allowlist gates
 * (`channels.telegram.groups.<id>.allowFrom`, `groupPolicy=allowlist`) do not
 * apply: the whole point of Guest Mode is that the bot is not part of the
 * group, so requiring per-group allowlist entries would defeat the feature.
 *
 * Authorization is still enforced at the sender level via the account-level
 * `channels.telegram.allowFrom` list (numeric Telegram user IDs or `*`).
 */
export function evaluateTelegramGuestMessageAuthorization(params: {
  allowFrom: ReadonlyArray<string | number> | undefined;
  senderId: string;
  senderUsername: string;
}): GuestMessageAuthorizationDecision {
  const normalized = normalizeAllowFrom(params.allowFrom ? [...params.allowFrom] : undefined);
  if (!normalized.hasEntries) {
    return { allowed: false, reason: "allowfrom-empty" };
  }
  if (
    !isSenderAllowed({
      allow: normalized,
      senderId: params.senderId || undefined,
      senderUsername: params.senderUsername || undefined,
    })
  ) {
    return { allowed: false, reason: "sender-not-allowed" };
  }
  return { allowed: true };
}
