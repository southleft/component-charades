import { TypeSafeClient } from "@typesafe-ai/sdk";

/** Price per input token for Jev 1.13: $0.042 per million tokens. Output is free. */
export const USD_PER_INPUT_TOKEN = 0.042 / 1_000_000;

export type JevMode = "live" | "fixtures";

export function jevMode(): JevMode {
  if (process.env.JEV_MODE === "fixtures") return "fixtures";
  if (!process.env.TYPESAFE_API_KEY) return "fixtures";
  return "live";
}

let client: TypeSafeClient | null = null;

/** Server-only singleton. Never import this from a client component. */
export function getClient(): TypeSafeClient {
  if (!client) {
    client = new TypeSafeClient({
      timeout: 15_000,
      retry: { maxRetries: 1 },
    });
  }
  return client;
}

export function costUsd(inputTokens: number): number {
  return inputTokens * USD_PER_INPUT_TOKEN;
}
