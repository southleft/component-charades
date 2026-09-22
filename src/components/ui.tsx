import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { Category } from "@/lib/catalog";

/** White card with hairline border and corner crosshairs. */
export function Card({ children, className = "", crosshair = true }: { children: ReactNode; className?: string; crosshair?: boolean }) {
  return (
    <section className={`card ${crosshair ? "crosshair" : ""} ${className}`}>
      {crosshair ? <span className="xh pointer-events-none absolute inset-0" aria-hidden /> : null}
      {children}
    </section>
  );
}

/** Mono small-caps label, optionally with a right-aligned value. */
export function Label({ children, right, className = "" }: { children: ReactNode; right?: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline justify-between gap-3 ${className}`}>
      <span className="label">{children}</span>
      {right !== undefined ? <span className="label">{right}</span> : null}
    </div>
  );
}

type ChipTone = "outline" | "fill" | "muted" | "red" | "green" | "blue";
const CHIP: Record<ChipTone, string> = {
  outline: "",
  fill: "chip-fill",
  muted: "chip-muted",
  red: "chip-red",
  green: "chip-green",
  blue: "chip-blue",
};

export function Chip({ children, tone = "outline", className = "", dot }: { children: ReactNode; tone?: ChipTone; className?: string; dot?: string }) {
  return (
    <span className={`chip ${CHIP[tone]} ${className}`}>
      {dot ? <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: dot }} aria-hidden /> : null}
      {children}
    </span>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ghost?: boolean;
  arrow?: string | null;
  children: ReactNode;
}

export function Button({ ghost = false, arrow = "→", children, className = "", ...rest }: ButtonProps) {
  return (
    <button type="button" className={`btn ${ghost ? "btn-ghost" : ""} ${className}`} {...rest}>
      <span>{children}</span>
      {arrow ? <span aria-hidden>{arrow}</span> : null}
    </button>
  );
}

/** A tiny colored dot per category, the only colour in the chips. */
export const CATEGORY_DOT: Record<Category, string> = {
  actions: "#2f5bea",
  inputs: "#17a672",
  selection: "#d9880f",
  navigation: "#7c3aed",
  feedback: "#d63b3b",
  overlays: "#0891b2",
  layout: "#111111",
  "data-display": "#be185d",
  media: "#4d7c0f",
  typography: "#6b6b6b",
  utility: "#a16207",
};

/** Thin distribution row: label left, hairline bar, value right. */
export function DistRow({ name, p, max, tone = "ink", prefix, faded = false }: { name: string; p: number; max: number; tone?: "ink" | "green" | "red" | "blue" | "amber"; prefix?: string; faded?: boolean }) {
  const width = max > 0 ? Math.max(0, (p / max) * 100) : 0;
  const color = tone === "ink" ? "var(--ink)" : `var(--${tone})`;
  return (
    <li className={`grid grid-cols-[1.5rem_minmax(0,9.5rem)_1fr_3.2rem] items-center gap-3 ${faded ? "opacity-40" : ""}`}>
      <span className="mono text-[0.7rem] text-ink-3">{prefix}</span>
      <span className="truncate text-[0.85rem]" style={{ color: tone === "ink" ? undefined : color }} title={name}>
        {name}
      </span>
      <div className="dist-track">
        <div className="dist-fill" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="mono text-right text-[0.75rem]">{p >= 0.995 ? "1.00" : p.toFixed(2)}</span>
    </li>
  );
}
