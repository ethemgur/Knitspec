import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runPipeline } from "../src/pipeline";

/** Text of a fixture block in tests/fixtures/<name>.knit */
export function fixture(name: string): string {
  return readFileSync(join(__dirname, "fixtures", `${name}.knit`), "utf8");
}

export function run(src: string) {
  return runPipeline(src);
}

export const codes = (issues: { code: string }[]) => issues.map((i) => i.code);
