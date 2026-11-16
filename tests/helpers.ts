import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";
import { runPipeline } from "../src/pipeline";

export function fixture(name: string): unknown {
  return parse(readFileSync(join(__dirname, "fixtures", name), "utf8"));
}

export function run(raw: unknown) {
  return runPipeline(raw);
}

export function runYaml(src: string) {
  return runPipeline(parse(src));
}

export const codes = (issues: { code: string }[]) => issues.map((i) => i.code);
