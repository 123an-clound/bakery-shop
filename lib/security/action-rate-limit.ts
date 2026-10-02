import "server-only";
import { headers } from "next/headers";
import { consumeRateLimit, requestClientKey } from "./rate-limit";

export async function allowPublicAction(scope: string, limit: number, windowMs = 15 * 60 * 1000) {
  const incoming = await headers();
  return (await consumeRateLimit(`${scope}:${requestClientKey(new Request("http://localhost", { headers: incoming }))}`, limit, windowMs)).allowed;
}
