import { createHmac, createHash, randomInt, timingSafeEqual } from "node:crypto";
import { CATALOG, bannedWordsFor, getComponent, type CatalogEntry } from "@/lib/catalog";

/**
 * A round token is `base64url(id).hmac`. The target id travels to the browser
 * signed but not hidden from a determined peeker; the point is only that the
 * client cannot forge a "correct" verdict, since /api/guess re-derives the
 * target from the token and checks the signature.
 */

function secret(): string {
  const explicit = process.env.ROUND_SECRET;
  if (explicit) return explicit;
  const key = process.env.TYPESAFE_API_KEY ?? "component-charades-dev";
  return createHash("sha256").update(`round:${key}`).digest("hex");
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function issueRound(exclude: string[] = []): { token: string; target: CatalogEntry } {
  const pool = CATALOG.filter((entry) => !exclude.includes(entry.id));
  const source = pool.length > 0 ? pool : CATALOG;
  const target = source[randomInt(source.length)];
  const nonce = randomInt(1_000_000).toString(36);
  const payload = Buffer.from(`${target.id}:${nonce}`).toString("base64url");
  return { token: `${payload}.${sign(payload)}`, target };
}

export function readRound(token: string): CatalogEntry | null {
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(payload);
  if (sig.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  const [id] = Buffer.from(payload, "base64url").toString().split(":");
  return getComponent(id) ?? null;
}

export function publicRound(token: string, target: CatalogEntry) {
  return {
    token,
    category: target.category,
    banned: bannedWordsFor(target),
    /** The readable version of the ban list: the name and its aliases. */
    phrases: [target.name, ...target.aliases],
    /** Length of the name, as a crossword-style tease. */
    nameLength: target.name.length,
  };
}
