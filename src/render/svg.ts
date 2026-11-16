/** Tiny string-based SVG builder. All text goes through `esc`. */

export function esc(s: string | number): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Attrs = Record<string, string | number | undefined>;

function attrs(a: Attrs): string {
  return Object.entries(a)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => ` ${k}="${esc(typeof v === "number" ? round(v) : v!)}"`)
    .join("");
}

export function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export function tag(name: string, a: Attrs, children: string | string[] = ""): string {
  const inner = Array.isArray(children) ? children.join("") : children;
  return inner ? `<${name}${attrs(a)}>${inner}</${name}>` : `<${name}${attrs(a)}/>`;
}

export function text(x: number, y: number, content: string | number, a: Attrs = {}): string {
  return tag("text", { x, y, ...a }, esc(content));
}

export function svgRoot(width: number, height: number, cls: string, body: string[], title?: string): string {
  return tag(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: `0 0 ${round(width)} ${round(height)}`,
      width: round(width),
      height: round(height),
      class: `knitspec-svg ${cls}`,
      role: "img",
      "font-family": "var(--font-interface, system-ui, sans-serif)",
      "font-size": 11,
    },
    [title ? tag("title", {}, esc(title)) : "", ...body],
  );
}

/** Stitch colours, chosen to read on light and dark backgrounds and in print. */
export const STITCH_COLOUR = { K: "#2e8b57", T: "#d9822b", M: "#8a8f98" } as const;

/** Make an SVG self-contained for export: dark text on a white sheet. */
export function standalone(svg: string): string {
  return svg
    .replace(/var\(--font-interface, system-ui, sans-serif\)/g, "system-ui, sans-serif")
    .replace(/<svg([^>]*)>/, (_m, a: string) => {
      const vb = a.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
      const bg = vb ? `<rect x="0" y="0" width="${vb[1]}" height="${vb[2]}" fill="#ffffff"/>` : "";
      return `<svg${a} style="color:#1f2328">${bg}`;
    });
}
