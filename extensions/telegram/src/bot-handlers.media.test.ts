import { describe, expect, it } from "vitest";
import { hasInboundMedia, resolveInboundMediaFileId } from "./bot-handlers.media.js";

describe("telegram inbound media helpers", () => {
  it("treats animation as inbound media", () => {
    const msg = {
      animation: {
        file_id: "anim-1",
        file_unique_id: "u-anim-1",
        width: 320,
        height: 180,
        duration: 3,
      },
    };

    expect(hasInboundMedia(msg as never)).toBe(true);
    expect(resolveInboundMediaFileId(msg as never)).toBe("anim-1");
  });

  it("still prefers sticker file_id when sticker metadata exists", () => {
    const msg = {
      sticker: {
        file_id: "stk-1",
        file_unique_id: "u-stk-1",
        type: "regular",
        width: 512,
        height: 512,
        is_animated: false,
        is_video: false,
      },
    };

    expect(hasInboundMedia(msg as never)).toBe(true);
    expect(resolveInboundMediaFileId(msg as never)).toBe("stk-1");
  });
});
