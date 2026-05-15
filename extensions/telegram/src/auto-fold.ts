/**
 * Shared helpers for the Telegram auto-fold feature.
 *
 * Outbound text from group / channel / Guest Mode chats that exceeds
 * `TELEGRAM_AUTO_EXPANDABLE_THRESHOLD` characters is wrapped in
 * `<blockquote expandable>` so Telegram clients render it collapsed by
 * default. DMs are left alone, and any text that already contains a
 * top-level blockquote (expandable or not) is left alone too.
 */

export const TELEGRAM_AUTO_EXPANDABLE_THRESHOLD = 100;

export function shouldAutoFoldTelegramText(params: {
  text: string;
  textMode?: "markdown" | "html";
  chatType?: "direct" | "group" | "unknown";
}): boolean {
  if (params.chatType === "direct") {
    return false;
  }
  if (params.text.length <= TELEGRAM_AUTO_EXPANDABLE_THRESHOLD) {
    return false;
  }
  if (params.textMode === "html" && /<blockquote(?:\s+expandable)?\b/i.test(params.text)) {
    return false;
  }
  return true;
}

export function wrapTelegramExpandableBlockquote(htmlText: string): string {
  return `<blockquote expandable>${htmlText}</blockquote>`;
}

/** True when the HTML text already contains a top-level blockquote tag. */
export function htmlAlreadyContainsBlockquote(htmlText: string): boolean {
  return /<blockquote(?:\s+expandable)?\b/i.test(htmlText);
}
