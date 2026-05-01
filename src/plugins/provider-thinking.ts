import { normalizeProviderId } from "../agents/provider-id.js";
import { resolveProviderRuntimePlugin } from "./provider-hook-runtime.js";
import type {
  ProviderDefaultThinkingPolicyContext,
  ProviderThinkingProfile,
  ProviderThinkingPolicyContext,
} from "./provider-thinking.types.js";
import { getActivePluginChannelRegistryFromState } from "./runtime-state.js";

type ThinkingProviderPlugin = {
  id: string;
  aliases?: string[];
  hookAliases?: string[];
  isBinaryThinking?: (ctx: ProviderThinkingPolicyContext) => boolean | undefined;
  supportsXHighThinking?: (ctx: ProviderThinkingPolicyContext) => boolean | undefined;
  resolveThinkingProfile?: (
    ctx: ProviderDefaultThinkingPolicyContext,
  ) => ProviderThinkingProfile | null | undefined;
  resolveDefaultThinkingLevel?: (
    ctx: ProviderDefaultThinkingPolicyContext,
  ) => "off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "adaptive" | null | undefined;
};

type ThinkingRegistry = {
  providers?: Array<{
    provider: ThinkingProviderPlugin;
  }>;
};

function matchesProviderId(provider: ThinkingProviderPlugin, providerId: string): boolean {
  const normalized = normalizeProviderId(providerId);
  if (!normalized) {
    return false;
  }
  if (normalizeProviderId(provider.id) === normalized) {
    return true;
  }
  return [...(provider.aliases ?? []), ...(provider.hookAliases ?? [])].some(
    (alias) => normalizeProviderId(alias) === normalized,
  );
}

function resolveThinkingProviderFromRegistry(
  registry: ThinkingRegistry | null | undefined,
  providerId: string,
): ThinkingProviderPlugin | undefined {
  return registry?.providers?.find((entry) => matchesProviderId(entry.provider, providerId))
    ?.provider;
}

function resolveActiveThinkingProvider(providerId: string): ThinkingProviderPlugin | undefined {
  return resolveThinkingProviderFromRegistry(getActivePluginChannelRegistryFromState(), providerId);
}

function resolveFallbackThinkingProvider(providerId: string): ThinkingProviderPlugin | undefined {
  return resolveProviderRuntimePlugin({ provider: providerId });
}

type ThinkingHookParams<TContext> = {
  provider: string;
  context: TContext;
};

export function resolveProviderBinaryThinking(
  params: ThinkingHookParams<ProviderThinkingPolicyContext>,
) {
  const activeProvider = resolveActiveThinkingProvider(params.provider);
  return (
    activeProvider?.isBinaryThinking?.(params.context) ??
    resolveFallbackThinkingProvider(params.provider)?.isBinaryThinking?.(params.context)
  );
}

export function resolveProviderXHighThinking(
  params: ThinkingHookParams<ProviderThinkingPolicyContext>,
) {
  const activeProvider = resolveActiveThinkingProvider(params.provider);
  return (
    activeProvider?.supportsXHighThinking?.(params.context) ??
    resolveFallbackThinkingProvider(params.provider)?.supportsXHighThinking?.(params.context)
  );
}

export function resolveProviderThinkingProfile(
  params: ThinkingHookParams<ProviderDefaultThinkingPolicyContext>,
) {
  const activeProvider = resolveActiveThinkingProvider(params.provider);
  return (
    activeProvider?.resolveThinkingProfile?.(params.context) ??
    resolveFallbackThinkingProvider(params.provider)?.resolveThinkingProfile?.(params.context)
  );
}

export function resolveProviderDefaultThinkingLevel(
  params: ThinkingHookParams<ProviderDefaultThinkingPolicyContext>,
) {
  const activeProvider = resolveActiveThinkingProvider(params.provider);
  return (
    activeProvider?.resolveDefaultThinkingLevel?.(params.context) ??
    resolveFallbackThinkingProvider(params.provider)?.resolveDefaultThinkingLevel?.(params.context)
  );
}
