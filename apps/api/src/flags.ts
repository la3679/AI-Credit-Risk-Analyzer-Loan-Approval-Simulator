import type { FeatureFlagKey } from "@credora/shared";
import { DEFAULT_FEATURE_FLAGS } from "@credora/shared";
import { FeatureFlag } from "./models";
import { ApiError } from "./errors";

export async function getFeatureFlags() {
  const saved = await FeatureFlag.find({}).lean();
  return saved.reduce((flags, flag) => ({ ...flags, [flag.key]: flag.enabled }), { ...DEFAULT_FEATURE_FLAGS });
}

export async function requireFlag(key: FeatureFlagKey) {
  const flags = await getFeatureFlags();
  if (!flags[key]) throw new ApiError(403, "FEATURE_DISABLED", "This feature is not currently enabled.");
}
