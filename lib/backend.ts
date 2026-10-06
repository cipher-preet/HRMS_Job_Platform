const DEFAULT_BACKEND_URL =
  process.env.NODE_ENV === "development"
    ? "http://localhost:4000"
    : "https://hrms-product-backend.onrender.com";

const BACKEND_URL = (process.env.BACKEND_URL ?? DEFAULT_BACKEND_URL).replace(
  /\/+$/,
  "",
);

export function getBackendUrl(path: string) {
  return new URL(path.replace(/^\/+/, ""), `${BACKEND_URL}/`);
}

export function getBackendWebSocketUrl() {
  const url = new URL(BACKEND_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.origin;
}
