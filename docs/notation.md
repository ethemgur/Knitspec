# Knit block notation, v0.1

This is the Phase 1 deliverable from the plan. It is a draft until a knitting master has read the cam chart and agreed it matches the machine.

A fabric is written in a fenced code block tagged `knit`, in YAML. One note holds one article. Only `machine`, `setout` and `cams` are required. The other groups unlock the calculations.

````markdown
```knit
article: SP-1024
customer: "[[Sporthaus GmbH]]"
status: sampling
structure: single-pique
machine:
  type: single-jersey
  diameter: 30        # inch
  gauge: 28           # E, needles per inch
  feeders: 96
  rpm: 25
  efficiency: 0.85
  needles: 2640       # optional: real figure from the machine plate
setout:
  cylinder: AB
cams:                 # one letter per track, tracks in A-B-C-D order
  F1: KK
  F2: KT
  F3: KK
  F4: TK
yarns:
  Y1: { count: 75 dtex, material: PES }
  Y2: { count: 22 dtex, material: EA }
feeds:
  F1-F4: { yarn: Y1, loop: 2.9 mm, plate: Y2, draft: 3 }
fabric:
  grey: { gsm: 165, width: 172 cm, cpc: 21, wpc: 14 }
  finished: { gsm: 180, width: 160 cm }
order_kg: 1500
```
````

## Article

| Key | Meaning |
| --- | --- |
| `article` | Article code from the ERP |
| `customer` | Text or a link to a customer note, e.g. `"[[Sporthaus GmbH]]"` (quote links) |
| `status` | Free text, e.g. `sampling`, `approved`, `in production` |
| `structure` | Free text, e.g. `single-pique` |
| `notes` | Free text shown on the spec card |
| `order_kg` | Order quantity, for machine-hours |

## Machine

| Key | Meaning | Unit |
| --- | --- | --- |
| `type` | `single-jersey` (`sj`, `tek-plaka`) or `double-jersey` (`dj`, `çift-plaka`); `rib` and `interlock` also set the gating | |
| `diameter` | Cylinder diameter | inch |
| `gauge` | E, needles per inch | |
| `dial_gauge` | Only when it is recorded separately. It must equal `gauge` | |
| `feeders` | Feeders on the machine | |
| `rpm` | Revolutions per minute | |
| `efficiency` | `0.85`, `85` or `"85%"`. Default from settings (0.85) | |
| `needles` | Real needles per bed from the machine plate. Overrides π·D·E | |
| `tracks` | Number of needle tracks (butt positions). Set-out letters must stay within them | |
| `gating` | Double jersey: `rib` (default) or `interlock` | |
| `ref` | Link to a machine note | |

**Machine notes.** `machine: "[[M-12]]"` (or `ref: "[[M-12]]"` inside the map) reads `type`, `diameter`, `gauge`, `feeders`, `rpm`, `needles` and `tracks` from the properties of the note `M-12`. Values written in the block override the note's values.

## Needle set-out (iğne dizilimi)

```yaml
setout:
  cylinder: AABB      # one letter per needle, one repeat
  dial: -AA-          # double jersey only
```

- Each letter is the butt/track of one needle. The string is one repeat, and it repeats around the bed.
- `-` (or `.` / `_`) is an empty slot, meaning the needle is taken out. It is used for 2×2 rib and similar set-outs.
- Spaces are ignored: `A B A B` is the same as `ABAB`.
- On a single-jersey machine, `setout: AB` is short for `setout: { cylinder: AB }`.

In the diagram, dial needle *i* is drawn between cylinder needles *i* and *i + 1*.

## Cams (kam dizilimi)

One row per feeder of the repeat, with one letter per track:

| Letter | Stitch | Türkçe |
| --- | --- | --- |
| `K` | knit | ilmek |
| `T` | tuck | askı |
| `M` | miss | atlama |

- **Track order is alphabetical**, so for tracks A and B, `F2: KT` means A = knit and B = tuck. Tracks are the distinct letters used in that bed's set-out.
- The map form works too: `F2: { A: K, B: T }`.
- On double jersey, split each row into beds: `F1: { cyl: KM, dial: MK }`.
- Keys can be ranges or lists: `F1-F4: KK` or `F1,F3: KK`.
- Feeders must run F1…Fn with no gaps. The repeat height n must divide the machine's feeders.
- A row that is all `M` is an empty feeder.

## Yarns

```yaml
yarns:
  Y1: { count: 75/72 dtex, material: PES }
  Y2: { count: Ne 30/1, material: CO }
```

Accepted counts are `dtex` (a bare number is read as dtex), `den`, `tex`, `Ne`, and `Nm`. In `75/72 dtex` the second figure is the filament count and is ignored for mass. In `30/2 Ne` the second figure is the ply, so the yarn is twice as heavy.

## Feeds

```yaml
feeds:
  F1-F4: { yarn: Y1, loop: 2.9 mm, plate: Y2, draft: 3 }
  F5:    { yarn: Y3, loop: 1.6 mm, tuck: 1.2 mm, miss: 0.9 mm }
  F6:    { yarn: Y1, runin: 290 mm }
```

| Key | Meaning |
| --- | --- |
| `yarn` | Main yarn |
| `loop` | Stitch length (ilmek boyu). A bare number is mm |
| `plate` | Plating yarn fed with the main yarn |
| `draft` | Plating yarn draft (e.g. elastane 3). Its relaxed length is loop ÷ draft |
| `tuck` | Yarn length per tuck. Default: setting × loop (0.5) |
| `miss` | Yarn length per missed needle (float). Default: setting × loop (0.3) |
| `runin` | Measured run-in per 100 needles. When given, it replaces the stitch sum |

## Fabric

```yaml
fabric:
  grey:     { gsm: 165, width: 172 cm, cpc: 21, wpc: 14 }
  finished: { gsm: 180, width: 160 cm, cpc: 24, wpc: 16 }
```

Grey (ham) and finished (mamul) are kept apart because dyeing and finishing change GSM and width. `width` is open width; `cm` is assumed. `cpc` counts **feeder rows per cm**, meaning one course for each row of the cam chart. `wpc` counts face wales per cm.

## Calculations

All figures are estimates, shown with their inputs.

- **Needles** N = π × D × E, unless `needles` is given.
- **Yarn per feeder and revolution** = Σ over beds and needles of the stitch length (knit = loop, tuck = `tuck`, miss = `miss`). On double jersey, a bed counts only when the feeder knits or tucks on it.
- **Production** P (kg/h) = RPM × 60 × η × Σ feeders (length × tex) / 10⁹. For plain jersey this is the plan's formula: RPM × F × N × L × T × 60 × η / 10⁹.
- **GSM** = CPC × WPC × 10⁴ × (mass per face wale per feeder row). For plain jersey this is CPC × WPC × L × T / 100. On double jersey, both beds' loops count against each face wale.
- **Composition**: each material's mass share of the yarn per repeat.
- **Width**: open = needles in action on the cylinder ÷ WPC; flat tube = half of that.
- **Machine-hours** = `order_kg` ÷ P.
- **Tightness factor** = √tex ÷ loop (mm), for each yarn and loop.

## Validation

| Rule | Level |
| --- | --- |
| Every needle (track, per bed) knits at least once per repeat | Error |
| Feeder repeat divides the machine's feeders | Error |
| Set-out width divides the needle count (suggests the nearest multiple) | Warning |
| Cam strings match the tracks used in the set-out; letters are K/T/M | Error |
| Tucks held before the next knit > limit (default 2). Misses do not clear the hook | Warning |
| Float over consecutive missed needles on one feeder > limit (default 3) | Warning |
| Loop length, gauge, rpm, diameter, efficiency in sane ranges | Warning |
| Double jersey: dial set-out and dial cams present, gauges equal | Error |
| Knitting feeder without a feed | Warning |
| Entered grey GSM differs from the calculated GSM by more than 15% | Warning |

The limits are plugin settings.

## Open questions for the floor

- How many tracks each Mayer machine has, and whether the masters call them A–D, 1–4, or by butt height.
- Whether the masters read feeders top-down (F1 first, as in the cam chart and diagram here) or bottom-up.
- Whether `cpc` should count visible courses instead of feeder rows. On piqué, one visible course is two feeders.
