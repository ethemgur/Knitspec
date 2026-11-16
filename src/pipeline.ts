import { calculate, CalcOptions, DEFAULT_CALC, Figures } from "./calc";
import { Fabric, Issue } from "./model";
import { parseFabric, ParseOptions } from "./parser";
import { DEFAULT_VALIDATION, validate, ValidationOptions } from "./validate";

export interface PipelineResult {
  fabric?: Fabric;
  figures?: Figures;
  issues: Issue[];
}

export interface PipelineOptions extends ParseOptions {
  calc?: CalcOptions;
  validation?: ValidationOptions;
}

/** Parsed YAML → model → figures → checks. Pure; no Obsidian imports. */
export function runPipeline(raw: unknown, opts: PipelineOptions = {}): PipelineResult {
  const parsed = parseFabric(raw, opts);
  if (!parsed.fabric) return { issues: parsed.issues };
  const figures = calculate(parsed.fabric, opts.calc ?? DEFAULT_CALC);
  const issues = [...parsed.issues, ...validate(parsed.fabric, figures, opts.validation ?? DEFAULT_VALIDATION)];
  return { fabric: parsed.fabric, figures, issues };
}

/** Find the first ```knit block in a note's text. */
export function findKnitBlock(markdown: string): string | undefined {
  const m = markdown.match(/^(`{3,}|~{3,})knit[^\S\n]*\n([\s\S]*?)\n\1[^\S\n]*$/m);
  return m ? m[2] : undefined;
}
