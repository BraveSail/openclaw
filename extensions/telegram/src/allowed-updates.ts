import { API_CONSTANTS } from "grammy";

// Telegram Bot API 10.0 added guest_message before the bundled grammY
// constants/types know about it. Keep the local union explicit so polling and
// webhooks can opt in without waiting for a dependency release.
export type TelegramUpdateType = (typeof API_CONSTANTS.ALL_UPDATE_TYPES)[number] | "guest_message";

export const DEFAULT_TELEGRAM_UPDATE_TYPES: ReadonlyArray<TelegramUpdateType> =
  API_CONSTANTS.DEFAULT_UPDATE_TYPES;

export function resolveTelegramAllowedUpdates(): ReadonlyArray<TelegramUpdateType> {
  const updates = [...DEFAULT_TELEGRAM_UPDATE_TYPES] as TelegramUpdateType[];
  if (!updates.includes("message_reaction")) {
    updates.push("message_reaction");
  }
  if (!updates.includes("channel_post")) {
    updates.push("channel_post");
  }
  if (!updates.includes("guest_message")) {
    updates.push("guest_message");
  }
  return updates;
}
