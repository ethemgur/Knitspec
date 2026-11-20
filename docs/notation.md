# Knit block notation, v0.5

A fabric is written in a fenced code block tagged `knit`. It is written like a set-up sheet (çelik dizilimi): **one row per track, one column per feeder**, with the yarn and loop length under each feeder. Everything else is a short `key: value` line. Only the cam rows are required. Each extra line unlocks more checks and figures.

This is a draft until a knitting master has read a cam chart and agreed it matches the machine.

````markdown
```knit
article: SP-1024
customer: [[Sporthaus GmbH]]
status: sampling
structure: lakost
machine: SJ 30" E28 96F 25rpm 85%
needles: 2640
cylinder: AB

      F1 F2 F3 F4
A     K  K  K  T
B     K  T  K  K
yarn  Y1+Y2
loop  2.9

Y1 = 75/72 dtex PES
Y2 = 22 dtex likra draft 3

grey: 165 gsm 172 cm 21 cpc 14 wpc
finished: 180 gsm 160 cm
order: 1500 kg
```
````

Lines can come in any order. Blank lines are ignored, and `#` starts a comment. Turkish keywords work too (shown in brackets below).

## Cam grid

```
      F1 F2 F3 F4        ← feeder header (optional)
A     K  K  K  T         ← one row per silindir track
B     K  T  K  K
A'    M  K  M  K         ← kapak (dial) tracks carry an apostrophe
```

| Cell | Stitch | Türkçe |
| --- | --- | --- |
| `K` | knit | ilmek |
| `T` | tuck | askı |
| `M` (or `-`) | miss | atlama |

- **Tracks** can be letters (`A B C D`) or butt numbers (`1 2 3 4`); `1` is the same as `A`. Kapak tracks are `A'` / `1'`.
- **Cells** can be spaced (`K T K M`) or packed (`KTKM`).
- **The feeder header** is optional. Without it, the width of the first row sets the number of feeders.
- **Rows that never knit** are fine: a track with no needles can stay in the grid, as on a factory sheet.
- **The repeat height** is the number of columns. It must divide the machine's feeder count.

## Feed rows

Under the grid, one value per feeder, or **one value for all feeders**:

```
yarn  Y2  Y1  Y2  Y1     (iplik)
loop  1.6 2.7 1.6 2.7    (ilmek) mm
runin 290                (sarfiyat) measured run-in, mm per 100 needles
```

- **`Y1+Y2`** means Y2 is plated with Y1.
- **`-`** means the feeder has no yarn (an empty feeder).
- **When `runin` is given,** it replaces the stitch-length sum.

## Yarns

```
Y1 = 40/1 Penye
Y2 = 70/36 Poly
Y3 = 22 dtex likra draft 3
Y4 = 75/72 dtex PES
```

Write yarns the way the factory does:

- **Materials:** `Penye`, `pamuk`, `karde` → CO; `Poly`, `Pol`, `polyester` → PES; `likra`, `elastan` → EA; `viskon` → CV; `naylon` → PA. Any other word is kept as written.
- **Counts without a unit:** read as **Ne** for cotton and viscose (`40/1 Penye` = Ne 40/1) and as **denier** for filament yarns (`70/36 Poly` = 70 den, 36 filaments).
- **Counts with a unit:** add the unit to be explicit, e.g. `dtex`, `den`, `tex`, `Ne`, `Nm`. In `30/2 Ne` the 2 is the ply, so the yarn is twice as heavy.
- **`draft 3`** on an elastane yarn: when it is plated, its relaxed length is loop ÷ draft.

## Lines

| Line | Meaning |
| --- | --- |
| `article:` (artikel) | Article code |
| `customer:` (müşteri) | Text or a link: `[[Sporthaus GmbH]]` |
| `status:` (durum), `structure:` (örgü), `notes:` (not) | Free text |
| `order:` (sipariş) | Order quantity, e.g. `1500 kg`, for machine-hours |
| `machine:` (makine) | See below |
| `needles:` (iğne) | Real needles per bed from the machine plate. Overrides π·D·E |
| `cylinder:` (silindir) | Silindir needle set-out, one letter per needle, one repeat: `AB`, `1234`, `AA--` |
| `dial:` (kapak) | Kapak needle set-out: `B'A'` or `BA`, `-A'A'-` |
| `grey:` (ham), `finished:` (mamul) | e.g. `165 gsm 172 cm 21 cpc 14 wpc` |

In set-outs, `-` is an empty slot (needle taken out). If `cylinder:` is missing, the plugin assumes the tracks that knit, in row order, and shows a warning, because that needle order is a guess.

## Machine line

```
machine: SJ 30" E28 96F 25rpm 85% 4 tracks
machine: interlok 30 pus E24 72 besleyici 24 devir
machine: [[M-12]] 22rpm
```

| Token | Meaning |
| --- | --- |
| `SJ` / `tek`, `DJ` / `çift` | Single or double jersey. If omitted, kapak rows mean double jersey |
| `rib` / `ribana`, `interlock` / `interlok` | Double jersey with that gating. Rib: kapak needles sit between silindir needles. Interlock: directly opposite |
| `30"`, `30 pus` | Diameter in inches |
| `E28` | Gauge |
| `96F`, `96 besleyici` | Feeders |
| `25rpm`, `25 devir` | RPM |
| `85%` | Efficiency (default from settings: 85%) |
| `4 tracks`, `4 ray` | Needle tracks; set-out tracks must stay within them |
| `[[M-12]]` | Machine note: reads `type`, `diameter`, `gauge`, `feeders`, `rpm`, `needles`, `tracks` from its properties. Values on the line win |

## Display

- **Cam chart (kam tablosu):** the set-out strip on top, then the cam grid laid out as written: kapak rows above silindir rows, yarn and loop under each feeder. Settings control:
  - letters K/T/M or textbook cam symbols (∧ knit, ⏜ tuck, — miss);
  - track names A–D or 1–4;
  - whether the first track is the top or the bottom row.
- **Knitting diagram (örgü diyagramı):** standard needle notation. F1 is at the bottom and the last feeder at the top. Knit is an open loop round the needle, tuck a shallow loop that only reaches the hook, and miss a straight line. Kapak needles sit above the yarn, silindir needles below.

## Calculations

All figures are estimates, shown with their inputs.

- **Needles:** N = π × D × E, unless `needles:` is given.
- **Yarn per feeder and revolution:** the sum over beds and needles of the stitch length (knit = loop; tuck and miss = settings × loop). On double jersey, a bed counts only when the feeder knits or tucks on it.
- **Production:** P (kg/h) = RPM × 60 × η × Σ feeders (length × tex) / 10⁹.
- **GSM:** CPC × WPC × 10⁴ × (mass per face wale per feeder row). For plain jersey this is CPC × WPC × L × T / 100. `cpc` counts feeder rows per cm.
- **Composition:** each material's mass share of the yarn per repeat.
- **Width:** open = needles in action on the silindir ÷ WPC; flat tube = half of that.
- **Machine-hours:** order kg ÷ P.
- **Tightness factor:** √tex ÷ loop (mm).

## Checks

| Rule | Level |
| --- | --- |
| Every track in the set-out knits at least once per repeat | Error |
| Repeat height divides the machine's feeder count | Error |
| Set-out width divides the needle count (suggests the nearest multiple) | Warning |
| Every cam row has one cell per feeder; set-out tracks have a cam row | Error |
| A track has cams but no needles in the set-out | Warning |
| Set-out not given, so it was assumed | Warning |
| Tucks held before the next knit > limit (default 2) | Warning |
| Float over consecutive missed needles > limit (default 3) | Warning |
| Interlock gating: facing needles both knit or tuck at one feeder | Error |
| Loop length, gauge, rpm, diameter, efficiency in sane ranges | Warning |
| Knitting feeder without a yarn | Warning |
| Entered grey GSM differs from the calculated GSM by more than 15% | Warning |
| A line that is not understood | Warning |

The limits are plugin settings.

## Open questions for the floor

- How the masters name and count tracks (A–D or 1–4; from the top or the bottom butt). The display settings can then match.
- Whether bare polyester counts on their sheets are denier (assumed) or dtex.
- Whether `cpc` should count visible courses instead of feeder rows. On piqué, one visible course is two feeders.
