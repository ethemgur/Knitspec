import { calculate, CalcOptions, DEFAULT_CALC, Figures } from "./calc";
import { Fabric, Issue } from "./model";
import { parseFabric, ParseOptions } from "./parser";
import { parseKnitText } from "./text";
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

/** Block text → model → figures → checks. Pure; no Obsidian imports. */
export function runPipeline(src: string, opts: PipelineOptions = {}): PipelineResult {
  const text = parseKnitText(src);
  if (text.issues.some((i) => i.code === "noGrid")) return { issues: text.issues };
  const parsed = parseFabric(text.raw, opts);
  if (!parsed.fabric) return { issues: [...text.issues, ...parsed.issues] };
  const figures = calculate(parsed.fabric, opts.calc ?? DEFAULT_CALC);
  const issues = [
    ...text.issues,
    ...parsed.issues,
    ...validate(parsed.fabric, figures, opts.validation ?? DEFAULT_VALIDATION),
  ];
  return { fabric: parsed.fabric, figures, issues };
}

/** Find the first ```knit block in a note's text. */
export function findKnitBlock(markdown: string): string | undefined {
  const m = markdown.match(/^(`{3,}|~{3,})knit[^\S\n]*\n([\s\S]*?)\n\1[^\S\n]*$/m);
  return m ? m[2] : undefined;
}
