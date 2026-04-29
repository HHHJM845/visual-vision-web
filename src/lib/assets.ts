const rawAssetBaseUrl = (import.meta.env.VITE_ASSET_BASE_URL as string | undefined) || "";

export const assetBaseUrl = rawAssetBaseUrl.replace(/\/$/, "");

export function assetUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return assetBaseUrl ? `${assetBaseUrl}${normalizedPath}` : normalizedPath;
}
