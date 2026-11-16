---
tags: [knitspec, sample]
---
# Knitspec sample

Drop this note into your vault and open it in reading view (or Live Preview with the cursor outside the blocks). Each `knit` block below renders as a card with four tabs: **Knitting diagram**, **Cam chart**, **Needle set-out**, **Spec card**. Use the command **Knitspec: Switch labels Turkish / English** to change the language.

## 1. Single piqué (Lacoste), plated with elastane

Single jersey, 30" E28, two needle tracks (A, B). The four cam rows repeat 24 times around the 96 feeders.

```knit
article: SP-1024
customer: Sample Customer
status: sampling
structure: single-pique
machine:
  type: single-jersey
  diameter: 30        # inch
  gauge: 28           # E
  feeders: 96
  rpm: 25
  efficiency: 0.85
  needles: 2640       # from the machine plate
  tracks: 2
setout:
  cylinder: AB
cams:                 # one letter per track: A B
  F1: KK
  F2: KT
  F3: KK
  F4: TK
yarns:
  Y1: { count: 75/72 dtex, material: PES }
  Y2: { count: 22 dtex, material: EA }
feeds:
  F1-F4: { yarn: Y1, loop: 2.9 mm, plate: Y2, draft: 3 }
fabric:
  grey: { gsm: 165, width: 172 cm, cpc: 51, wpc: 15.5 }   # cpc = feeder rows per cm
  finished: { gsm: 180, width: 160 cm }
order_kg: 1500
notes: Elastane draft 3. Check run-in on F2 and F4 after the first roll.
```

## 2. Two-thread fleece (French terry)

Four tracks (A–D). The loop yarn tucks on one needle in four and floats over the other three.

```knit
article: FL-2210
status: approved
structure: two-thread-fleece
machine:
  type: single-jersey
  diameter: 30
  gauge: 20
  feeders: 96
  rpm: 22
  needles: 1884
  tracks: 4
setout:
  cylinder: ABCD
cams:                 # tracks A B C D
  F1: TMMM            # loop yarn tucks on A
  F2: KKKK            # ground
  F3: MMTM            # loop yarn tucks on C
  F4: KKKK
yarns:
  Y1: { count: Ne 30/1, material: CO }
  Y2: { count: Ne 20/1, material: CO }
feeds:
  F1: { yarn: Y2, loop: 1.6 mm }
  F2: { yarn: Y1, loop: 2.7 mm }
  F3: { yarn: Y2, loop: 1.6 mm }
  F4: { yarn: Y1, loop: 2.7 mm }
fabric:
  grey: { cpc: 18, wpc: 11 }
```

## 3. 2×2 rib (double jersey)

`-` marks an empty needle slot. The dial needles sit between the cylinder needles (rib gating).

```knit
article: RB-0450
status: sampling
structure: rib-2x2
machine:
  type: double-jersey
  gating: rib
  diameter: 30
  gauge: 18
  feeders: 60
  rpm: 22
  needles: 1692
setout:
  cylinder: AA--
  dial: -AA-
cams:
  F1: { cyl: K, dial: K }
yarns:
  Y1: { count: Ne 30/1, material: CO }
feeds:
  F1: { yarn: Y1, loop: 3.0 mm }
fabric:
  grey: { cpc: 14, wpc: 9 }
```

## 4. Interlock

Long (A) and short (B) needles. Each feeder knits 1×1 rib on alternate needles, and two feeders make one interlock course.

```knit
article: IL-3300
status: in production
structure: interlock
machine:
  type: interlock
  diameter: 30
  gauge: 24
  feeders: 72
  rpm: 24
  needles: 2256
setout:
  cylinder: AB
  dial: BA
cams:                 # tracks A B
  F1: { cyl: KM, dial: KM }
  F2: { cyl: MK, dial: MK }
yarns:
  Y1: { count: Ne 40/1, material: CO }
feeds:
  F1-F2: { yarn: Y1, loop: 1.7 mm }
fabric:
  grey: { cpc: 16, wpc: 12 }
order_kg: 800
```

## 5. Validation demo (intentional mistakes)

This block is wrong on purpose, so you can see the checks on the spec card:

- Track B never knits.
- Track A holds three tucks in a row.
- The 3-needle set-out does not divide the 2,639 needles.
- The five-feeder repeat does not divide 96 feeders.
- The loop length is typed in cm instead of mm.

```knit
article: TEST-ERR
structure: broken-on-purpose
machine: { type: single-jersey, diameter: 30, gauge: 28, feeders: 96, rpm: 25 }
setout: { cylinder: ABC }
cams:                 # tracks A B C
  F1: TMK
  F2: TMK
  F3: TMK
  F4: KMK
  F5: KMK
yarns: { Y1: { count: 75 dtex, material: PES } }
feeds: { F1-F5: { yarn: Y1, loop: 29 } }
```

## Try next

- **Knitspec: Copy fabric values to note properties** writes the first block's article, machine, GSM and other values into this note's properties.
- **Knitspec: New fabric from template** inserts a ready block for 11 common structures.
- **File → Export to PDF** prints every view stacked on one sheet (teknik föy).
