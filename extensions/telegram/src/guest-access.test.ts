import { describe, expect, it } from "vitest";
import { evaluateTelegramGuestMessageAuthorization } from "./guest-access.js";

const SUMMONER_ID = "1879026273";

describe("evaluateTelegramGuestMessageAuthorization", () => {
  it("allows guest messages from a sender in the account allowFrom list", () => {
    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: [SUMMONER_ID],
        senderId: SUMMONER_ID,
        senderUsername: "summoner",
      }),
    ).toEqual({ allowed: true });
  });

  it("allows guest messages when allowFrom contains the wildcard entry", () => {
    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: ["*"],
        senderId: "111111",
        senderUsername: "someone-else",
      }),
    ).toEqual({ allowed: true });
  });

  it("rejects guest messages when allowFrom is missing or empty", () => {
    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: undefined,
        senderId: SUMMONER_ID,
        senderUsername: "summoner",
      }),
    ).toEqual({ allowed: false, reason: "allowfrom-empty" });

    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: [],
        senderId: SUMMONER_ID,
        senderUsername: "summoner",
      }),
    ).toEqual({ allowed: false, reason: "allowfrom-empty" });
  });

  it("rejects guest messages from senders not in allowFrom", () => {
    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: [SUMMONER_ID],
        senderId: "999999",
        senderUsername: "stranger",
      }),
    ).toEqual({ allowed: false, reason: "sender-not-allowed" });
  });

  it("rejects guest messages with no sender id even when allowFrom is populated", () => {
    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: [SUMMONER_ID],
        senderId: "",
        senderUsername: "",
      }),
    ).toEqual({ allowed: false, reason: "sender-not-allowed" });
  });

  it("does not apply group-membership allowlist gates: a chat the bot is not in must still be reachable", () => {
    // Regression: Bot API 10.0 Guest Mode bug. When the bot received a
    // guest_message from a supergroup it was not a member of, the old
    // handler funnelled it through shouldSkipGroupMessage() which enforced
    // groupPolicy=allowlist and dropped it as "not-allowed". Guest Mode
    // authorization should be sender-scoped, not chat-scoped, so the same
    // sender summoning the bot from an arbitrary chat must still be allowed.
    expect(
      evaluateTelegramGuestMessageAuthorization({
        allowFrom: [SUMMONER_ID],
        senderId: SUMMONER_ID,
        senderUsername: "summoner",
      }),
    ).toEqual({ allowed: true });
  });
});
