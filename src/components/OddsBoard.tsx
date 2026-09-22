"use client";

import { Card, Chip, DistRow, Label } from "@/components/ui";
import { getComponent } from "@/lib/catalog";
import type { RankedOption } from "@/lib/jev/evaluate";
import { TOSS_UP } from "@/lib/jev/questions";

interface Props {
  ranking: RankedOption[];
  othersMass: number;
  notAComponent: number;
  candidates: number;
  answerId?: string | null;
  idle?: boolean;
  limit?: number;
  question?: string;
}

/** The CHOICE card: which_component, drawn as a distribution. */
export function OddsBoard({ ranking, othersMass, notAComponent, candidates, answerId = null, idle = false, limit = 10, question = "which_component" }: Props) {
  const rows = ranking.slice(0, limit);
  const max = rows[0]?.p ?? 0;

  return (
    <Card className="flex min-h-0 flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
        <div className="flex items-baseline gap-3">
          <span className="label">choice</span>
          <span className="mono text-[0.78rem]">{question}</span>
        </div>
        <Chip tone="muted" className="!text-[0.62rem] !px-1.5 !py-1">{candidates + 1} options</Chip>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
        <Label right={idle ? "waiting for state" : "p, sorted"}>distribution</Label>
        {idle ? (
          <div className="dotgrid mt-3 flex min-h-0 flex-1 flex-col items-center justify-center rounded-[4px] border border-dashed border-line-strong p-6 text-center">
            <span className="holo inline-block h-8 w-8 rounded-full" aria-hidden />
            <p className="mt-3 max-w-[30ch] text-[0.82rem] text-ink-2">
              Every 350ms of quiet, one request ranks all {candidates} components against your text. The distribution lands here.
            </p>
          </div>
        ) : (
          <ol className="mt-3 flex min-h-0 flex-1 flex-col gap-[7px] overflow-y-auto">
            {rows.map((row, index) => {
              const isAnswer = answerId === row.id;
              const isTossUp = index === 1 && row.p >= TOSS_UP;
              return (
                <DistRow
                  key={row.id}
                  prefix={String(index + 1).padStart(2, "0")}
                  name={`${getComponent(row.id)?.name ?? row.id}${isAnswer ? " ✓" : ""}`}
                  p={row.p}
                  max={max}
                  tone={isAnswer ? "green" : index === 0 ? "ink" : isTossUp ? "amber" : "ink"}
                  faded={index > 0 && !isAnswer && !isTossUp}
                />
              );
            })}
          </ol>
        )}
      </div>

      <div className="mono flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-4 py-2 text-[0.72rem] text-ink-2">
        <span>
          everything else <span className="text-ink">{othersMass.toFixed(2)}</span>
        </span>
        <span>
          not_a_component <span className="text-ink">{notAComponent.toFixed(2)}</span>
        </span>
      </div>
    </Card>
  );
}
