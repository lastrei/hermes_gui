const configuredProxyBaseUrl = import.meta.env.VITE_PROXY_BASE_URL ?? '';

export const PROXY_BASE_URL = configuredProxyBaseUrl.replace(/\/+$/, '');

export function proxyUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${PROXY_BASE_URL}${normalizedPath}`;
}
