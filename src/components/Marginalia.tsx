"use client";

import type { PublicEvaluation } from "@/lib/game/types";

interface Props {
  latest: PublicEvaluation | null;
  requests: number;
  spendUsd: number;
}

function usd(value: number): string {
  if (value === 0) return "$0";
  if (value < 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(4)}`;
}

/** One-line usage readout, like the console's usage strip. */
export function Marginalia({ latest, requests, spendUsd }: Props) {
  const cells: [string, string][] = [
    ["model", latest?.model ?? "—"],
    ["source", latest?.source ?? "—"],
    ["input_tokens", latest ? latest.inputTokens.toLocaleString() : "—"],
    ["latency", latest ? `${latest.latencyMs}ms` : "—"],
    ["last_call", latest ? usd(latest.costUsd) : "—"],
    ["requests", String(requests)],
    ["session", usd(spendUsd)],
  ];
  return (
    <footer className="mono flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-line pt-2.5 text-[0.72rem] text-ink-3">
      <span className="label">usage</span>
      {cells.map(([k, v]) => (
        <span key={k}>
          {k} <span className="text-ink">{v}</span>
        </span>
      ))}
      <span className="ml-auto">output tokens are free</span>
    </footer>
  );
}
