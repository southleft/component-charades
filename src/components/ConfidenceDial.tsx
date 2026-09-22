"use client";

import { Card, Chip, Label } from "@/components/ui";
import type { PublicEvaluation } from "@/lib/game/types";
import { BUZZ_IN, LEANING } from "@/lib/jev/questions";

interface Props {
  confidence: number;
  buzzed?: boolean;
  pick: string | null;
  pickP: number | null;
  signals?: PublicEvaluation["signals"] | null;
}

/** CONFIDENCE readout plus the side-question instruments (Nouls and the vividness Score). */
export function ConfidenceDial({ confidence, buzzed = false, pick, pickP, signals }: Props) {
  const state = confidence >= BUZZ_IN ? "buzz" : confidence >= LEANING ? "leaning" : confidence > 0 ? "listening" : "idle";
  const stateTone = confidence >= BUZZ_IN ? (buzzed ? "green" : "fill") : confidence >= LEANING ? "blue" : "muted";

  return (
    <Card className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] divide-x divide-line">
      <div className="px-4 py-3">
        <Label right={<Chip tone={stateTone} className="!text-[0.62rem] !px-1.5 !py-1">{state}</Chip>}>confidence</Label>
        <div className="num mt-2 text-[3rem]">{confidence.toFixed(2)}</div>
        <div className="relative mt-3">
          <div className="dist-track !h-[3px]">
            <div className="dist-fill" style={{ width: `${Math.round(confidence * 100)}%`, background: confidence >= BUZZ_IN ? "var(--green)" : "var(--ink)" }} />
          </div>
          {[LEANING, BUZZ_IN].map((mark) => (
            <span key={mark} className="absolute -top-[5px] h-[13px] w-px bg-ink-3" style={{ left: `${mark * 100}%` }} aria-hidden />
          ))}
        </div>
        <div className="relative mt-1.5 h-4">
          <span className="label absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${LEANING * 100}%` }}>lean {LEANING}</span>
          <span className="label absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${BUZZ_IN * 100}%` }}>buzz {BUZZ_IN}</span>
        </div>
        <div className="mt-3 border-t border-line pt-2">
          <span className="label">choice</span>
          <div className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="truncate text-[0.95rem] font-medium">{pick ?? "—"}</span>
            <span className="mono text-[0.75rem] text-ink-2">{pickP !== null ? `p ${pickP.toFixed(2)}` : ""}</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3">
        <Label right="noul · 0–1">side questions</Label>
        <ul className="mt-2 flex flex-col gap-1.5">
          {[
            ["describes_behavior", signals?.behavior ?? null],
            ["describes_appearance", signals?.appearance ?? null],
            ["describes_placement", signals?.placement ?? null],
            ["is_vague", signals?.vague ?? null],
          ].map(([name, v]) => (
            <li key={name as string} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <span className="mono truncate text-[0.72rem] text-ink-2">{name as string}</span>
              <span className="flex items-center gap-2">
                <span className="dist-track w-14">
                  <span className="dist-fill" style={{ width: `${Math.round(((v as number | null) ?? 0) * 100)}%`, background: (v as number | null) !== null && (v as number) >= 0.5 ? "var(--ink)" : "var(--line-strong)" }} />
                </span>
                <span className="mono w-8 text-right text-[0.72rem]">{v === null ? "—" : (v as number).toFixed(2)}</span>
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 border-t border-line pt-2">
          <Label right="score · 0–2">vividness</Label>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="num text-[1.4rem]">{signals ? signals.vividness.score.toFixed(2) : "—"}</span>
            <span className="mono text-[0.7rem] text-ink-3">
              {signals ? (signals.vividness.score < 0.7 ? "flat" : signals.vividness.score < 1.4 ? "workable" : "vivid") : ""}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
