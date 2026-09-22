import { NextResponse } from "next/server";
import { bannedWordsFor, findBannedWord } from "@/lib/catalog";
import { readRound } from "@/lib/game/round";
import { charadesVerdict, lostFoundVerdict } from "@/lib/game/verdict";
import { evaluateDescription, type Evaluation } from "@/lib/jev/evaluate";
import { MIN_DESCRIPTION_CHARS, type Mode } from "@/lib/jev/questions";

export const runtime = "nodejs";

const MAX_DESCRIPTION_CHARS = 600;
const TOP_N = 10;

interface GuessBody {
  description?: unknown;
  mode?: unknown;
  round?: unknown;
}

/** Trim the full ranking to what the UI shows, keeping the leftover mass. */
function publicEvaluation(evaluation: Evaluation) {
  const shown = evaluation.ranking.slice(0, TOP_N);
  const shownMass = shown.reduce((sum, r) => sum + r.p, 0);
  return {
    ...evaluation,
    ranking: shown,
    othersMass: Math.max(0, 1 - shownMass - evaluation.notAComponent),
    candidates: evaluation.ranking.length,
  };
}

export async function POST(request: Request) {
  let body: GuessBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : "";
  const mode: Mode = body.mode === "lostfound" ? "lostfound" : "charades";

  if (description.length < MIN_DESCRIPTION_CHARS) {
    return NextResponse.json({ error: "description too short" }, { status: 422 });
  }
  if (description.length > MAX_DESCRIPTION_CHARS) {
    return NextResponse.json({ error: "description too long" }, { status: 422 });
  }

  try {
    if (mode === "charades") {
      const token = typeof body.round === "string" ? body.round : "";
      const target = readRound(token);
      if (!target) {
        return NextResponse.json({ error: "invalid round token" }, { status: 400 });
      }
      const banned = findBannedWord(description, bannedWordsFor(target));
      if (banned) {
        return NextResponse.json({ error: "banned word", word: banned }, { status: 422 });
      }
      const evaluation = await evaluateDescription(description, mode, request.signal);
      return NextResponse.json({
        evaluation: publicEvaluation(evaluation),
        verdict: charadesVerdict(evaluation, target),
      });
    }

    const evaluation = await evaluateDescription(description, mode, request.signal);
    return NextResponse.json({
      evaluation: publicEvaluation(evaluation),
      verdict: lostFoundVerdict(evaluation),
    });
  } catch (err) {
    if (request.signal.aborted) {
      return new NextResponse(null, { status: 499 });
    }
    const message = err instanceof Error ? err.message : "evaluation failed";
    console.error("[jev] guess failed:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
