import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

export function graphEnabled() {
  return !!process.env.HYDRA_URL && !!process.env.HYDRA_TOKEN_FILE;
}
export async function graphQuery(
  query: string,
  parameters: Record<string, unknown>,
) {
  const token = (await readFile(process.env.HYDRA_TOKEN_FILE!, "utf8")).trim();
  const response = await fetch(
    `${process.env.HYDRA_URL}/v1/graphs/commons/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "X-Graph-Namespace": "commons",
      },
      body: JSON.stringify({
        cell_id: "cell-0",
        query_id: randomUUID(),
        query,
        parameters,
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    },
  );
  const body = await response.json();
  if (!response.ok || body.error)
    throw new Error("Graph retrieval unavailable.");
  return body as { rows: { type: string; value: unknown }[][] };
}
