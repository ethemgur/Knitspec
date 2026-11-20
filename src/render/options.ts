import { Bed, EMPTY, Fabric } from "../model";

/** How the cam chart shows cams. */
export interface DisplayOptions {
  /** K/T/M letters (factory sheets) or textbook cam symbols ∧ ⏜ —. */
  camStyle: "letters" | "symbols";
}

export const DEFAULT_DISPLAY: DisplayOptions = { camStyle: "letters" };

/** A track's name as written in the block (1, 1', 2 …), from its internal id. */
export function trackLabel(fabric: Fabric, bed: Bed, track: string): string {
  return fabric.labels?.[bed]?.[track] ?? track;
}

/** A set-out as written: "AB", or "1 1' 2 2'" when names are longer than one character. */
export function setoutText(fabric: Fabric, bed: Bed, set: string[]): string {
  const names = set.map((t) => (t === EMPTY ? "-" : trackLabel(fabric, bed, t)));
  return names.join(names.some((n) => n.length > 1) ? " " : "");
}
