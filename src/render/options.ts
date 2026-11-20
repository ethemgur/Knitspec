import { Bed } from "../model";

/** How the cam chart and messages show cams and tracks. */
export interface DisplayOptions {
  /** K/T/M letters (factory sheets) or textbook cam symbols ∧ ⏜ —. */
  camStyle: "letters" | "symbols";
  /** Track names A B C D or butt numbers 1 2 3 4. */
  trackNames: "letters" | "numbers";
  /** Cam chart: first track (A / 1) in the top row, or in the bottom row. */
  trackOrder: "first-top" | "first-bottom";
}

export const DEFAULT_DISPLAY: DisplayOptions = { camStyle: "letters", trackNames: "letters", trackOrder: "first-top" };

/** Track label as shown: A or 1; dial (kapak) tracks carry an apostrophe, A′ / 1′. */
export function trackLabel(bed: Bed | undefined, track: string, o: DisplayOptions = DEFAULT_DISPLAY): string {
  const base = o.trackNames === "numbers" && /^[A-Z]$/.test(track) ? String(track.charCodeAt(0) - 64) : track;
  return bed === "dial" ? `${base}′` : base;
}
