/** Unit parsing for yarn counts, lengths and percentages. */

const NUM = String.raw`(\d+(?:[.,]\d+)?)`;

function num(s: string): number {
  return parseFloat(s.replace(",", "."));
}

/**
 * Convert a yarn count to tex.
 * Accepts: "75 dtex", "75/72 dtex" (second figure is filaments), "40 den",
 * "20 tex", "Ne 30", "30/1 Ne", "30/2 Ne" (ply), "Nm 50", "50/2 Nm".
 * A bare number is read as dtex, the usual unit for synthetics.
 */
export function parseCount(input: unknown): number | undefined {
  if (typeof input === "number") return input > 0 ? input / 10 : undefined;
  if (typeof input !== "string") return undefined;
  const s = input.trim().toLowerCase();

  // Ne / Nm, unit before or after, with optional /ply.
  const indirect = s.match(new RegExp(String.raw`^(?:(ne|nm)\s*)?${NUM}(?:\s*/\s*(\d+))?\s*(ne|nm)?$`));
  if (indirect && (indirect[1] || indirect[4])) {
    const unit = indirect[1] || indirect[4];
    const n = num(indirect[2]);
    const ply = indirect[3] ? parseInt(indirect[3], 10) : 1;
    if (n <= 0) return undefined;
    const single = unit === "ne" ? 590.5 / n : 1000 / n;
    return single * ply;
  }

  // dtex / den / tex, optional "/filaments" (ignored for mass).
  const direct = s.match(new RegExp(String.raw`^${NUM}(?:\s*/\s*\d+)?\s*(dtex|den|denier|d|tex)?$`));
  if (direct) {
    const n = num(direct[1]);
    if (n <= 0) return undefined;
    switch (direct[2]) {
      case "tex":
        return n;
      case "den":
      case "denier":
      case "d":
        return n / 9;
      default:
        return n / 10; // dtex or bare number
    }
  }
  return undefined;
}

/** Length in mm. Accepts "2.9 mm", "0.29 cm", "290 mm", or a bare number (mm). */
export function parseLengthMm(input: unknown): number | undefined {
  return parseLength(input, "mm");
}

/** Length in cm. Accepts "172 cm", "1.72 m", "1720 mm", or a bare number (cm). */
export function parseLengthCm(input: unknown): number | undefined {
  const mm = parseLength(input, "cm");
  return mm === undefined ? undefined : mm / 10;
}

function parseLength(input: unknown, bareUnit: "mm" | "cm"): number | undefined {
  if (typeof input === "number") return bareUnit === "mm" ? input : input * 10;
  if (typeof input !== "string") return undefined;
  const m = input.trim().toLowerCase().match(new RegExp(String.raw`^${NUM}\s*(mm|cm|m)?$`));
  if (!m) return undefined;
  const n = num(m[1]);
  switch (m[2] ?? bareUnit) {
    case "mm":
      return n;
    case "cm":
      return n * 10;
    case "m":
      return n * 1000;
  }
  return undefined;
}

/** Plain number, also from strings like "180 g/m²" or "25 rpm". */
export function parseNumber(input: unknown): number | undefined {
  if (typeof input === "number") return Number.isFinite(input) ? input : undefined;
  if (typeof input !== "string") return undefined;
  const m = input.trim().match(new RegExp(String.raw`^${NUM}`));
  return m ? num(m[1]) : undefined;
}

/** Fraction 0..1 from 0.85, "85%" or 85. */
export function parseFraction(input: unknown): number | undefined {
  if (typeof input === "string" && input.trim().endsWith("%")) {
    const n = parseNumber(input);
    return n === undefined ? undefined : n / 100;
  }
  const n = parseNumber(input);
  if (n === undefined) return undefined;
  return n > 1 ? n / 100 : n;
}
