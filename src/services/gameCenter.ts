export function configuredGameCenterUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.href : null;
  } catch { return null; }
}

// A future native-app bridge belongs here; no unannounced Forge API is assumed in V1.
export const gameCenterIntegration = {
  available(configuredUrl: string) { return Boolean(configuredGameCenterUrl(configuredUrl)); },
  destination(configuredUrl: string) { return configuredGameCenterUrl(configuredUrl); },
};