"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Card, Label } from "@/components/ui";

interface Props {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder: string;
  bannedHit: string | null;
  autoFocus?: boolean;
  /** Card title, e.g. "state" */
  title: string;
  titleRight?: ReactNode;
  /** Instruction block above the text. */
  header: ReactNode;
  /** Label above the textarea. */
  lead: string;
  status: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

/** The STATE card: instruction on top, your text in the middle, Jev's commentary at the bottom. */
export function Describer({ value, onChange, disabled = false, placeholder, bannedHit, autoFocus = false, title, titleRight, header, lead, status, actions, children }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) ref.current?.focus();
  }, [autoFocus, disabled]);

  return (
    <Card className={`flex h-full min-h-0 flex-col ${bannedHit ? "shake" : ""}`}>
      <div className="border-b border-line px-4 py-2">
        <Label right={titleRight}>{title}</Label>
      </div>
      <div className="border-b border-line px-4 py-3">{header}</div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pt-3">
        <span className="label">{lead}</span>
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          spellCheck={false}
          aria-label={lead}
          aria-invalid={Boolean(bannedHit)}
          className={`h-display mt-2 w-full flex-1 resize-none bg-transparent text-[clamp(1.3rem,2.1vw,1.9rem)] !leading-[1.15] !font-normal focus:outline-none disabled:opacity-50 ${
            bannedHit ? "text-red" : "text-ink"
          } placeholder:text-ink-3/60`}
          style={{ minHeight: "2.6em" }}
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-2.5">
        <div className="min-w-0 text-[0.85rem]">{status}</div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </Card>
  );
}
