import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("./provider-hook-runtime.js", () => ({
  resolveProviderRuntimePlugin: vi.fn(({ provider }: { provider: string }) =>
    provider === "runtime-hook"
      ? {
          id: "runtime-provider",
          hookAliases: ["runtime-hook"],
          resolveThinkingProfile: () => ({
            levels: [{ id: "off" as const }, { id: "xhigh" as const }],
          }),
        }
      : undefined,
  ),
}));

import {
  resolveProviderDefaultThinkingLevel,
  resolveProviderThinkingProfile,
  resolveProviderXHighThinking,
} from "./provider-thinking.js";

const PLUGIN_REGISTRY_STATE = Symbol.for("openclaw.pluginRegistryState");

type GlobalWithPluginRegistryState = typeof globalThis & {
  [PLUGIN_REGISTRY_STATE]?: unknown;
};

const globalWithPluginRegistryState = globalThis as GlobalWithPluginRegistryState;
const originalRegistryState = globalWithPluginRegistryState[PLUGIN_REGISTRY_STATE];

afterEach(() => {
  if (originalRegistryState === undefined) {
    delete globalWithPluginRegistryState[PLUGIN_REGISTRY_STATE];
  } else {
    globalWithPluginRegistryState[PLUGIN_REGISTRY_STATE] = originalRegistryState;
  }
});

describe("provider thinking hooks", () => {
  it("uses the pinned channel registry when activeRegistry is empty", () => {
    globalWithPluginRegistryState[PLUGIN_REGISTRY_STATE] = {
      activeRegistry: null,
      channel: {
        registry: {
          providers: [
            {
              provider: {
                id: "openai-codex",
                resolveThinkingProfile: ({ modelId }: { modelId: string }) => ({
                  levels:
                    modelId === "gpt-5.5"
                      ? [
                          { id: "off" as const },
                          { id: "minimal" as const },
                          { id: "low" as const },
                          { id: "medium" as const },
                          { id: "high" as const },
                          { id: "xhigh" as const },
                        ]
                      : [{ id: "off" as const }],
                }),
              },
            },
          ],
        },
        pinned: true,
        version: 1,
      },
    };

    expect(
      resolveProviderThinkingProfile({
        provider: "openai-codex",
        context: { provider: "openai-codex", modelId: "gpt-5.5", reasoning: true },
      })?.levels.map((level) => level.id),
    ).toContain("xhigh");
  });

  it("matches provider hook aliases from the active registry", () => {
    globalWithPluginRegistryState[PLUGIN_REGISTRY_STATE] = {
      activeRegistry: {
        providers: [
          {
            provider: {
              id: "demo-provider",
              hookAliases: ["demo-hook"],
              supportsXHighThinking: () => true,
              resolveDefaultThinkingLevel: () => "xhigh" as const,
            },
          },
        ],
      },
      channel: {
        registry: null,
        pinned: false,
        version: 0,
      },
    };

    expect(
      resolveProviderXHighThinking({
        provider: "demo-hook",
        context: { provider: "demo-hook", modelId: "demo-model" },
      }),
    ).toBe(true);
    expect(
      resolveProviderDefaultThinkingLevel({
        provider: "demo-hook",
        context: { provider: "demo-hook", modelId: "demo-model" },
      }),
    ).toBe("xhigh");
  });

  it("falls back to runtime provider hooks when the active registry entry has no hook", () => {
    globalWithPluginRegistryState[PLUGIN_REGISTRY_STATE] = {
      activeRegistry: {
        providers: [
          {
            provider: {
              id: "runtime-hook",
            },
          },
        ],
      },
      channel: {
        registry: null,
        pinned: false,
        version: 0,
      },
    };

    const profile = resolveProviderThinkingProfile({
      provider: "runtime-hook",
      context: { provider: "runtime-hook", modelId: "runtime-model", reasoning: true },
    });

    expect(profile?.levels.map((level) => level.id)).toContain("xhigh");
  });
});
