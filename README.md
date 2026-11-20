# Knitspec

An Obsidian plugin that turns a `knit` code block into an industrial fabric spec for circular weft knitting on single- and double-jersey machines. Each block renders as a card with three tabs:

- **Cam chart** (kam tablosu): the needle set-out (iğne dizilimi) on top, with one box per needle, the first repeat outlined and the repeat count around the bed. Below it, a colour-coded grid laid out like a set-up sheet: one row per track (kapak tracks A′ B′ above silindir tracks), one column per feeder, with the yarn and loop length under each column. Everything needed to set up the machine is in one picture.
- **Knitting diagram** (örgü diyagramı): the yarn path per feeder, with knit, tuck and miss shown on cylinder and dial needles.
- **Spec card** (teknik föy): machine, yarns, composition, kg/h, GSM, width, tightness, machine-hours and validation warnings. Every figure is shown with its inputs.

Labels switch between Turkish and English. Everything runs offline inside the vault, with no network calls and no desktop-only APIs.

See [`docs/notation.md`](docs/notation.md) for the block syntax. [`examples/`](examples) has a sample machine note and article note.

````markdown
```knit
article: SP-1024
structure: single-pique
machine: { type: single-jersey, diameter: 30, gauge: 28, feeders: 96, rpm: 25 }
setout: { cylinder: AB }
cams: { F1: KK, F2: KT, F3: KK, F4: TK }
yarns: { Y1: { count: 75 dtex, material: PES } }
feeds: { F1-F4: { yarn: Y1, loop: 2.9 mm } }
```
````

## Commands

| Command | What it does |
| --- | --- |
| New fabric from template | Inserts a ready block. Built-in: single jersey (plain, plated), single and double piqué, tuck mesh, two- and three-thread fleece, 1×1 and 2×2 rib, interlock, spacer. Your saved templates are listed too |
| Copy fabric values to note properties | Writes article, customer, machine, structure, gauge, GSM, width, composition, kg/h and status into frontmatter, so Bases or Dataview can list them |
| Export cam chart and figures as CSV | For Excel and the production tracker (`;` and decimal comma by default) |
| Save this note's fabric as a template | Adds the block to "Your templates" |
| Switch labels Turkish / English | Toggles the label language |

Each card also has **Save SVG / PNG / CSV** buttons. Obsidian's **Export to PDF** prints every view stacked on one sheet.

## Install with BRAT

1. In Obsidian, install **BRAT** (Obsidian42 - BRAT) from Community plugins and enable it.
2. Run the command **BRAT: Add a beta plugin for testing** and enter `ethemgur/Knitspec`.
3. Enable **Knitspec** under Community plugins.

If the repository is private, BRAT also needs a GitHub personal access token. Put a fine-grained token with read-only **Contents** access to this repository in BRAT's settings.

**New version:** bump `version` in `manifest.json` and `package.json`, add it to `versions.json`, push, then run the **Release** workflow in GitHub Actions. BRAT picks up the new release when you run **BRAT: Check for updates**.

## Manual install

Run `npm install && npm run build`, then copy `main.js`, `manifest.json` and `styles.css` to `<vault>/.obsidian/plugins/knitspec/`.

## Develop

```sh
npm run dev        # esbuild watch → main.js
npm test           # Vitest: parser, calculator, validator, renderers
npm run typecheck
```

The code is split so that everything except `src/main.ts` and `src/settings.ts` is pure TypeScript with no Obsidian imports, which lets it be tested directly:

```
knit block (YAML) ─ parseYaml ─▶ parser.ts ─▶ Fabric model ─┬─▶ calc.ts ──────▶ Figures
                                                             ├─▶ validate.ts ─▶ Issues
                                                             └─▶ render/*.ts ─▶ SVG + spec card ─▶ main.ts (card, exports)
```

## Status against the plan

| Phase | State |
| --- | --- |
| 1. Notation spec | Draft in `docs/notation.md`. Needs a master's review and the 5 real articles |
| 2. MVP single jersey | Done: parser, cam chart, set-out view, needles, kg/h, core validation |
| 3. Diagram and double jersey | Done in code: yarn-path SVG, dial needles, rib, interlock, empty slots. Not yet compared with the NPTEL diagrams or factory samples |
| 4. Spec card and export | Done in code: GSM, width, composition, properties sync, print stylesheet, SVG/PNG/CSV, TR/EN |
| 5. Library and polish | Templates, save-as-template and validation-limit settings are in. **All templates are marked `template-unverified`** until they are checked against real set-up sheets |

The five test fixtures in `tests/fixtures/` are stand-ins. Replace them with the factory's five real articles once the masters' sheets are collected.
