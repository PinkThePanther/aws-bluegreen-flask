const configuredApiUrl = import.meta.env.VITE_API_URL || "";
const apiBaseUrl = configuredApiUrl.replace(/\/$/, "");

export function apiUrl(path) {
  return `${apiBaseUrl}${path}`;
}
