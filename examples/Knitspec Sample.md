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
machine: SJ 30" E28 96F 25rpm 85% 2 tracks
needles: 2640
cylinder: AB

A     K   K   K   T
B     K   T   K   K
F     Y1+Y2
L     2.9

Y1 = 75/72 dtex PES
Y2 = 22 dtex EA draft 3
grey: 165 gsm 172 cm 51 cpc 15.5 wpc
finished: 180 gsm 160 cm
order: 1500 kg
notes: Elastane draft 3. Check run-in on F2 and F4 after the first roll.
```

## 2. Two-thread fleece (French terry)

Four tracks (A–D). The loop yarn tucks on one needle in four and floats over the other three.

```knit
article: FL-2210
status: approved
structure: two-thread-fleece
machine: SJ 30" E20 96F 22rpm 4 tracks
needles: 1884
cylinder: ABCD

A     T   K   M   K
B     M   K   M   K
C     M   K   T   K
D     M   K   M   K
F     Y2  Y1  Y2  Y1
L     1.6 2.7 1.6 2.7

Y1 = Ne 30/1 CO
Y2 = Ne 20/1 CO
grey: 18 cpc 11 wpc
```

## 3. 2×2 rib (double jersey)

`-` marks an empty needle slot. The dial needles sit between the cylinder needles (rib gating).

```knit
article: RB-0450
status: sampling
structure: rib-2x2
machine: rib 30" E18 60F 22rpm
needles: 1692
cylinder: AA--
dial: -AA-

kapak
A     K
silindir
A     K
F     Y1
L     3.0

Y1 = Ne 30/1 CO
grey: 14 cpc 9 wpc
```

## 4. Interlock

Long (A) and short (B) needles. Each feeder knits 1×1 rib on alternate needles, and two feeders make one interlock course.

```knit
article: IL-3300
status: in production
structure: interlock
machine: interlock 30" E24 72F 24rpm
needles: 2256
cylinder: AB
dial: BA

kapak
A     K   M
B     M   K
silindir
A     K   M
B     M   K
F     Y1
L     1.7

Y1 = Ne 40/1 CO
grey: 16 cpc 12 wpc
order: 800 kg
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
machine: SJ 30" E28 96F 25rpm
cylinder: ABC

A     T   T   T   K   K
B     M   M   M   M   M
C     K   K   K   K   K
F     Y1
L     29

Y1 = 75 dtex PES
```

## Try next

- **Knitspec: Copy fabric values to note properties** writes the first block's article, machine, GSM and other values into this note's properties.
- **Knitspec: New fabric from template** inserts a ready block for 11 common structures.
- **File → Export to PDF** prints every view stacked on one sheet (teknik föy).
