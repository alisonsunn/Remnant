import { headers } from "next/headers";

export async function buildApiUrl(path: string): Promise<string> {
  const headerStore = await headers();
  const getHeader =
    typeof headerStore.get === "function"
      ? (name: string) => headerStore.get(name)
      : () => null;
  const host =
    getHeader("x-forwarded-host") ?? getHeader("host") ?? "localhost:3000";
  const proto = getHeader("x-forwarded-proto") ?? "http";
  return `${proto}://${host}${path}`;
}
