---
tags: [knitspec, çelik-dizilimi]
source: Excel "Ethem Dashboard", sheet "Çelik Dizilimleri"
---
# Çelik dizilimleri: K1825, K2475

Transcribed from the Excel sheet. **How I read it:** each **column is a feeder** (its yarn is written under it in the sheet), and each **row is a needle track** (ray / çelik position). The sheet does not show the needle set-out, machine, loop lengths or RPM, so those are either assumed (marked ⚠) or left out. The card will show "Needs: …" for the missing figures.

---

## K1825

### As in the sheet

| Track \ Feeder | F1 | F2 | F3 | F4 |
|---|---|---|---|---|
| 1 | M | K | M | K |
| 2 | M | K | M | K |
| 3 | K | T | K | M |
| 4 | K | M | K | T |
| **Yarn** | 40/1 Penye | 70/36 Poly | 40/1 Penye | 70/36 Polyester |

**Reading:** a two-face single jersey. Polyester (F2, F4) knits on tracks 1–2 and cotton (F1, F3) knits on tracks 3–4. Polyester tucks on track 3 at F2 and on track 4 at F4, which ties the two yarns together. Every track knits, and no needle holds more than one tuck.

```knit
article: K1825
structure: cotton/polyester two-face single jersey
status: draft-from-excel
machine:
  type: single-jersey   # ⚠ assumed from 4 tracks
  tracks: 4
setout:
  cylinder: ABCD        # ⚠ assumed: sheet does not show the needle order
cams:                   # tracks A B C D = sheet rows 1 2 3 4
  F1: MMKK
  F2: KKTM
  F3: MMKK
  F4: KKMT
yarns:
  Y1: { count: Ne 40/1, material: CO }      # 40/1 penye
  Y2: { count: 70/36 den, material: PES }   # ⚠ read as denier
feeds:
  F1: { yarn: Y1 }
  F2: { yarn: Y2 }
  F3: { yarn: Y1 }
  F4: { yarn: Y2 }
```

---

## K2475

### As in the sheet

| Track \ Feeder | F1 | F2 | F3 | F4 | F5 | F6 | F7 |
|---|---|---|---|---|---|---|---|
| 1 | K | K | K | M | K | K | K |
| 2 | M | M | M | M | M | M | M |
| 3 | M | M | M | M | M | M | M |
| 4 | K | M | K | M | M | M | K |
| 5 | M | M | M | K | K | M | M |
| 6 | M | M | K | M | M | K | K |
| **Yarn** | 150/48 Pol | 70/36 Poly | 30/1 Penye | 150/48 Pol | 70/36 Poly | 30/1 Penye | ⚠ *empty* |

**Reading:** six rows means more tracks than a 4-track single jersey has. I read it as a **double jersey with 2 dial tracks (rows 1–2) and 4 cylinder tracks (rows 3–6)**. Rows 2 and 3 never knit, so I treat them as tracks with no needles. On that reading, the dial knits at almost every feeder (a closed back) and the cylinder tracks make the pattern.

In the block below, dial track A = row 1 and cylinder tracks B C D = rows 4 5 6. The never-knitting rows are left out, because a needle on a track that never knits would be an error.

```knit
article: K2475
structure: cotton/polyester double jersey
status: draft-from-excel
machine:
  type: double-jersey   # ⚠ assumed from 6 track rows
  gating: rib           # ⚠ assumed
setout:
  dial: A               # ⚠ assumed: only dial track used (row 1)
  cylinder: BCD         # ⚠ assumed order: rows 4, 5, 6
cams:                   # dial A = row 1; cylinder B C D = rows 4 5 6
  F1: { dial: K, cyl: KMM }
  F2: { dial: K, cyl: MMM }
  F3: { dial: K, cyl: KMK }
  F4: { dial: M, cyl: MKM }
  F5: { dial: K, cyl: MKM }
  F6: { dial: K, cyl: MMK }
  F7: { dial: K, cyl: KMK }
yarns:
  Y1: { count: 150/48 den, material: PES }  # ⚠ read as denier
  Y2: { count: 70/36 den, material: PES }   # ⚠ read as denier
  Y3: { count: Ne 30/1, material: CO }      # 30/1 penye
feeds:
  F1: { yarn: Y1 }
  F2: { yarn: Y2 }
  F3: { yarn: Y3 }
  F4: { yarn: Y1 }
  F5: { yarn: Y2 }
  F6: { yarn: Y3 }
  # F7: yarn not filled in the sheet
```

The card will show two warnings for K2475:
- **F7 knits but has no yarn.** The sheet's yarn row stops at F6. If the 3-yarn cycle continues, F7 would be 150/48. It also has the same cams as F3 (cotton), so ask which it is.
- **F4: float over 5 positions.** 150/48 PES knits only cylinder track C, so it floats past the other needles. Whether this is real depends on the actual set-out.

---

## To fill in from the machine or the master

- [ ] Rows = tracks and columns = feeders: is that the right reading of the sheet?
- [ ] K2475: is it double jersey? Which rows are dial and which are cylinder?
- [ ] Needle set-out (iğne dizilimi) for both: which butt is on which needle (e.g. 1234 or 1324)?
- [ ] K2475 F7: which yarn? And is the repeat really 7 feeders? It must divide the machine's feeder count.
- [ ] "70/36" and "150/48": denier or dtex?
- [ ] Machine (diameter, gauge, feeders, RPM, needles from the plate) and loop lengths, to get kg/h, GSM and composition.
