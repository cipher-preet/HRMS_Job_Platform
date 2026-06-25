const BACKEND_URL = (
  process.env.BACKEND_URL ?? "https://hrms-product-backend.onrender.com"
).replace(/\/+$/, "");

export function getBackendUrl(path: string) {
  return new URL(path.replace(/^\/+/, ""), `${BACKEND_URL}/`);
}
