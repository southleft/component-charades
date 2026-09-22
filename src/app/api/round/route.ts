import { NextResponse } from "next/server";
import { issueRound, publicRound, readRound } from "@/lib/game/round";

export const runtime = "nodejs";

/** Start a new round. Body: { exclude?: string[] } of ids already played. */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const exclude = Array.isArray(body?.exclude)
    ? body.exclude.filter((x: unknown) => typeof x === "string")
    : [];
  const { token, target } = issueRound(exclude);
  return NextResponse.json(publicRound(token, target));
}

/** Give up: reveal the target for a token. Query: ?token=... */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const target = token ? readRound(token) : null;
  if (!target) {
    return NextResponse.json({ error: "invalid round token" }, { status: 400 });
  }
  return NextResponse.json({
    target: {
      id: target.id,
      name: target.name,
      description: target.description,
      category: target.category,
    },
  });
}
