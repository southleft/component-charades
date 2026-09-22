import type { ChoiceResponse } from "@typesafe-ai/sdk";
import { CATALOG } from "@/lib/catalog";
import { costUsd, getClient, jevMode } from "@/lib/jev/client";
import {
  CHARADES_QUESTIONS,
  LIBRARY_LISTING,
  LOST_FOUND_QUESTIONS,
  NOT_A_COMPONENT_ID,
  WHY_OPTIONS,
  type Mode,
  type WhyAspect,
} from "@/lib/jev/questions";

export interface RankedOption {
  id: string;
  p: number;
}

export interface Evaluation {
  mode: Mode;
  source: "jev" | "fixtures";
  model: string;
  latencyMs: number;
  inputTokens: number;
  costUsd: number;
  /** Every catalog option, descending probability. Excludes not_a_component. */
  ranking: RankedOption[];
  /** Probability mass Jev put on "this is not a component at all". */
  notAComponent: number;
  /** Confidence of the catalog Choice, as reported by Jev. */
  confidence: number;
  signals: {
    vague: number;
    behavior: number | null;
    appearance: number | null;
    placement: number | null;
    vividness: { score: number; confidence: number };
    why: { aspect: WhyAspect; probabilities: Record<WhyAspect, number>; confidence: number };
  };
  /** Lost & Found only. */
  exists: number | null;
}

export async function evaluateDescription(
  description: string,
  mode: Mode,
  signal?: AbortSignal,
): Promise<Evaluation> {
  if (jevMode() === "fixtures") return fixtureEvaluation(description, mode);

  const started = performance.now();
  const client = getClient();

  if (mode === "charades") {
    const result = await client.systemOne(
      { state: { description }, questions: CHARADES_QUESTIONS },
      { signal },
    );
    const a = result.answers;
    return {
      mode,
      source: "jev",
      model: result.model,
      latencyMs: Math.round(performance.now() - started),
      inputTokens: result.usage.input_tokens,
      costUsd: costUsd(result.usage.input_tokens),
      ...splitCatalogChoice(a.which_component),
      signals: {
        vague: a.is_vague.noul,
        behavior: a.describes_behavior.noul,
        appearance: a.describes_appearance.noul,
        placement: a.describes_placement.noul,
        vividness: { score: a.vividness.score, confidence: a.vividness.confidence },
        why: readWhy(a.why_matched),
      },
      exists: null,
    };
  }

  const result = await client.systemOne(
    {
      state: { description, library: LIBRARY_LISTING },
      questions: LOST_FOUND_QUESTIONS,
    },
    { signal },
  );
  const a = result.answers;
  return {
    mode,
    source: "jev",
    model: result.model,
    latencyMs: Math.round(performance.now() - started),
    inputTokens: result.usage.input_tokens,
    costUsd: costUsd(result.usage.input_tokens),
    ...splitCatalogChoice(a.which_component),
    signals: {
      vague: a.is_vague.noul,
      behavior: null,
      appearance: null,
      placement: null,
      vividness: { score: a.vividness.score, confidence: a.vividness.confidence },
      why: readWhy(a.why_matched),
    },
    exists: a.exists_in_library.noul,
  };
}

function splitCatalogChoice(answer: ChoiceResponse) {
  const ranking: RankedOption[] = [];
  let notAComponent = 0;
  for (const [id, p] of Object.entries(answer.probabilities)) {
    if (id === NOT_A_COMPONENT_ID) notAComponent = p;
    else ranking.push({ id, p });
  }
  ranking.sort((x, y) => y.p - x.p);
  return { ranking, notAComponent, confidence: answer.confidence };
}

function readWhy(answer: ChoiceResponse<typeof WHY_OPTIONS>) {
  return {
    aspect: answer.choice,
    probabilities: answer.probabilities as Record<WhyAspect, number>,
    confidence: answer.confidence,
  };
}

// ---------------------------------------------------------------------------
// Fixtures: a cheap keyword-overlap stand-in so the UI runs with no API key.
// Nothing here is a model. It exists so layout work costs nothing.
// ---------------------------------------------------------------------------

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3),
  );
}

async function fixtureEvaluation(description: string, mode: Mode): Promise<Evaluation> {
  const started = performance.now();
  await new Promise((r) => setTimeout(r, 120 + Math.random() * 180));
  const words = tokens(description);
  const scores = CATALOG.map((entry) => {
    const target = tokens(`${entry.name} ${entry.aliases.join(" ")} ${entry.description}`);
    let overlap = 0;
    for (const w of words) if (target.has(w)) overlap += 1;
    return { id: entry.id, raw: overlap };
  });
  const temperature = 0.9;
  const exps = scores.map((s) => Math.exp(s.raw / temperature));
  const total = exps.reduce((a, b) => a + b, 0) + Math.exp(0.2);
  const ranking = scores
    .map((s, i) => ({ id: s.id, p: exps[i] / total }))
    .sort((x, y) => y.p - x.p);
  const top = ranking[0]?.p ?? 0;
  const n = ranking.length + 1;
  const confidence = Math.max(0, Math.min(1, (n * top - 1) / (n - 1)));
  const behavior = /appear|disappear|slide|open|close|click|hover|toggle|submit|drag|scroll/.test(
    description.toLowerCase(),
  )
    ? 0.9
    : 0.15;
  const appearance = /round|square|red|blue|dark|small|large|icon|shadow|border|pill|circle/.test(
    description.toLowerCase(),
  )
    ? 0.85
    : 0.2;
  const placement = /top|bottom|corner|side|left|right|center|inline|float|edge/.test(
    description.toLowerCase(),
  )
    ? 0.85
    : 0.2;
  const aspects: Record<WhyAspect, number> = {
    behavior: behavior * 0.5,
    appearance: appearance * 0.3,
    placement: placement * 0.3,
    content: 0.1,
  };
  const sum = Object.values(aspects).reduce((a, b) => a + b, 0);
  for (const k of Object.keys(aspects) as WhyAspect[]) aspects[k] /= sum;
  const aspect = (Object.entries(aspects) as [WhyAspect, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0][0];
  const tokensUsed = 3200 + description.length * 2;
  return {
    mode,
    source: "fixtures",
    model: "fixtures",
    latencyMs: Math.round(performance.now() - started),
    inputTokens: tokensUsed,
    costUsd: costUsd(tokensUsed),
    ranking,
    notAComponent: Math.exp(0.2) / total,
    confidence,
    signals: {
      vague: words.size < 3 ? 0.9 : 0.1,
      behavior: mode === "charades" ? behavior : null,
      appearance: mode === "charades" ? appearance : null,
      placement: mode === "charades" ? placement : null,
      vividness: { score: Math.min(2, words.size / 4), confidence: 0.6 },
      why: { aspect, probabilities: aspects, confidence: 0.5 },
    },
    exists: mode === "lostfound" ? Math.min(0.95, top * 3) : null,
  };
}
